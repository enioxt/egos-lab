/**
 * Auth System v2.0 - JWT Module
 * 
 * Modern JWT implementation using `jose` library
 * Works in both Node.js and Edge Runtime (middleware)
 * 
 * Security Features:
 * - Short-lived access tokens (15 min)
 * - Long-lived refresh tokens (7 days) with rotation
 * - HTTP-only cookies for refresh tokens
 * - Signed with HS256 algorithm
 */

import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { 
    ACCESS_TOKEN_EXPIRY_SECONDS, 
    REFRESH_TOKEN_EXPIRY_SECONDS,
    JWT_ALGORITHM 
} from './constants';
import type { Member, Session } from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'intelink-dev-secret-change-in-production'
);

const ISSUER = 'intelink';
const AUDIENCE = 'intelink-app';

// ============================================================================
// TOKEN PAYLOAD TYPES
// ============================================================================

export interface AccessTokenPayload extends JWTPayload {
    /** Member UUID */
    sub: string;
    /** Member name */
    name: string;
    /** System role */
    role: string;
    /** Unit ID */
    unitId: string;
    /** Token type */
    type: 'access';
}

export interface RefreshTokenPayload extends JWTPayload {
    /** Member UUID */
    sub: string;
    /** Session ID (for revocation) */
    sessionId: string;
    /** Token type */
    type: 'refresh';
    /** Token family (for rotation tracking) */
    family: string;
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate an access token (short-lived, 15 minutes)
 */
export async function generateAccessToken(member: Pick<Member, 'id' | 'name' | 'systemRole' | 'unitId'>): Promise<string> {
    const payload: Omit<AccessTokenPayload, keyof JWTPayload> = {
        sub: member.id,
        name: member.name,
        role: member.systemRole,
        unitId: member.unitId,
        type: 'access',
    };

    return new SignJWT(payload as JWTPayload)
        .setProtectedHeader({ alg: JWT_ALGORITHM })
        .setIssuedAt()
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime(`${ACCESS_TOKEN_EXPIRY_SECONDS}s`)
        .sign(JWT_SECRET);
}

/**
 * Generate a refresh token (long-lived, 7 days)
 */
export async function generateRefreshToken(
    memberId: string, 
    sessionId: string,
    family?: string
): Promise<string> {
    const payload: Omit<RefreshTokenPayload, keyof JWTPayload> = {
        sub: memberId,
        sessionId,
        type: 'refresh',
        family: family || crypto.randomUUID(), // New family if not rotating
    };

    return new SignJWT(payload as JWTPayload)
        .setProtectedHeader({ alg: JWT_ALGORITHM })
        .setIssuedAt()
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime(`${REFRESH_TOKEN_EXPIRY_SECONDS}s`)
        .sign(JWT_SECRET);
}

/**
 * Generate both tokens for a new session
 */
export async function generateTokenPair(
    member: Pick<Member, 'id' | 'name' | 'systemRole' | 'unitId'>,
    sessionId: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const [accessToken, refreshToken] = await Promise.all([
        generateAccessToken(member),
        generateRefreshToken(member.id, sessionId),
    ]);

    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_SECONDS * 1000);

    return { accessToken, refreshToken, expiresAt };
}

// ============================================================================
// TOKEN VERIFICATION
// ============================================================================

export interface VerifyResult<T> {
    success: boolean;
    payload?: T;
    error?: string;
    expired?: boolean;
}

/**
 * Verify an access token
 */
export async function verifyAccessToken(token: string): Promise<VerifyResult<AccessTokenPayload>> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET, {
            issuer: ISSUER,
            audience: AUDIENCE,
        });

        // Validate token type
        if (payload.type !== 'access') {
            return { success: false, error: 'Invalid token type' };
        }

        return { success: true, payload: payload as AccessTokenPayload };
    } catch (error: any) {
        if (error.code === 'ERR_JWT_EXPIRED') {
            return { success: false, error: 'Token expired', expired: true };
        }
        return { success: false, error: error.message || 'Invalid token' };
    }
}

/**
 * Verify a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<VerifyResult<RefreshTokenPayload>> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET, {
            issuer: ISSUER,
            audience: AUDIENCE,
        });

        // Validate token type
        if (payload.type !== 'refresh') {
            return { success: false, error: 'Invalid token type' };
        }

        return { success: true, payload: payload as RefreshTokenPayload };
    } catch (error: any) {
        if (error.code === 'ERR_JWT_EXPIRED') {
            return { success: false, error: 'Refresh token expired', expired: true };
        }
        return { success: false, error: error.message || 'Invalid refresh token' };
    }
}

// ============================================================================
// TOKEN REFRESH
// ============================================================================

/**
 * Rotate refresh token (generate new tokens from valid refresh token)
 * 
 * Security: The old refresh token should be invalidated in the database
 * after calling this function.
 */
export async function rotateTokens(
    refreshToken: string,
    member: Pick<Member, 'id' | 'name' | 'systemRole' | 'unitId'>
): Promise<{ accessToken: string; refreshToken: string; sessionId: string; expiresAt: Date } | null> {
    const result = await verifyRefreshToken(refreshToken);
    
    if (!result.success || !result.payload) {
        return null;
    }

    const { sessionId, family } = result.payload;

    // Generate new token pair with same family (for tracking rotation)
    const [newAccessToken, newRefreshToken] = await Promise.all([
        generateAccessToken(member),
        generateRefreshToken(member.id, sessionId, family), // Keep same family
    ]);

    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_SECONDS * 1000);

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        sessionId,
        expiresAt,
    };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Decode token without verification (for debugging)
 * WARNING: Never use this for authentication!
 */
export function decodeToken(token: string): JWTPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(
            Buffer.from(parts[1], 'base64url').toString('utf-8')
        );
        return payload;
    } catch {
        return null;
    }
}

/**
 * Check if token is expired (without full verification)
 */
export function isTokenExpired(token: string): boolean {
    const payload = decodeToken(token);
    if (!payload?.exp) return true;
    return Date.now() >= payload.exp * 1000;
}

/**
 * Get token expiration date
 */
export function getTokenExpiration(token: string): Date | null {
    const payload = decodeToken(token);
    if (!payload?.exp) return null;
    return new Date(payload.exp * 1000);
}

/**
 * Check if token should be refreshed soon (within 5 minutes of expiry)
 */
export function shouldRefreshToken(token: string, thresholdSeconds = 300): boolean {
    const payload = decodeToken(token);
    if (!payload?.exp) return true;
    return Date.now() >= (payload.exp * 1000) - (thresholdSeconds * 1000);
}
