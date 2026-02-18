/**
 * Adaptive Retry System
 * Uses Harmonic Math patterns for intelligent retry strategies
 * 
 * Naming: "Adaptive" for Intelink (dry/technical)
 * Framework equivalent: "Sacred Retry" (spiritual)
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS (Inline to avoid package dependency for now)
// When @egos/harmonic-math is published to npm, import from there
// ═══════════════════════════════════════════════════════════════════════════

/** Golden Ratio (φ) */
const PHI = 1.618033988749895;

/** Fibonacci sequence for intervals */
const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];

/** Tesla pattern for concurrency */
const TESLA_CONCURRENCY = { light: 3, normal: 6, heavy: 9, intensive: 12 };

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface RetryConfig {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  strategy?: 'fibonacci' | 'golden' | 'linear';
  onRetry?: (attempt: number, error: Error, nextDelayMs: number) => void;
}

export interface FetchWithRetryOptions extends RetryConfig {
  timeout?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DELAY CALCULATORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate delay using Fibonacci sequence
 * Natural growth pattern - gentle escalation
 */
function fibonacciDelay(attempt: number, baseMs: number, maxMs: number): number {
  const fibIndex = Math.min(attempt, FIBONACCI.length - 1);
  const delay = baseMs * FIBONACCI[fibIndex];
  return Math.min(delay, maxMs);
}

/**
 * Calculate delay using Golden Ratio
 * Exponential growth with φ - balanced escalation
 */
function goldenDelay(attempt: number, baseMs: number, maxMs: number): number {
  const delay = baseMs * Math.pow(PHI, attempt);
  return Math.min(Math.round(delay), maxMs);
}

/**
 * Calculate delay using linear backoff
 * Simple escalation - predictable
 */
function linearDelay(attempt: number, baseMs: number, maxMs: number): number {
  const delay = baseMs * (attempt + 1);
  return Math.min(delay, maxMs);
}

/**
 * Get delay based on strategy
 */
function getDelay(
  attempt: number,
  baseMs: number,
  maxMs: number,
  strategy: 'fibonacci' | 'golden' | 'linear'
): number {
  switch (strategy) {
    case 'fibonacci':
      return fibonacciDelay(attempt, baseMs, maxMs);
    case 'golden':
      return goldenDelay(attempt, baseMs, maxMs);
    case 'linear':
      return linearDelay(attempt, baseMs, maxMs);
    default:
      return fibonacciDelay(attempt, baseMs, maxMs);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RETRY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute a function with adaptive retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = 5,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    strategy = 'fibonacci',
    onRetry
  } = config;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts - 1) {
        const delay = getDelay(attempt, baseDelayMs, maxDelayMs, strategy);
        
        if (onRetry) {
          onRetry(attempt + 1, lastError, delay);
        }

        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Fetch with timeout and adaptive retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    strategy = 'fibonacci',
    timeout = 30000,
    onRetry,
    ...fetchOptions
  } = options;

  return withRetry(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });

        if (!response.ok && response.status >= 500) {
          throw new Error(`Server error: ${response.status}`);
        }

        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    { maxAttempts, baseDelayMs, maxDelayMs, strategy, onRetry }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process items in Fibonacci-sized batches
 * Starts small, grows naturally
 */
export async function processBatches<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  options: { maxBatchSize?: number; concurrency?: keyof typeof TESLA_CONCURRENCY } = {}
): Promise<R[]> {
  const { maxBatchSize = 89, concurrency = 'normal' } = options;
  const results: R[] = [];
  
  let processed = 0;
  let batchIndex = 0;

  while (processed < items.length) {
    // Fibonacci batch size (capped at max)
    const fibSize = FIBONACCI[Math.min(batchIndex + 2, FIBONACCI.length - 1)];
    const batchSize = Math.min(fibSize, maxBatchSize, items.length - processed);
    
    const batch = items.slice(processed, processed + batchSize);
    const batchResults = await processor(batch);
    
    results.push(...batchResults);
    processed += batchSize;
    batchIndex++;
  }

  return results;
}

/**
 * Execute functions with Tesla-aligned concurrency
 */
export async function withConcurrency<T>(
  tasks: (() => Promise<T>)[],
  level: keyof typeof TESLA_CONCURRENCY = 'normal'
): Promise<T[]> {
  const concurrency = TESLA_CONCURRENCY[level];
  const results: T[] = [];
  
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(task => task()));
    results.push(...batchResults);
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMEOUT PRESETS
// ═══════════════════════════════════════════════════════════════════════════

/** Golden Ratio-based timeouts (ms) */
export const TIMEOUTS = {
  instant: 100,
  fast: Math.round(100 * PHI),         // ~162ms
  normal: Math.round(100 * PHI * PHI), // ~262ms
  slow: Math.round(100 * Math.pow(PHI, 3)),    // ~424ms
  patient: Math.round(100 * Math.pow(PHI, 4)), // ~686ms
  api: 30000,    // 30s for API calls
  llm: 60000,    // 60s for LLM calls
  extraction: 120000, // 2min for document extraction
} as const;

/** Retry presets for different use cases */
export const RETRY_PRESETS = {
  /** Quick operations - fail fast */
  quick: { maxAttempts: 2, baseDelayMs: 500, strategy: 'linear' as const },
  /** Normal API calls */
  normal: { maxAttempts: 3, baseDelayMs: 1000, strategy: 'fibonacci' as const },
  /** Important operations - more patience */
  important: { maxAttempts: 5, baseDelayMs: 1000, strategy: 'fibonacci' as const },
  /** Critical operations - maximum resilience */
  critical: { maxAttempts: 8, baseDelayMs: 2000, strategy: 'golden' as const },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a debounced function with Golden Ratio timing
 */
export function goldenDebounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  baseMs: number = 100
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  const delay = Math.round(baseMs * PHI);

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Create a throttled function with Tesla timing
 */
export function teslaThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  intervalMs: number = 369
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= intervalMs) {
      lastCall = now;
      fn(...args);
    }
  };
}
