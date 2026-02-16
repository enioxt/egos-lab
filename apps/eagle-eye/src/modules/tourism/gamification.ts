
export interface UserProfile {
    userId: string;
    metrics: {
        points: number;
        assets_submitted: number;
        photos_submitted: number;
        reviews_submitted: number;
        corroborations: number;
    };
    rank: UserRank;
    badges: string[];
}

export type UserRank = 'Turista' | 'Explorador Local' | 'Guia Oficial' | 'Embaixador';

export const POINTS_TABLE = {
    NEW_ASSET_VERIFIED: 100,
    PHOTO_UPLOAD: 50,
    DETAILED_REVIEW: 20,
    CORROBORATION: 10,
    MAPS_FIX: 150, // Helping a business fix their Google Maps
    SHARE_ACHIEVEMENT: 30, // Sharing rank or milestone on social media
    SEO_ACTION: 40 // Business owner completes an SEO task (e.g., Google Post)
};

export class GamificationSystem {

    calculateRank(points: number): UserRank {
        if (points >= 1000) return 'Embaixador';
        if (points >= 500) return 'Guia Oficial';
        if (points >= 100) return 'Explorador Local';
        return 'Turista';
    }

    awardPoints(user: UserProfile, action: keyof typeof POINTS_TABLE): UserProfile {
        const points = POINTS_TABLE[action];
        user.metrics.points += points;

        // Update specific metric
        if (action === 'NEW_ASSET_VERIFIED') user.metrics.assets_submitted++;
        if (action === 'PHOTO_UPLOAD') user.metrics.photos_submitted++;
        if (action === 'DETAILED_REVIEW') user.metrics.reviews_submitted++;
        if (action === 'CORROBORATION') user.metrics.corroborations++;
        // SHARE_ACHIEVEMENT doesn't increment a specific metric in this simple model, just points.

        // Recalculate Rank
        const newRank = this.calculateRank(user.metrics.points);
        if (newRank !== user.rank) {
            console.log(`🎉 LEVEL UP! ${user.userId} is now a ${newRank}!`);
            user.rank = newRank;
        }

        return user;
    }

    getLeaderboard(users: UserProfile[]): UserProfile[] {
        return users.sort((a, b) => b.metrics.points - a.metrics.points).slice(0, 10);
    }

    // New logic for Referrals & Suggestions
    createReferralCode(user: UserProfile, campaignId?: string): ReferralCode {
        return {
            code: `${user.userId.substring(0, 4).toUpperCase()}-${crypto.randomUUID().substring(0, 4).toUpperCase()}`,
            ownerId: user.userId,
            campaignId: campaignId,
            usageCount: 0,
            metadata: {
                source: 'eagle-eye-app',
                created_at: new Date().toISOString()
            }
        };
    }

    submitSuggestion(user: UserProfile, text: string, targetEntity?: string): Suggestion {
        return {
            id: crypto.randomUUID(),
            userId: user.userId,
            text,
            targetEntity,
            status: 'pending',
            voluntary_rewards: []
        };
    }

    rewardSuggestion(suggestion: Suggestion, reward: VoluntaryReward): Suggestion {
        suggestion.voluntary_rewards.push(reward);
        suggestion.status = 'rewarded';
        console.log(`🎁 ${reward.from} sent a reward to ${suggestion.userId}: ${reward.type} (${reward.value})`);
        return suggestion;
    }
}

export interface ReferralCode {
    code: string;
    ownerId: string;
    campaignId?: string;
    usageCount: number;
    metadata: Record<string, any>;
}

export interface Suggestion {
    id: string;
    userId: string;
    text: string;
    targetEntity?: string; // e.g., 'Bakery X' or 'City Hall'
    status: 'pending' | 'viewed' | 'implemented' | 'rewarded';
    voluntary_rewards: VoluntaryReward[];
}

export interface VoluntaryReward {
    from: string; // Merchant Name or 'Anonymous'
    type: 'points' | 'cash' | 'voucher' | 'thank_you';
    value: string; // '50 pts', 'R$ 10,00', 'Coffee Voucher'
    message?: string;
}
