/**
 * GET /api/entities/merge/history
 * 
 * Fetch merge history for an investigation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const investigationId = searchParams.get('investigation_id');
        
        if (!investigationId) {
            return NextResponse.json(
                { error: 'investigation_id required' },
                { status: 400 }
            );
        }
        
        // Get merge logs for this investigation
        // We need to join with entities to get investigation_id
        const { data: logs, error } = await supabase
            .from('intelink_entity_merge_log')
            .select(`
                id,
                action,
                source_entity_id,
                target_entity_id,
                source_entity_snapshot,
                target_entity_snapshot,
                performed_at,
                rollback_available,
                rollback_performed_at
            `)
            .order('performed_at', { ascending: false })
            .limit(50);
        
        if (error) {
            console.error('Error fetching merge history:', error);
            throw error;
        }
        
        // Filter by investigation (from snapshots)
        const filteredLogs = logs?.filter(log => {
            const sourceInv = log.source_entity_snapshot?.investigation_id;
            const targetInv = log.target_entity_snapshot?.investigation_id;
            return sourceInv === investigationId || targetInv === investigationId;
        }) || [];
        
        return NextResponse.json({ 
            success: true,
            logs: filteredLogs
        });
        
    } catch (error) {
        console.error('Merge history API error:', error);
        return NextResponse.json(
            { error: 'Internal error', details: String(error) },
            { status: 500 }
        );
    }
}
