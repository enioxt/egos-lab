import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withRetry,
  fetchWithRetry,
  processBatches,
  withConcurrency,
  goldenDebounce,
  teslaThrottle,
  TIMEOUTS,
  RETRY_PRESETS,
} from './adaptive-retry';

describe('Constants', () => {
  describe('TIMEOUTS', () => {
    it('should have all presets', () => {
      expect(TIMEOUTS.instant).toBe(100);
      expect(TIMEOUTS.fast).toBeGreaterThan(TIMEOUTS.instant);
      expect(TIMEOUTS.normal).toBeGreaterThan(TIMEOUTS.fast);
      expect(TIMEOUTS.slow).toBeGreaterThan(TIMEOUTS.normal);
      expect(TIMEOUTS.patient).toBeGreaterThan(TIMEOUTS.slow);
      expect(TIMEOUTS.api).toBe(30000);
      expect(TIMEOUTS.llm).toBe(60000);
      expect(TIMEOUTS.extraction).toBe(120000);
    });

    it('should follow Golden Ratio progression', () => {
      const PHI = 1.618;
      expect(TIMEOUTS.fast / TIMEOUTS.instant).toBeCloseTo(PHI, 1);
      expect(TIMEOUTS.normal / TIMEOUTS.fast).toBeCloseTo(PHI, 1);
    });
  });

  describe('RETRY_PRESETS', () => {
    it('should have all presets', () => {
      expect(RETRY_PRESETS.quick).toBeDefined();
      expect(RETRY_PRESETS.normal).toBeDefined();
      expect(RETRY_PRESETS.important).toBeDefined();
      expect(RETRY_PRESETS.critical).toBeDefined();
    });

    it('should have increasing maxAttempts', () => {
      expect(RETRY_PRESETS.quick.maxAttempts).toBeLessThan(RETRY_PRESETS.normal.maxAttempts);
      expect(RETRY_PRESETS.normal.maxAttempts).toBeLessThan(RETRY_PRESETS.important.maxAttempts);
      expect(RETRY_PRESETS.important.maxAttempts).toBeLessThan(RETRY_PRESETS.critical.maxAttempts);
    });
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should succeed on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const promise = withRetry(fn);
    await vi.runAllTimersAsync();
    const result = await promise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');
    
    const promise = withRetry(fn, { maxAttempts: 5, baseDelayMs: 100 });
    await vi.runAllTimersAsync();
    const result = await promise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    
    try {
      const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 100 });
      await vi.runAllTimersAsync();
      await promise;
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).toBe('always fails');
      expect(fn).toHaveBeenCalledTimes(3);
    }
  });

  it('should call onRetry callback', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    const promise = withRetry(fn, { 
      maxAttempts: 3, 
      baseDelayMs: 100,
      onRetry 
    });
    await vi.runAllTimersAsync();
    await promise;
    
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), expect.any(Number));
  });

  it('should use fibonacci strategy', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockRejectedValueOnce(new Error('3'))
      .mockResolvedValue('success');
    
    const promise = withRetry(fn, {
      maxAttempts: 5,
      baseDelayMs: 1000,
      strategy: 'fibonacci',
      onRetry
    });
    await vi.runAllTimersAsync();
    await promise;
    
    // Fibonacci delays: 1000, 1000, 2000
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error), 1000);
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error), 1000);
    expect(onRetry).toHaveBeenNthCalledWith(3, 3, expect.any(Error), 2000);
  });

  it('should use golden strategy', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockResolvedValue('success');
    
    const promise = withRetry(fn, {
      maxAttempts: 5,
      baseDelayMs: 100,
      strategy: 'golden',
      onRetry
    });
    await vi.runAllTimersAsync();
    await promise;
    
    // Golden delays: 100, 162
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error), 100);
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error), expect.any(Number));
  });

  it('should respect maxDelayMs', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockRejectedValueOnce(new Error('3'))
      .mockRejectedValueOnce(new Error('4'))
      .mockResolvedValue('success');
    
    const promise = withRetry(fn, {
      maxAttempts: 10,
      baseDelayMs: 1000,
      maxDelayMs: 3000,
      strategy: 'fibonacci',
      onRetry
    });
    await vi.runAllTimersAsync();
    await promise;
    
    // All delays should be <= 3000
    onRetry.mock.calls.forEach(call => {
      expect(call[2]).toBeLessThanOrEqual(3000);
    });
  });
});

