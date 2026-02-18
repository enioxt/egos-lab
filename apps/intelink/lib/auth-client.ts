/**
 * Client-side Auth Utilities
 * 
 * Provides access to JWT and member info from localStorage
 * For use in multi-tenancy (RLS) enforcement
 * 
 * @version 1.0.0
 * @date 2025-12-08
 */

// Storage keys
const STORAGE_KEYS = {
    JWT: 'intelink_jwt',
    MEMBER_ID: 'intelink_member_id',
    UNIT_ID: 'intelink_unit_id',
    MEMBER: 'intelink_member',
    CHAT_ID: 'intelink_chat_id',
    USERNAME: 'intelink_username',
} as const;

// Types
export interface MemberInfo {
    id: string;
    name: string;
    unit_id: string;
    system_role: string | null;
}

/**
 * Get stored JWT token
 */
export function getJWT(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.JWT);
}

/**
 * Get stored member info
 */
export function getMemberInfo(): MemberInfo | null {
    if (typeof window === 'undefined') return null;
    
    const memberJson = localStorage.getItem(STORAGE_KEYS.MEMBER);
    if (!memberJson) return null;
    
    try {
        return JSON.parse(memberJson);
    } catch {
        return null;
    }
}

/**
 * Get current unit_id
 */
export function getUnitId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.UNIT_ID);
}

/**
 * Get current member_id
 */
export function getMemberId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.MEMBER_ID);
}

/**
 * Get current chat_id (Telegram)
 */
export function getChatId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.CHAT_ID);
}

/**
 * Check if user is authenticated with full member info
 */
export function isFullyAuthenticated(): boolean {
    return !!(getJWT() && getMemberId() && getUnitId());
}

/**
 * Check if user is a super_admin
 */
export function isSuperAdmin(): boolean {
    const member = getMemberInfo();
    return member?.system_role === 'super_admin';
}

/**
 * Clear all auth data (logout)
 */
export function clearAuth(): void {
    if (typeof window === 'undefined') return;
    
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    
    // Clear cookie
    document.cookie = 'intelink_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

/**
 * Get auth headers for API requests
 * Includes JWT for RLS if available
 */
export function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    const jwt = getJWT();
    if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
    }
    
    const unitId = getUnitId();
    if (unitId) {
        headers['X-Unit-ID'] = unitId;
    }
    
    const memberId = getMemberId();
    if (memberId) {
        headers['X-Member-ID'] = memberId;
    }
    
    return headers;
}

/**
 * Decode JWT payload (client-side, no verification)
 * Useful for checking expiration
 */
export function decodeJWT(token: string): Record<string, any> | null {
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload);
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

/**
 * Check if JWT is expired
 */
export function isJWTExpired(): boolean {
    const jwt = getJWT();
    if (!jwt) return true;
    
    const payload = decodeJWT(jwt);
    if (!payload || !payload.exp) return true;
    
    return payload.exp < Math.floor(Date.now() / 1000);
}
