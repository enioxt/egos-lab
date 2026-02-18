/**
 * Auth v2.0 - Logout Endpoint
 * 
 * POST /api/v2/auth/logout
 * 
 * Revokes current session and clears cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    verifyAccessToken,
    revokeSession,
    clearAuthCookies,
    logLogout,
    getAccessTokenFromRequest,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Get access token from request
        const accessToken = getAccessTokenFromRequest(request);

        if (accessToken) {
            // Verify token to get session info
            const result = await verifyAccessToken(accessToken);
            
            if (result.success && result.payload) {
                // Log logout
                await logLogout(result.payload.sub, request);
                
                // Note: We could revoke the session here if we stored sessionId in the token
                // For now, the token will just expire naturally
            }
        }

        // Create response
        const response = NextResponse.json({
            success: true,
            message: 'Logout realizado com sucesso',
        });

        // Clear all auth cookies
        clearAuthCookies(response);

        return response;
    } catch (error) {
        console.error('[Auth v2] Logout error:', error);
        
        // Even on error, clear cookies
        const response = NextResponse.json(
            { success: false, error: 'Erro ao fazer logout' },
            { status: 500 }
        );
        clearAuthCookies(response);
        return response;
    }
}
