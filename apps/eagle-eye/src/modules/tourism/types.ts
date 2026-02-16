export interface CityProfile {
    city: {
        name: string;
        state: string;
        region: string;
        positioning: {
            tagline: string;
            pillars: string[];
        };
    };
    assets: {
        nature: TourismAsset[];
        food: TourismAsset[];
        culture: TourismAsset[];
        events: EventAsset[];
        crowdsourced: CrowdsourcedAsset[];
    };
    infra: {
        hotels: {
            count_estimate: number | null;
            strengths: string[];
            gaps: string[];
        };
        mobility: {
            highways: string[];
            public_transport: string;
            parking: string;
        };
        safety: {
            perception: string;
            evidence_links: string[];
        };
    };
    digital_presence: {
        google_maps_readiness: {
            businesses_total_estimate: number | null;
            profiles_claimed_estimate: number | null;
            top_gaps: string[];
        };
        social: {
            instagram: string;
            tiktok: string;
            youtube: string;
        };
    };
    opportunities: Opportunity[];
}

export interface TourismAsset {
    name: string;
    type: string;
    seasonality?: string;
    access?: string;
    pain_points?: string[];
    where?: string;
    story?: string;
    calendar?: string;
}

export interface EventAsset {
    name: string;
    dates: string;
    target: string;
    capacity: string;
}

export interface CrowdsourcedAsset extends TourismAsset {
    submitted_by: string; // 'anonymous' or user_id
    verification_count: number;
    social_signals: SocialSignal[];
    is_verified: boolean;
    timestamp: string;
}

export interface SocialSignal {
    platform: 'instagram' | 'twitter' | 'reddit' | 'news' | 'facebook';
    sentiment: 'positive' | 'neutral' | 'negative';
    url: string;
    description: string;
}

export interface Opportunity {
    title: string;
    why: string;
    quick_wins: string[];
    dependencies: string[];
    cost_range_brl: [number, number];
}

export interface GoogleMapsReadinessChecklist {
    profileExists: boolean;
    claimed: boolean;
    nameCorrect: boolean;
    categorySet: boolean;
    hoursUpdated: boolean;
    contactInfoSet: boolean;
    photosCount: number; // Target 10-15
    videoExists: boolean;
    reviewsRespondedPercent: number; // Target 100%
    postsRecent: boolean;
    reviewLinkReady: boolean;
}


export interface TourismNews {
    id: string;
    title: string;
    summary: string;
    url: string;
    source: string;
    date: string;
    author?: string;
    sentiment?: 'Positive' | 'Negative' | 'Neutral';
}

