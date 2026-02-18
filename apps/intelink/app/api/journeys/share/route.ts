import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Journey Sharing API
 * 
 * POST /api/journeys/share - Share a journey with team members
 * GET /api/journeys/share?journey_id=X - Get sharing info for a journey
 * DELETE /api/journeys/share - Remove sharing
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// POST - Share a journey with members
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const { journeyId, memberIds, shareType = 'view' } = await request.json();
        
        if (!journeyId || !memberIds || !Array.isArray(memberIds)) {
            return NextResponse.json(
                { error: 'journeyId and memberIds array are required' },
                { status: 400 }
            );
        }
        
        // Verify journey exists
        const { data: journey, error: journeyError } = await supabase
            .from('intelink_journeys')
            .select('id, user_id, title, investigation_id')
            .eq('id', journeyId)
            .single();
        
        if (journeyError || !journey) {
            return NextResponse.json(
                { error: 'Journey not found' },
                { status: 404 }
            );
        }
        
        // Create share records
        const shareRecords = memberIds.map(memberId => ({
            journey_id: journeyId,
            shared_with_id: memberId,
            shared_by_id: journey.user_id,
            share_type: shareType, // 'view' | 'collaborate' | 'edit'
            created_at: new Date().toISOString(),
        }));
        
        const { data: shares, error: shareError } = await supabase
            .from('intelink_journey_shares')
            .upsert(shareRecords, { 
                onConflict: 'journey_id,shared_with_id',
                ignoreDuplicates: false 
            })
            .select();
        
        if (shareError) {
            // If table doesn't exist, create it
            if (shareError.code === '42P01') {
                return NextResponse.json({
                    success: false,
                    error: 'Sharing table not yet created. Run migration first.',
                    migration: `
CREATE TABLE IF NOT EXISTS intelink_journey_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID NOT NULL REFERENCES intelink_journeys(id) ON DELETE CASCADE,
    shared_with_id UUID NOT NULL REFERENCES intelink_members(id) ON DELETE CASCADE,
    shared_by_id UUID NOT NULL REFERENCES intelink_members(id),
    share_type TEXT DEFAULT 'view' CHECK (share_type IN ('view', 'collaborate', 'edit')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(journey_id, shared_with_id)
);

CREATE INDEX idx_journey_shares_journey ON intelink_journey_shares(journey_id);
CREATE INDEX idx_journey_shares_shared_with ON intelink_journey_shares(shared_with_id);
                    `,
                }, { status: 500 });
            }
            console.error('[JourneyShare] Error creating shares:', shareError);
            return NextResponse.json({ error: shareError.message }, { status: 500 });
        }
        
        // Get member names for response
        const { data: members } = await supabase
            .from('intelink_unit_members')
            .select('id, name')
            .in('id', memberIds);
        
        return NextResponse.json({
            success: true,
            journeyId,
            sharedWith: members || [],
            shareType,
            message: `Jornada compartilhada com ${memberIds.length} membro(s)`,
        });
    } catch (error) {
        console.error('[JourneyShare] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ============================================================================
// GET - Get sharing info for a journey
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const journeyId = searchParams.get('journey_id');
        const memberId = searchParams.get('member_id');
        
        if (!journeyId && !memberId) {
            return NextResponse.json(
                { error: 'journey_id or member_id is required' },
                { status: 400 }
            );
        }
        
        let query = supabase
            .from('intelink_journey_shares')
            .select(`
                id,
                journey_id,
                share_type,
                created_at,
                shared_with:intelink_unit_members!shared_with_id(id, name),
                shared_by:intelink_unit_members!shared_by_id(id, name),
                journey:intelink_journeys!journey_id(id, title, step_count, created_at)
            `);
        
        if (journeyId) {
            query = query.eq('journey_id', journeyId);
        }
        if (memberId) {
            query = query.eq('shared_with_id', memberId);
        }
        
        const { data: shares, error } = await query;
        
        if (error) {
            console.error('[JourneyShare] Query error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        return NextResponse.json({
            success: true,
            shares: shares || [],
        });
    } catch (error) {
        console.error('[JourneyShare] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ============================================================================
// DELETE - Remove sharing
// ============================================================================

export async function DELETE(request: NextRequest) {
    try {
        const { journeyId, memberId } = await request.json();
        
        if (!journeyId || !memberId) {
            return NextResponse.json(
                { error: 'journeyId and memberId are required' },
                { status: 400 }
            );
        }
        
        const { error } = await supabase
            .from('intelink_journey_shares')
            .delete()
            .eq('journey_id', journeyId)
            .eq('shared_with_id', memberId);
        
        if (error) {
            console.error('[JourneyShare] Delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        return NextResponse.json({
            success: true,
            message: 'Compartilhamento removido',
        });
    } catch (error) {
        console.error('[JourneyShare] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
