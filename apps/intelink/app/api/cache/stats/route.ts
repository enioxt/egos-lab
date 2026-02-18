/**
 * GET /api/cache/stats
 * POST /api/cache/stats (warm cache)
 * 
 * Estatísticas e controle do cache de entidades
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats, warmCache } from '@/lib/intelink/entity-matcher';
import { getEntityCache } from '@/lib/cache/entity-cache';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const stats = getCacheStats();
        
        return NextResponse.json({
            success: true,
            cache: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error: any) {
        console.error('[Cache Stats] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const body = await request.json().catch(() => ({}));
        const action = body.action || 'warm';
        
        if (action === 'warm') {
            const limit = body.limit || 500;
            const loaded = await warmCache(limit);
            
            return NextResponse.json({
                success: true,
                action: 'warm',
                entitiesLoaded: loaded,
                cache: getCacheStats()
            });
        }
        
        if (action === 'clear') {
            const cache = getEntityCache();
            cache.clear();
            
            return NextResponse.json({
                success: true,
                action: 'clear',
                cache: getCacheStats()
            });
        }
        
        if (action === 'cleanup') {
            const cache = getEntityCache();
            const removed = cache.cleanup();
            
            return NextResponse.json({
                success: true,
                action: 'cleanup',
                expiredRemoved: removed,
                cache: getCacheStats()
            });
        }
        
        return NextResponse.json({
            success: false,
            error: 'Unknown action. Use: warm, clear, cleanup'
        }, { status: 400 });
        
    } catch (error: any) {
        console.error('[Cache Stats] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// Protected: Only unit_admin+ can manage cache
export const GET = withSecurity(handleGet, { requiredRole: 'unit_admin' });
export const POST = withSecurity(handlePost, { requiredRole: 'unit_admin' });
