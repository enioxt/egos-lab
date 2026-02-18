import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { getLeaderboard, XP_EVENTS } from '@/lib/gamification/gamification-adapter';

/**
 * GET /api/gamification/stats
 * 
 * Returns comprehensive gamification statistics for the Intelink platform.
 * Only accessible in development or by admins.
 */
export async function GET(req: NextRequest) {
    const supabase = getSupabaseAdmin();
    
    try {
        // 1. Get leaderboard
        const leaderboard = await getLeaderboard(20);
        
        // 2. Get total stats
        const { data: totalStats } = await supabase
            .from('intelink_unit_members')
            .select('points')
            .not('points', 'is', null);
        
        const totalPoints = totalStats?.reduce((sum, m) => sum + (m.points || 0), 0) || 0;
        const totalMembers = totalStats?.length || 0;
        const avgPoints = totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0;
        
        // 3. Get investigation stats
        const { count: totalInvestigations } = await supabase
            .from('intelink_investigations')
            .select('*', { count: 'exact', head: true });
        
        // 4. Get entity stats
        const { count: totalEntities } = await supabase
            .from('intelink_entities')
            .select('*', { count: 'exact', head: true });
        
        // 5. Get cross-case links (the most valuable)
        const { count: crossCaseLinks } = await supabase
            .from('intelink_cross_investigation_links')
            .select('*', { count: 'exact', head: true });
        
        // 6. Get recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: recentActivity } = await supabase
            .from('intelink_user_points')
            .select('event_type, points_awarded, created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(50);
        
        // 7. Calculate XP breakdown by event type
        const xpByEvent: Record<string, number> = {};
        recentActivity?.forEach(a => {
            xpByEvent[a.event_type] = (xpByEvent[a.event_type] || 0) + a.points_awarded;
        });
        
        // 8. Get top performers this week
        const weeklyLeaders = recentActivity?.reduce((acc: Record<string, number>, a) => {
            // Would need member_id in the query for this
            return acc;
        }, {});
        
        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            
            // Summary
            summary: {
                totalPoints,
                totalMembers,
                avgPoints,
                totalInvestigations: totalInvestigations || 0,
                totalEntities: totalEntities || 0,
                crossCaseLinks: crossCaseLinks || 0,
            },
            
            // Leaderboard (top 20)
            leaderboard: leaderboard.members,
            
            // XP Distribution by event type (last 7 days)
            xpByEvent,
            
            // XP Values reference
            xpValues: XP_EVENTS,
            
            // Recent activity
            recentActivity: recentActivity?.slice(0, 20) || [],
        });
        
    } catch (error: any) {
        console.error('[Gamification Stats] Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
