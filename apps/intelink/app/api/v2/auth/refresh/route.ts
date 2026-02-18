/**
 * Auth v2.0 - Refresh Token Endpoint
 * 
 * POST /api/v2/auth/refresh
 * 
 * Rotates tokens: Old refresh token → New access + refresh tokens
 * Implements token rotation for security
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    refreshSession,
    setAuthCookies,
    clearAuthCookies,
    getRefreshTokenFromRequest,
    logSessionRefreshed,
    AUTH_ERRORS,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Get refresh token from cookie
        const refreshToken = getRefreshTokenFromRequest(request);

        if (!refreshToken) {
            return NextResponse.json(
                { success: false, error: 'Refresh token não encontrado' },
                { status: 401 }
            );
        }

        // Refresh session
        const result = await refreshSession(refreshToken);

        if (!result.success) {
            // Clear cookies if refresh failed
            const response = NextResponse.json(
                { success: false, error: result.error || AUTH_ERRORS.SESSION_EXPIRED },
                { status: 401 }
            );
            clearAuthCookies(response);
            return response;
        }

        // Build success response
        const response = NextResponse.json({
            success: true,
            expiresAt: result.expiresAt,
        });

        // Set new cookies
        if (result.accessToken && result.refreshToken) {
            setAuthCookies(response, result.accessToken, result.refreshToken);
        }

        return response;
    } catch (error) {
        console.error('[Auth v2] Refresh error:', error);
        
        const response = NextResponse.json(
            { success: false, error: AUTH_ERRORS.SERVER_ERROR },
            { status: 500 }
        );
        clearAuthCookies(response);
        return response;
    }
}
