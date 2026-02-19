/**
 * Shared Rate Limiter — In-memory, per-instance
 * 
 * Usage in any API endpoint:
 *   import { rateLimit } from './_rate-limit';
 *   const limiter = rateLimit({ max: 10, windowMs: 60_000 });
 *   if (limiter.isLimited(ip)) return res.status(429).json(...)
 */

interface RateBucket {
    count: number;
    resetAt: number;
}

interface RateLimitConfig {
    max: number;       // max requests per window
    windowMs: number;  // window duration in ms
}

class RateLimiter {
    private buckets = new Map<string, RateBucket>();
    private config: RateLimitConfig;
    private cleanupInterval: ReturnType<typeof setInterval>;

    constructor(config: RateLimitConfig) {
        this.config = config;
        // Cleanup stale buckets every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60_000);
    }

    isLimited(key: string): boolean {
        const now = Date.now();
        const bucket = this.buckets.get(key);
        if (!bucket || now > bucket.resetAt) {
            this.buckets.set(key, { count: 1, resetAt: now + this.config.windowMs });
            return false;
        }
        bucket.count++;
        return bucket.count > this.config.max;
    }

    remaining(key: string): number {
        const bucket = this.buckets.get(key);
        if (!bucket || Date.now() > bucket.resetAt) return this.config.max;
        return Math.max(0, this.config.max - bucket.count);
    }

    private cleanup() {
        const now = Date.now();
        for (const [key, bucket] of this.buckets) {
            if (now > bucket.resetAt) this.buckets.delete(key);
        }
    }
}

// Pre-configured limiters for different use cases
export const chatLimiter = new RateLimiter({ max: 10, windowMs: 60_000 });      // 10/min for chat
export const webhookLimiter = new RateLimiter({ max: 30, windowMs: 60_000 });    // 30/min for webhooks
export const ingestLimiter = new RateLimiter({ max: 5, windowMs: 60_000 });      // 5/min for commit ingestion
export const publicLimiter = new RateLimiter({ max: 60, windowMs: 60_000 });     // 60/min for public reads

export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
    const forwarded = headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    const real = headers['x-real-ip'];
    if (typeof real === 'string') return real;
    return 'unknown';
}
