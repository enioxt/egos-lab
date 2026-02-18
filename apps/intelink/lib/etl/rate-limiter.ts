/**
 * ETL Rate Limiter
 * 
 * Smart throttling for government API calls.
 * Implements "Do No Harm" policy - never overwhelm external systems.
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitConfig {
    /** Requests per minute */
    requestsPerMinute: number;
    /** Requests per hour */
    requestsPerHour: number;
    /** Minimum delay between requests (ms) */
    minDelayMs: number;
    /** Maximum concurrent requests */
    maxConcurrent: number;
    /** Backoff multiplier on 429/503 errors */
    backoffMultiplier: number;
    /** Maximum backoff delay (ms) */
    maxBackoffMs: number;
}

export interface RateLimitState {
    requestsThisMinute: number;
    requestsThisHour: number;
    minuteStartTime: number;
    hourStartTime: number;
    currentDelay: number;
    consecutiveErrors: number;
    activeRequests: number;
}

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
    // Very conservative - for sensitive government systems
    government_sensitive: {
        requestsPerMinute: 10,
        requestsPerHour: 100,
        minDelayMs: 6000,      // 6 seconds between requests
        maxConcurrent: 1,      // Serial only
        backoffMultiplier: 3,
        maxBackoffMs: 300000   // 5 minutes max
    },
    // Standard government API
    government_standard: {
        requestsPerMinute: 30,
        requestsPerHour: 500,
        minDelayMs: 2000,      // 2 seconds
        maxConcurrent: 2,
        backoffMultiplier: 2,
        maxBackoffMs: 120000   // 2 minutes max
    },
    // Public data sources (less strict)
    public_api: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        minDelayMs: 500,
        maxConcurrent: 5,
        backoffMultiplier: 2,
        maxBackoffMs: 60000
    },
    // Internal/test systems
    internal: {
        requestsPerMinute: 120,
        requestsPerHour: 5000,
        minDelayMs: 100,
        maxConcurrent: 10,
        backoffMultiplier: 1.5,
        maxBackoffMs: 30000
    }
};

// ============================================================================
// RATE LIMITER CLASS
// ============================================================================

export class ETLRateLimiter {
    private config: RateLimitConfig;
    private state: RateLimitState;
    private name: string;
    private queue: Array<() => Promise<void>> = [];
    private processing = false;

    constructor(name: string, config: RateLimitConfig | keyof typeof RATE_LIMIT_PRESETS) {
        this.name = name;
        this.config = typeof config === 'string' 
            ? RATE_LIMIT_PRESETS[config] 
            : config;
        
        this.state = {
            requestsThisMinute: 0,
            requestsThisHour: 0,
            minuteStartTime: Date.now(),
            hourStartTime: Date.now(),
            currentDelay: this.config.minDelayMs,
            consecutiveErrors: 0,
            activeRequests: 0
        };
    }

    /**
     * Execute a rate-limited request
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        // Wait for slot
        await this.waitForSlot();

        // Execute with tracking
        this.state.activeRequests++;
        
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error: any) {
            this.onError(error);
            throw error;
        } finally {
            this.state.activeRequests--;
        }
    }

    /**
     * Wait for an available slot
     */
    private async waitForSlot(): Promise<void> {
        // Reset counters if time window passed
        const now = Date.now();
        
        if (now - this.state.minuteStartTime >= 60000) {
            this.state.requestsThisMinute = 0;
            this.state.minuteStartTime = now;
        }
        
        if (now - this.state.hourStartTime >= 3600000) {
            this.state.requestsThisHour = 0;
            this.state.hourStartTime = now;
        }

        // Check limits
        while (
            this.state.requestsThisMinute >= this.config.requestsPerMinute ||
            this.state.requestsThisHour >= this.config.requestsPerHour ||
            this.state.activeRequests >= this.config.maxConcurrent
        ) {
            const waitTime = this.calculateWaitTime();
            console.log(`[RateLimiter:${this.name}] Waiting ${waitTime}ms (${this.state.requestsThisMinute}/${this.config.requestsPerMinute} rpm)`);
            await this.sleep(waitTime);
            
            // Re-check time windows
            const afterWait = Date.now();
            if (afterWait - this.state.minuteStartTime >= 60000) {
                this.state.requestsThisMinute = 0;
                this.state.minuteStartTime = afterWait;
            }
            if (afterWait - this.state.hourStartTime >= 3600000) {
                this.state.requestsThisHour = 0;
                this.state.hourStartTime = afterWait;
            }
        }

        // Apply minimum delay
        await this.sleep(this.state.currentDelay);

        // Increment counters
        this.state.requestsThisMinute++;
        this.state.requestsThisHour++;
    }

