export type UserRole = 'client' | 'provider' | 'admin' | 'partner';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}

export interface UserProfile {
    id: string; // matches user.id
    fullName: string;
    avatarUrl?: string;
    phoneNumber?: string;
    address?: {
        street: string;
        number: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
    };
    metadata: Record<string, any>;
}

export interface ProviderProfile extends UserProfile {
    bio: string;
    serviceArea: {
        lat: number;
        lng: number;
        radiusKm: number;
    };
    categories: string[];
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
    rating: number;
    reviewCount: number;
}
