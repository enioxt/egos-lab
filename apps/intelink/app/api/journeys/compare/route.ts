import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/journeys/compare
 * 
 * Fetch journeys for comparison by investigation ID
 * Returns journeys from different investigators for the same case
 * 
 * Query params:
 * - investigation_id: UUID of the investigation
 * - limit: Max journeys to return (default 10)
 */
export async function GET(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: 'Missing Supabase configuration' },
                { status: 500 }
            );
        }
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { searchParams } = new URL(request.url);
        const investigationId = searchParams.get('investigation_id');
        const limit = parseInt(searchParams.get('limit') || '10');
        
        if (!investigationId) {
            return NextResponse.json(
                { error: 'investigation_id is required' },
                { status: 400 }
            );
        }
        
        // Fetch journeys for this investigation
        const { data: journeys, error } = await supabase
            .from('intelink_journeys')
            .select(`
                id,
                user_id,
                investigation_id,
                title,
                context,
                steps,
                status,
                step_count,
                ai_analysis,
                created_at,
                updated_at
            `)
            .eq('investigation_id', investigationId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('[JourneyCompare] Query error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        // Fetch member names for each journey
        const userIds = [...new Set(journeys?.map(j => j.user_id).filter(Boolean))];
        
        let memberMap: Record<string, string> = {};
        if (userIds.length > 0) {
            const { data: members } = await supabase
                .from('intelink_unit_members')
                .select('id, name')
                .in('id', userIds);
            
            if (members) {
                memberMap = Object.fromEntries(members.map(m => [m.id, m.name]));
            }
        }
        
        // Enrich journeys with member names
        const enrichedJourneys = journeys?.map(j => ({
            ...j,
            investigator_name: memberMap[j.user_id] || 'Desconhecido',
        })) || [];
        
        // Calculate comparison metrics
        const allEntityIds = new Set<string>();
        const entityByUser: Record<string, Set<string>> = {};
        
        enrichedJourneys.forEach(journey => {
            const userId = journey.user_id;
            if (!entityByUser[userId]) {
                entityByUser[userId] = new Set();
            }
            
            const steps = journey.steps || [];
            steps.forEach((step: any) => {
                if (step.entityId) {
                    allEntityIds.add(step.entityId);
                    entityByUser[userId].add(step.entityId);
                }
            });
        });
        
        // Find common and unique entities
        const userIdList = Object.keys(entityByUser);
        let commonEntities: string[] = [];
        
        if (userIdList.length > 1) {
            commonEntities = [...allEntityIds].filter(entityId => 
                userIdList.every(userId => entityByUser[userId].has(entityId))
            );
        }
        
        const uniqueByUser: Record<string, string[]> = {};
        userIdList.forEach(userId => {
            uniqueByUser[userId] = [...entityByUser[userId]].filter(entityId => 
                !commonEntities.includes(entityId) &&
                userIdList.filter(uid => uid !== userId).every(uid => !entityByUser[uid]?.has(entityId))
            );
        });
        
        return NextResponse.json({
            success: true,
            journeys: enrichedJourneys,
            comparison: {
                totalInvestigators: userIdList.length,
                totalEntitiesVisited: allEntityIds.size,
                commonEntities: commonEntities.length,
                uniqueFinds: Object.fromEntries(
                    Object.entries(uniqueByUser).map(([k, v]) => [memberMap[k] || k, v.length])
                ),
            },
        });
    } catch (error) {
        console.error('[JourneyCompare] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