    /**
     * Calculate wait time based on current state
     */
    private calculateWaitTime(): number {
        // If at minute limit, wait until next minute
        if (this.state.requestsThisMinute >= this.config.requestsPerMinute) {
            const elapsed = Date.now() - this.state.minuteStartTime;
            return Math.max(60000 - elapsed + 1000, 1000);
        }
        
        // If at hour limit, wait longer
        if (this.state.requestsThisHour >= this.config.requestsPerHour) {
            return 60000; // Wait a minute and re-check
        }

        // If at concurrent limit, brief wait
        return this.config.minDelayMs;
    }

    /**
     * Handle successful request
     */
    private onSuccess(): void {
        this.state.consecutiveErrors = 0;
        // Gradually reduce delay back to minimum
        this.state.currentDelay = Math.max(
            this.config.minDelayMs,
            this.state.currentDelay / this.config.backoffMultiplier
        );
    }

    /**
     * Handle error (implements exponential backoff)
     */
    private onError(error: any): void {
        this.state.consecutiveErrors++;
        
        // Check for rate limit or server errors
        const status = error?.status || error?.response?.status;
        if (status === 429 || status === 503 || status === 502) {
            // Exponential backoff
            this.state.currentDelay = Math.min(
                this.state.currentDelay * this.config.backoffMultiplier,
                this.config.maxBackoffMs
            );
            console.warn(
                `[RateLimiter:${this.name}] Rate limited! Backing off to ${this.state.currentDelay}ms`
            );
        }
    }

    /**
     * Sleep helper
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current stats
     */
    getStats(): {
        name: string;
        requestsThisMinute: number;
        requestsThisHour: number;
        currentDelay: number;
        activeRequests: number;
        config: RateLimitConfig;
    } {
        return {
            name: this.name,
            requestsThisMinute: this.state.requestsThisMinute,
            requestsThisHour: this.state.requestsThisHour,
            currentDelay: this.state.currentDelay,
            activeRequests: this.state.activeRequests,
            config: this.config
        };
    }

    /**
     * Check if we can make a request immediately
     */
    canRequestNow(): boolean {
        return (
            this.state.requestsThisMinute < this.config.requestsPerMinute &&
            this.state.requestsThisHour < this.config.requestsPerHour &&
            this.state.activeRequests < this.config.maxConcurrent
        );
    }

    /**
     * Reset all counters (use with caution)
     */
    reset(): void {
        this.state = {
            requestsThisMinute: 0,
            requestsThisHour: 0,
            minuteStartTime: Date.now(),
            hourStartTime: Date.now(),
            currentDelay: this.config.minDelayMs,
            consecutiveErrors: 0,
            activeRequests: 0
        };
    }
}

// ============================================================================
// GLOBAL LIMITERS
// ============================================================================

const limiters = new Map<string, ETLRateLimiter>();

/**
 * Get or create a rate limiter by name
 */
export function getRateLimiter(
    name: string, 
    preset: keyof typeof RATE_LIMIT_PRESETS = 'government_standard'
): ETLRateLimiter {
    if (!limiters.has(name)) {
        limiters.set(name, new ETLRateLimiter(name, preset));
    }
    return limiters.get(name)!;
}

/**
 * Execute a rate-limited fetch to external API
 */
export async function rateLimitedFetch(
    url: string,
    options: RequestInit = {},
    limiterName: string = 'default',
    preset: keyof typeof RATE_LIMIT_PRESETS = 'government_standard'
): Promise<Response> {
    const limiter = getRateLimiter(limiterName, preset);
    return limiter.execute(() => fetch(url, options));
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// For government APIs (REDS, PCNET, etc.):
const redsLimiter = getRateLimiter('reds', 'government_sensitive');

// Fetch with rate limiting
const data = await redsLimiter.execute(async () => {
    const res = await fetch('https://reds.pcivil.mg.gov.br/api/...');
    return res.json();
});

// Or use the helper function:
const response = await rateLimitedFetch(
    'https://api.governo.br/...',
    { headers: { 'Authorization': 'Bearer ...' } },
    'gov_api',
    'government_standard'
);
*/
