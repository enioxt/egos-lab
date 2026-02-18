/**
 * Auth v2.0 - Verify Session Endpoint
 * 
 * GET /api/v2/auth/verify
 * 
 * Checks if current session is valid and returns member info
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    verifySession,
    getAccessTokenFromRequest,
    AUTH_ERRORS,
} from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Get access token from request
        const accessToken = getAccessTokenFromRequest(request);

        if (!accessToken) {
            return NextResponse.json({
                valid: false,
                error: 'No access token',
            }, { status: 401 });
        }

        // Verify session
        const result = await verifySession(accessToken);

        if (!result.success || !result.member) {
            return NextResponse.json({
                valid: false,
                error: result.error || 'Invalid session',
                shouldRefresh: result.shouldRefresh,
            }, { status: 401 });
        }

        // Return session info
        return NextResponse.json({
            valid: true,
            shouldRefresh: result.shouldRefresh,
            member: {
                id: result.member.id,
                name: result.member.name,
                role: result.member.role,
                systemRole: result.member.systemRole,
                unitId: result.member.unitId,
                email: result.member.email,
            },
        });
    } catch (error) {
        console.error('[Auth v2] Verify error:', error);
        return NextResponse.json(
            { valid: false, error: AUTH_ERRORS.SERVER_ERROR },
            { status: 500 }
        );
    }
}