describe('processBatches', () => {
  it('should process items in batches', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const processor = vi.fn().mockImplementation(batch => 
      Promise.resolve(batch.map((n: number) => n * 2))
    );
    
    const results = await processBatches(items, processor);
    
    expect(results).toHaveLength(10);
    expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
    expect(processor).toHaveBeenCalled();
  });

  it('should grow batch sizes with Fibonacci', async () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const batchSizes: number[] = [];
    
    const processor = vi.fn().mockImplementation(batch => {
      batchSizes.push(batch.length);
      return Promise.resolve(batch);
    });
    
    await processBatches(items, processor, { maxBatchSize: 21 });
    
    // First batches should be small, then grow
    expect(batchSizes[0]).toBeLessThanOrEqual(batchSizes[batchSizes.length - 1]);
  });

  it('should respect maxBatchSize', async () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const batchSizes: number[] = [];
    
    const processor = vi.fn().mockImplementation(batch => {
      batchSizes.push(batch.length);
      return Promise.resolve(batch);
    });
    
    await processBatches(items, processor, { maxBatchSize: 10 });
    
    batchSizes.forEach(size => {
      expect(size).toBeLessThanOrEqual(10);
    });
  });
});

describe('withConcurrency', () => {
  it('should execute tasks with limited concurrency', async () => {
    const results: number[] = [];
    const tasks = [1, 2, 3, 4, 5, 6].map(n => 
      async () => {
        results.push(n);
        return n * 2;
      }
    );
    
    const output = await withConcurrency(tasks, 'light'); // concurrency 3
    
    expect(output).toEqual([2, 4, 6, 8, 10, 12]);
    expect(results).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should respect concurrency levels', async () => {
    let maxConcurrent = 0;
    let currentConcurrent = 0;
    
    const tasks = Array.from({ length: 12 }, () => 
      async () => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        await new Promise(r => setTimeout(r, 10));
        currentConcurrent--;
        return 1;
      }
    );
    
    await withConcurrency(tasks, 'normal'); // concurrency 6
    
    expect(maxConcurrent).toBeLessThanOrEqual(6);
  });
});

describe('goldenDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce function calls', async () => {
    const fn = vi.fn();
    const debounced = goldenDebounce(fn, 100);
    
    debounced();
    debounced();
    debounced();
    
    expect(fn).not.toHaveBeenCalled();
    
    await vi.advanceTimersByTimeAsync(200);
    
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use Golden Ratio for delay', async () => {
    const fn = vi.fn();
    const debounced = goldenDebounce(fn, 100);
    
    debounced();
    
    // After 150ms (less than 100 * 1.618), should not have called
    await vi.advanceTimersByTimeAsync(150);
    expect(fn).not.toHaveBeenCalled();
    
    // After 170ms total (more than 162), should have called
    await vi.advanceTimersByTimeAsync(20);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('teslaThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should throttle function calls', async () => {
    const fn = vi.fn();
    const throttled = teslaThrottle(fn, 369);
    
    throttled();
    throttled();
    throttled();
    
    expect(fn).toHaveBeenCalledTimes(1);
    
    await vi.advanceTimersByTimeAsync(369);
    
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use Tesla interval', async () => {
    const fn = vi.fn();
    const throttled = teslaThrottle(fn); // default 369ms
    
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
    
    await vi.advanceTimersByTimeAsync(300);
    throttled();
    expect(fn).toHaveBeenCalledTimes(1); // Still throttled
    
    await vi.advanceTimersByTimeAsync(100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2); // Now allowed
  });
});

describe('Edge Cases', () => {
  it('withRetry should handle non-Error throws', async () => {
    const fn = vi.fn().mockRejectedValue('string error');
    
    await expect(
      withRetry(fn, { maxAttempts: 2, baseDelayMs: 10 })
    ).rejects.toThrow();
  });

  it('processBatches should handle empty array', async () => {
    const processor = vi.fn().mockResolvedValue([]);
    const results = await processBatches([], processor);
    
    expect(results).toEqual([]);
    expect(processor).not.toHaveBeenCalled();
  });

  it('withConcurrency should handle empty tasks', async () => {
    const results = await withConcurrency([]);
    expect(results).toEqual([]);
  });
});
