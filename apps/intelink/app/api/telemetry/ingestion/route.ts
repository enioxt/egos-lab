/**
 * GET /api/telemetry/ingestion
 * 
 * Retorna estatísticas de ingestão de dados
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIngestionStats, getIngestionLogs } from '@/lib/telemetry/ingestion-telemetry';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '7');
        const source = searchParams.get('source') as any;
        const status = searchParams.get('status') as any;
        const limit = parseInt(searchParams.get('limit') || '50');
        
        const since = new Date();
        since.setDate(since.getDate() - days);
        
        // Get both stats and recent logs
        const [stats, logs] = await Promise.all([
            getIngestionStats(since),
            getIngestionLogs({ limit, source, status, since })
        ]);
        
        return NextResponse.json({
            success: true,
            stats,
            logs,
            period: {
                days,
                since: since.toISOString()
            }
        });
        
    } catch (error: any) {
        console.error('[Telemetry/Ingestion] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// Protected: Only member+ can view ingestion stats
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
