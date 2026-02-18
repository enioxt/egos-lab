/**
 * Auth System v2.0 - Session Module
 * 
 * Manages user sessions with database persistence
 * Uses JWT for stateless auth with DB for session tracking/revocation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
    generateTokenPair, 
    verifyAccessToken, 
    verifyRefreshToken, 
    rotateTokens,
    shouldRefreshToken,
    AccessTokenPayload,
} from './jwt';
import { 
    COOKIE_NAMES, 
    COOKIE_OPTIONS,
    ACCESS_TOKEN_EXPIRY_SECONDS,
    REFRESH_TOKEN_EXPIRY_SECONDS,
} from './constants';
import type { Member, Session, SessionDeviceInfo } from './types';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, supabaseKey);
};

// ============================================================================
// SESSION CREATION
// ============================================================================

export interface CreateSessionOptions {
    member: Member;
    deviceInfo?: SessionDeviceInfo;
    rememberMe?: boolean;
}

export interface CreateSessionResult {
    success: boolean;
    session?: Session;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
}

/**
 * Create a new session for a member
 */
export async function createSession(options: CreateSessionOptions): Promise<CreateSessionResult> {
    const { member, deviceInfo, rememberMe } = options;
    const supabase = getSupabase();

    try {
        // Generate session ID
        const sessionId = crypto.randomUUID();

        // Generate JWT tokens
        const tokens = await generateTokenPair(
            {
                id: member.id,
                name: member.name,
                systemRole: member.systemRole,
                unitId: member.unitId,
            },
            sessionId
        );

        // Calculate expiration
        const expiresAt = rememberMe
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            : new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000); // 7 days

        // Store session in database
        const { error: dbError } = await supabase
            .from('auth_sessions')
            .insert({
                id: sessionId,
                member_id: member.id,
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                device_info: deviceInfo || null,
                expires_at: expiresAt.toISOString(),
                last_activity_at: new Date().toISOString(),
            });

        if (dbError) {
            console.error('[Session] DB Error:', dbError);
            return { success: false, error: 'Failed to create session' };
        }

        // Build session object
        const session: Session = {
            id: sessionId,
            memberId: member.id,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt,
            member,
            deviceInfo,
            lastActivityAt: new Date(),
        };

        return {
            success: true,
            session,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    } catch (error) {
        console.error('[Session] Create error:', error);
        return { success: false, error: 'Failed to create session' };
    }
}

// ============================================================================
// SESSION VERIFICATION
// ============================================================================

export interface VerifySessionResult {
    success: boolean;
    session?: Session;
    member?: Member;
    shouldRefresh?: boolean;
    error?: string;
}

/**
 * Verify session from access token
 */
export async function verifySession(accessToken: string): Promise<VerifySessionResult> {
    // Verify JWT
    const jwtResult = await verifyAccessToken(accessToken);
    
    if (!jwtResult.success || !jwtResult.payload) {
        return { 
            success: false, 
            error: jwtResult.error,
            shouldRefresh: jwtResult.expired,
        };
    }

    const payload = jwtResult.payload;
    const supabase = getSupabase();

    // Get member from database
    const { data: member, error: memberError } = await supabase
        .from('intelink_unit_members')
        .select('id, name, phone, email, role, system_role, unit_id, telegram_chat_id, telegram_username')
        .eq('id', payload.sub)
        .single();

    if (memberError || !member) {
        return { success: false, error: 'Member not found' };
    }

    // Build member object
    const memberData: Member = {
        id: member.id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        role: member.role,
        systemRole: member.system_role || 'member',
        unitId: member.unit_id,
        telegramChatId: member.telegram_chat_id,
        telegramUsername: member.telegram_username,
    };

    // Check if token should be refreshed soon
    const needsRefresh = shouldRefreshToken(accessToken);

    return {
        success: true,
        member: memberData,
        shouldRefresh: needsRefresh,
    };
}

// ============================================================================
// SESSION REFRESH
// ============================================================================

export interface RefreshSessionResult {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    error?: string;
}

/**
 * Refresh session using refresh token
 */
