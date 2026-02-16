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

export type TourismAgentMode = 'VISITOR_MODE' | 'CURATOR_MODE' | 'BUSINESS_MODE';
