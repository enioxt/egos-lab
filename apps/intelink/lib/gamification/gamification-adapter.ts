/**
 * Gamification Adapter - Intelink to EGOSv3 XP System
 * 
 * Sprint 23 - P2 Task: GamificationAdapter
 * 
 * Connects Intelink actions to the EGOSv3 XP/Points system
 * Based on INTELINK_GAMIFICATION_SPEC.md
 */

import { getSupabaseAdmin } from '@/lib/api-utils';

// =====================================================
// XP VALUES
// =====================================================

export const XP_EVENTS = {
    // Investigation Actions
    INVESTIGATION_CREATED: 50,
    INVESTIGATION_COMPLETED: 200,
    
    // Entity Actions
    ENTITY_ADDED: 10,
    ENTITY_LINKED: 15,
    
    // Cross-Case Discovery (High Value!)
    CROSS_CASE_LINK_DISCOVERED: 100,
    CROSS_CASE_LINK_CONFIRMED: 150,
    CROSS_CASE_LINK_REJECTED: 10, // Small XP for review effort
    
    // Document Processing
    DOCUMENT_UPLOADED: 20,
    DOCUMENT_EXTRACTED: 30,
    
    // Graph Analysis
    GRAPH_VIEWED: 5,
    GRAPH_INTERACTION: 2,
    
    // Reports
    REPORT_GENERATED: 40,
    REPORT_SHARED: 25,
    
    // Daily Streaks
    DAILY_LOGIN: 10,
    DAILY_STREAK_3: 50,
    DAILY_STREAK_7: 150,
    DAILY_STREAK_30: 500,
} as const;

export type XPEventType = keyof typeof XP_EVENTS;

// =====================================================
// GAMIFICATION SERVICE
// =====================================================

export interface XPAwardResult {
    success: boolean;
    xpAwarded: number;
    newTotal?: number;
    error?: string;
}

/**
 * Award XP to a member for an action
 */
export async function awardXP(
    memberId: string,
    eventType: XPEventType,
    metadata?: Record<string, any>
): Promise<XPAwardResult> {
    const supabase = getSupabaseAdmin();
    const xpAmount = XP_EVENTS[eventType];
    
    try {
        // 1. Get current points
        const { data: member, error: fetchError } = await supabase
            .from('intelink_unit_members')
            .select('id, name, points')
            .eq('id', memberId)
            .single();
        
        if (fetchError || !member) {
            return { success: false, xpAwarded: 0, error: 'Member not found' };
        }
        
        const currentPoints = member.points || 0;
        const newTotal = currentPoints + xpAmount;
        
        // 2. Update points
        const { error: updateError } = await supabase
            .from('intelink_unit_members')
            .update({ 
                points: newTotal,
                updated_at: new Date().toISOString()
            })
            .eq('id', memberId);
        
        if (updateError) {
            console.error('[Gamification] Update error:', updateError);
            return { success: false, xpAwarded: 0, error: updateError.message };
        }
        
        // 3. Log the XP event
        try {
            await supabase.from('intelink_user_points').insert({
                member_id: memberId,
                event_type: eventType,
                points_awarded: xpAmount,
                metadata: metadata || {},
                created_at: new Date().toISOString()
            });
        } catch {
            // Table might not exist, ignore
        }
        
        console.log(`[Gamification] +${xpAmount} XP to ${member.name} for ${eventType}`);
        
        return {
            success: true,
            xpAwarded: xpAmount,
            newTotal
        };
        
    } catch (error: any) {
        console.error('[Gamification] Error:', error);
        return { success: false, xpAwarded: 0, error: error.message };
    }
}

/**
 * Award XP for discovering a cross-case link
 * This is the highest-value action in the system!
 */
export async function awardCrossCaseDiscovery(
    memberId: string,
    sourceInvestigationId: string,
    targetInvestigationId: string,
    entityName: string,
    entityType: string
): Promise<XPAwardResult> {
    return awardXP(memberId, 'CROSS_CASE_LINK_DISCOVERED', {
        sourceInvestigationId,
        targetInvestigationId,
        entityName,
        entityType,
        discoveredAt: new Date().toISOString()
    });
}

/**
 * Award XP for confirming a cross-case link
 */
export async function awardCrossCaseConfirmation(
    memberId: string,
    linkId: string
): Promise<XPAwardResult> {
    return awardXP(memberId, 'CROSS_CASE_LINK_CONFIRMED', {
        linkId,
        confirmedAt: new Date().toISOString()
    });
}

/**
 * Get leaderboard of top investigators
 */
export async function getLeaderboard(limit: number = 10): Promise<{
    members: Array<{ id: string; name: string; points: number; rank: number }>;
}> {
    const supabase = getSupabaseAdmin();
    
    const { data: members, error } = await supabase
        .from('intelink_unit_members')
        .select('id, name, points')
        .order('points', { ascending: false })
        .limit(limit);
    
    if (error || !members) {
        return { members: [] };
    }
    
    return {
        members: members.map((m, i) => ({
            id: m.id,
            name: m.name,
            points: m.points || 0,
            rank: i + 1
        }))
    };
}

/**
 * Get member's XP history
 */
export async function getMemberXPHistory(
    memberId: string,
    limit: number = 20
): Promise<Array<{
    eventType: string;
    pointsAwarded: number;
    createdAt: string;
    metadata: Record<string, any>;
}>> {
    const supabase = getSupabaseAdmin();
    
    const { data: history, error } = await supabase
        .from('intelink_user_points')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(limit);
    
    if (error || !history) {
        return [];
    }
    
    return history.map(h => ({
        eventType: h.event_type,
        pointsAwarded: h.points_awarded,
        createdAt: h.created_at,
        metadata: h.metadata || {}
    }));
}

// =====================================================
// BADGES & ACHIEVEMENTS
// =====================================================

export const BADGES = {
    FIRST_INVESTIGATION: {
        id: 'first_investigation',
        name: '🔍 Primeiro Caso',
        description: 'Criou sua primeira operação',
        requirement: { event: 'INVESTIGATION_CREATED', count: 1 }
    },
    CROSS_CASE_DETECTIVE: {
        id: 'cross_case_detective',
        name: '🕵️ Detetive Cross-Case',
        description: 'Descobriu 5 conexões entre casos',
        requirement: { event: 'CROSS_CASE_LINK_DISCOVERED', count: 5 }
    },
    GRAPH_MASTER: {
        id: 'graph_master',
        name: '📊 Mestre do Grafo',
        description: 'Visualizou 50 grafos de operação',
        requirement: { event: 'GRAPH_VIEWED', count: 50 }
    },
    DOCUMENT_NINJA: {
        id: 'document_ninja',
        name: '📄 Ninja de Documentos',
        description: 'Processou 100 documentos',
        requirement: { event: 'DOCUMENT_EXTRACTED', count: 100 }
    },
    STREAK_WARRIOR: {
        id: 'streak_warrior',
        name: '🔥 Guerreiro da Sequência',
        description: 'Manteve 7 dias de atividade',
        requirement: { event: 'DAILY_STREAK_7', count: 1 }
    },
} as const;

export type BadgeId = keyof typeof BADGES;

/**
 * Check and award badges for a member
 */
export async function checkBadges(memberId: string): Promise<string[]> {
    // This would check member's event history and award badges
    // Implementation depends on badge tracking table
    return [];
}