export async function refreshSession(refreshToken: string): Promise<RefreshSessionResult> {
    const supabase = getSupabase();

    // Verify refresh token
    const jwtResult = await verifyRefreshToken(refreshToken);
    
    if (!jwtResult.success || !jwtResult.payload) {
        return { success: false, error: jwtResult.error };
    }

    const { sub: memberId, sessionId } = jwtResult.payload;

    // Check session exists and is not revoked
    const { data: existingSession, error: sessionError } = await supabase
        .from('auth_sessions')
        .select('id, revoked_at')
        .eq('id', sessionId)
        .eq('member_id', memberId)
        .single();

    if (sessionError || !existingSession) {
        return { success: false, error: 'Session not found' };
    }

    if (existingSession.revoked_at) {
        // Token reuse detected! Revoke all sessions for this user
        await supabase
            .from('auth_sessions')
            .update({ 
                revoked_at: new Date().toISOString(),
                revoked_reason: 'Token reuse detected'
            })
            .eq('member_id', memberId);

        return { success: false, error: 'Session revoked due to token reuse' };
    }

    // Get member data
    const { data: member, error: memberError } = await supabase
        .from('intelink_unit_members')
        .select('id, name, system_role, unit_id')
        .eq('id', memberId)
        .single();

    if (memberError || !member) {
        return { success: false, error: 'Member not found' };
    }

    // Rotate tokens
    const newTokens = await rotateTokens(refreshToken, {
        id: member.id,
        name: member.name,
        systemRole: member.system_role || 'member',
        unitId: member.unit_id,
    });

    if (!newTokens) {
        return { success: false, error: 'Failed to rotate tokens' };
    }

    // Update session in database
    const { error: updateError } = await supabase
        .from('auth_sessions')
        .update({
            access_token: newTokens.accessToken,
            refresh_token: newTokens.refreshToken,
            last_activity_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

    if (updateError) {
        console.error('[Session] Update error:', updateError);
        return { success: false, error: 'Failed to update session' };
    }

    return {
        success: true,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresAt: newTokens.expiresAt,
    };
}

// ============================================================================
// SESSION REVOCATION
// ============================================================================

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string, reason?: string): Promise<boolean> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('auth_sessions')
        .update({
            revoked_at: new Date().toISOString(),
            revoked_reason: reason || 'User logout',
        })
        .eq('id', sessionId);

    return !error;
}

/**
 * Revoke all sessions for a member
 */
export async function revokeAllSessions(memberId: string, reason?: string): Promise<boolean> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('auth_sessions')
        .update({
            revoked_at: new Date().toISOString(),
            revoked_reason: reason || 'All sessions revoked',
        })
        .eq('member_id', memberId)
        .is('revoked_at', null);

    return !error;
}

// ============================================================================
// COOKIE HELPERS
// ============================================================================

/**
 * Set auth cookies on response
 */
export function setAuthCookies(
    response: NextResponse,
    accessToken: string,
    refreshToken: string,
    rememberMe = false
): void {
    const maxAge = rememberMe 
        ? 30 * 24 * 60 * 60  // 30 days
        : REFRESH_TOKEN_EXPIRY_SECONDS; // 7 days

    // Access token cookie (short-lived)
    response.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
    });

    // Refresh token cookie (long-lived, accessible by auth endpoints)
    response.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge,
        path: '/', // Accessible by all paths for auto-refresh
    });
}

/**
 * Clear auth cookies on response (both v2 and legacy)
 */
export function clearAuthCookies(response: NextResponse): void {
    // Clear v2 cookies
    response.cookies.delete(COOKIE_NAMES.ACCESS_TOKEN);
    response.cookies.delete(COOKIE_NAMES.REFRESH_TOKEN);
    response.cookies.delete(COOKIE_NAMES.MEMBER_ID);
    
    // Clear legacy cookie (intelink_session) - force expire
    response.cookies.set(COOKIE_NAMES.SESSION, '', {
        path: '/',
        expires: new Date(0),
        maxAge: 0,
    });
}

/**
 * Get access token from request
 */
export function getAccessTokenFromRequest(request: NextRequest): string | null {
    // Try cookie first
    const cookieToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
    if (cookieToken) return cookieToken;

    // Try Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    return null;
}

/**
 * Get refresh token from request
 */
export function getRefreshTokenFromRequest(request: NextRequest): string | null {
    return request.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value || null;
}

// ============================================================================
// SERVER COMPONENT HELPERS
// ============================================================================

/**
 * Get current session from cookies (for Server Components ONLY)
 * Uses next/headers cookies() - must be called from server context
 */
export async function getCurrentSession(): Promise<VerifySessionResult> {
    // Dynamic import to avoid client-side errors
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;

    if (!accessToken) {
        return { success: false, error: 'No access token' };
    }

    return verifySession(accessToken);
}

/**
 * Require authentication (throws if not authenticated)
 */
export async function requireAuth(): Promise<Member> {
    const result = await getCurrentSession();
    
    if (!result.success || !result.member) {
        throw new Error('Unauthorized');
    }

    return result.member;
}

/**
 * Check if user has required role
 */
export async function requireRole(requiredRoles: string[]): Promise<Member> {
    const member = await requireAuth();
    
    if (!requiredRoles.includes(member.systemRole)) {
        throw new Error('Forbidden');
    }

    return member;
}
