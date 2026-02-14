export type RequestStatus = 'draft' | 'open' | 'expired' | 'booked' | 'completed' | 'canceled';
export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'rejected' | 'accepted' | 'expired';
export type BookingStatus = 'pending_payment' | 'scheduled' | 'in_progress' | 'completed' | 'disputed' | 'refunded' | 'canceled';

export interface ServiceRequest {
    id: string;
    clientId: string;
    categoryId: string;
    title: string;
    description: string;
    budget?: {
        min: number;
        max: number;
        currency: string;
    };
    location: {
        address: string;
        city: string;
        state: string;
        lat: number;
        lng: number;
    };
    schedule: {
        date?: string; // ISO
        window: 'morning' | 'afternoon' | 'evening' | 'flexible';
    };
    status: RequestStatus;
    metadata: Record<string, any>;
    createdAt: string;
    expiresAt: string;
}

export interface Proposal {
    id: string;
    requestId: string;
    providerId: string;
    price: number;
    currency: string;
    description: string;
    estimatedDuration: number; // minutes
    status: ProposalStatus;
    score?: number; // Internal ranking score
    createdAt: string;
    validUntil: string;
}

export interface Booking {
    id: string;
    requestId: string;
    proposalId: string;
    clientId: string;
    providerId: string;
    status: BookingStatus;
    paymentId?: string;
    amount: number;
    platformFee: number;
    providerPayout: number;
    scheduledAt: string;
    completedAt?: string;
    rating?: number;
    review?: string;
}
