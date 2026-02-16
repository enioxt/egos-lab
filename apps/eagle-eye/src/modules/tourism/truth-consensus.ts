import { Opportunity } from './types';

// Types for Consensus
export type SourceType = 'USER_INPUT' | 'WEB_CROSS_CHECK' | 'OTHER_USER' | 'BUSINESS_OWNER' | 'TRUSTED_GUIDE';

interface ConsensusSignal {
    sourceType: SourceType;
    weight: number; // 0-1.0
    timestamp: string;
    userId?: string;
    description: string;
}

export class TruthConsensus {
    private signals: ConsensusSignal[] = [];

    // Configurable Weights
    private WEIGHTS = {
        USER_INPUT: 0.10,      // Base subjectivity
        WEB_CROSS_CHECK: 0.20, // External validation
        OTHER_USER: 0.15,      // Peer corroboration
        BUSINESS_OWNER: 0.40,  // Authority claim
        TRUSTED_GUIDE: 0.30    // Expert user
    };

    /**
     * Adds a new signal (piece of evidence) to the truth engine for a specific topic/asset.
     */
    addSignal(type: SourceType, description: string, userId?: string): void {
        this.signals.push({
            sourceType: type,
            weight: this.WEIGHTS[type],
            timestamp: new Date().toISOString(),
            userId,
            description
        });
    }

    /**
     * Calculates the current Confidence Score (0-100%) based on accumulated signals.
     * Uses a diminishing returns formula so it doesn't exceed 100% easily.
     */
    calculateConfidence(): number {
        if (this.signals.length === 0) return 0;

        // Simple additive model capped at 1.0 for MVP
        // In V2, use Bayesian inference
        let totalScore = 0;
        const uniqueUsers = new Set<string>();

        for (const signal of this.signals) {
            // Prevent spamming from same user (count only once per type per user)
            if (signal.userId) {
                const key = `${signal.userId}-${signal.sourceType}`;
                if (uniqueUsers.has(key)) continue;
                uniqueUsers.add(key);
            }

            totalScore += signal.weight;
        }

        return Math.min(Math.round(totalScore * 100), 100);
    }

    /**
     * Returns the verification status label based on the score.
     */
    getStatus(): 'UNVERIFIED_RUMOR' | 'COMMUNITY_SIGNAL' | 'VERIFIED_TRUTH' {
        const score = this.calculateConfidence();
        if (score < 30) return 'UNVERIFIED_RUMOR';
        if (score < 70) return 'COMMUNITY_SIGNAL';
        return 'VERIFIED_TRUTH';
    }

    /**
     * Simulation Helper: Explains why the score is what it is.
     */
    explain(): string {
        const score = this.calculateConfidence();
        const status = this.getStatus();
        return `Confidence: ${score}% (${status}). Based on ${this.signals.length} signals.`;
    }
}
