/**
 * Rate Limiter — Reusable across all API-calling apps
 * 
 * Respects API rate limits (e.g., Querido Diário: 60 req/min)
 */

export class RateLimiter {
    private timestamps: number[] = [];

    constructor(
        private maxRequests: number,
        private windowMs: number,
    ) { }

    async waitForSlot(): Promise<void> {
        const now = Date.now();
        this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);

        if (this.timestamps.length >= this.maxRequests) {
            const waitTime = this.timestamps[0] + this.windowMs - now;
            console.log(`⏳ Rate limit: waiting ${Math.ceil(waitTime / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.timestamps.push(Date.now());
    }

    get currentUsage(): string {
        const now = Date.now();
        const active = this.timestamps.filter(t => now - t < this.windowMs).length;
        return `${active}/${this.maxRequests} (window: ${this.windowMs / 1000}s)`;
    }
}
