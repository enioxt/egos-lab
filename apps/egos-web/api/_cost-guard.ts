/**
 * AI Cost Guard — Daily spend tracking for OpenRouter
 * 
 * Prevents runaway AI costs by tracking daily token usage.
 * Checks remaining credits via the OpenRouter key info endpoint.
 * 
 * Usage:
 *   import { costGuard } from './_cost-guard';
 *   if (await costGuard.isOverBudget()) return res.status(503).json(...)
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const MAX_DAILY_SPEND_USD = parseFloat(process.env.MAX_DAILY_AI_SPEND || '2.00');

interface SpendTracker {
    date: string;         // YYYY-MM-DD
    totalSpendUsd: number;
    requestCount: number;
}

let dailyTracker: SpendTracker = {
    date: new Date().toISOString().slice(0, 10),
    totalSpendUsd: 0,
    requestCount: 0,
};

function resetIfNewDay() {
    const today = new Date().toISOString().slice(0, 10);
    if (dailyTracker.date !== today) {
        console.log(`[COST-GUARD] New day detected. Resetting spend tracker. Previous: $${dailyTracker.totalSpendUsd.toFixed(4)} across ${dailyTracker.requestCount} requests.`);
        dailyTracker = { date: today, totalSpendUsd: 0, requestCount: 0 };
    }
}

/**
 * Estimate cost based on token counts.
 * Gemini 2.0 Flash pricing (approximate):
 * - Input:  $0.10 / 1M tokens
 * - Output: $0.40 / 1M tokens
 */
function estimateCost(inputTokens: number, outputTokens: number): number {
    return (inputTokens * 0.10 + outputTokens * 0.40) / 1_000_000;
}

export const costGuard = {
    /**
     * Check if daily budget is exceeded
     */
    isOverBudget(): boolean {
        resetIfNewDay();
        return dailyTracker.totalSpendUsd >= MAX_DAILY_SPEND_USD;
    },

    /**
     * Record a completed AI request
     */
    recordUsage(inputTokens: number, outputTokens: number) {
        resetIfNewDay();
        const cost = estimateCost(inputTokens, outputTokens);
        dailyTracker.totalSpendUsd += cost;
        dailyTracker.requestCount++;

        if (dailyTracker.totalSpendUsd >= MAX_DAILY_SPEND_USD * 0.8) {
            console.warn(`[COST-GUARD] ⚠️ 80% of daily budget reached: $${dailyTracker.totalSpendUsd.toFixed(4)} / $${MAX_DAILY_SPEND_USD}`);
        }
    },

    /**
     * Get current spend stats
     */
    getStats() {
        resetIfNewDay();
        return {
            date: dailyTracker.date,
            spentUsd: dailyTracker.totalSpendUsd,
            budgetUsd: MAX_DAILY_SPEND_USD,
            remainingUsd: Math.max(0, MAX_DAILY_SPEND_USD - dailyTracker.totalSpendUsd),
            requestCount: dailyTracker.requestCount,
            percentUsed: Math.round((dailyTracker.totalSpendUsd / MAX_DAILY_SPEND_USD) * 100),
        };
    },

    /**
     * Check remaining credits on OpenRouter (optional, network call)
     */
    async checkRemoteCredits(): Promise<{ remaining: number; limit: number } | null> {
        if (!OPENROUTER_API_KEY) return null;
        try {
            const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
                headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
            });
            if (!res.ok) return null;
            const data = await res.json() as { data?: { usage?: number; limit?: number } };
            return {
                remaining: (data.data?.limit || 0) - (data.data?.usage || 0),
                limit: data.data?.limit || 0,
            };
        } catch {
            return null;
        }
    },
};
