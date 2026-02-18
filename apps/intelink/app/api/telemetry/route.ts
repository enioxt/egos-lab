import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, validationError } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { events } = await req.json();
        
        if (!events || !Array.isArray(events)) {
            return validationError('events deve ser um array');
        }

        // Try to insert into telemetry table (may not exist yet)
        try {
            await supabase
                .from('intelink_telemetry')
                .insert(events.map((e: any) => ({
                    event_type: e.event_type,
                    page: e.page,
                    action: e.action,
                    metadata: e.metadata,
                    duration_ms: e.duration_ms,
                    created_at: e.timestamp,
                    // TENANT ISOLATION: Include unit_id for filtering
                    unit_id: auth.unitId || e.unit_id || null,
                    investigation_id: e.investigation_id || null,
                })));
        } catch (e) {
            // Silent fail - telemetry shouldn't break the app
            console.log('[Telemetry] Storage unavailable');
        }

        // Always log performance to console
        events.forEach((e: any) => {
            if (e.event_type === 'performance') {
                console.log(`[Telemetry] ${e.page}/${e.action}: ${e.duration_ms}ms`);
            }
        });

        return successResponse({ count: events.length });

    } catch (e: any) {
        console.error('[Telemetry API] Error:', e);
        return successResponse({ performance: [] });
    }
}

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        
        // TENANT ISOLATION: Filter by unit_id (unless super_admin)
        let query = supabase
            .from('intelink_telemetry')
            .select('page, action, duration_ms')
            .eq('event_type', 'performance')
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (auth.unitId && auth.systemRole !== 'super_admin') {
            query = query.eq('unit_id', auth.unitId);
        }
        
        const { data: performance } = await query;

        const stats: Record<string, { count: number; total: number; avg: number }> = {};
        
        (performance || []).forEach((e: any) => {
            const key = `${e.page}/${e.action}`;
            if (!stats[key]) stats[key] = { count: 0, total: 0, avg: 0 };
            stats[key].count++;
            stats[key].total += e.duration_ms || 0;
            stats[key].avg = Math.round(stats[key].total / stats[key].count);
        });

        return successResponse({ stats });

    } catch (e) {
        return successResponse({ stats: {} });
    }
}

// Protected: Only authenticated users can post/view telemetry
export const GET = withSecurity(handleGet, { requiredRole: 'visitor' });
export const POST = withSecurity(handlePost, { requiredRole: 'visitor' });
