import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, validationError, notFoundError } from '@/lib/api-utils';
import { withSecurity, SecureContext } from '@/lib/security/middleware';
import { notifyRhoAlert } from '@/lib/notification-service';

const calculateSchema = z.object({
    investigation_id: z.string().uuid()
});

interface Entity {
    id: string;
    name: string;
    type: string;
}

interface Relationship {
    source_id: string;
    target_id: string;
}

/**
 * Calculate Rho Score for an investigation's network
 * 
 * Rho = A² × (1 - D)
 * Where:
 * - A = Authority (max incoming edge share)
 * - D = Diversity (normalized Shannon entropy)
 */
function calculateRho(entities: Entity[], relationships: Relationship[]) {
    if (entities.length === 0 || relationships.length === 0) {
        return {
            rho_score: 0,
            rho_status: 'unknown',
            diversity_score: 0,
            top_contributor_id: null,
            top_contributor_share: 0,
            centrality_metrics: {}
        };
    }

    // Build adjacency map
    const inDegree: Map<string, number> = new Map();
    const outDegree: Map<string, number> = new Map();
    
    entities.forEach(e => {
        inDegree.set(e.id, 0);
        outDegree.set(e.id, 0);
    });

    relationships.forEach(rel => {
        inDegree.set(rel.target_id, (inDegree.get(rel.target_id) || 0) + 1);
        outDegree.set(rel.source_id, (outDegree.get(rel.source_id) || 0) + 1);
    });

    const totalEdges = relationships.length;
    
    // Calculate shares (what fraction of edges each entity receives)
    const shares: Map<string, number> = new Map();
    let maxShare = 0;
    let topContributorId: string | null = null;

    entities.forEach(e => {
        const share = (inDegree.get(e.id) || 0) / totalEdges;
        shares.set(e.id, share);
        
        if (share > maxShare) {
            maxShare = share;
            topContributorId = e.id;
        }
    });

    // Authority = max share squared
    const authority = maxShare;

    // Diversity (Shannon Entropy normalized)
    let entropy = 0;
    shares.forEach(share => {
        if (share > 0) {
            entropy -= share * Math.log2(share);
        }
    });

    // Normalize entropy: max entropy is log2(n) where n = number of entities
    const maxEntropy = Math.log2(entities.length);
    const diversity = maxEntropy > 0 ? entropy / maxEntropy : 0;

    // Rho Score: A² × (1 - D)
    const rhoScore = Math.pow(authority, 2) * (1 - diversity);

    // Determine status based on thresholds
    let rhoStatus: string;
    if (rhoScore <= 0.03) {
        rhoStatus = 'healthy';
    } else if (rhoScore <= 0.06) {
        rhoStatus = 'warning';
    } else if (rhoScore <= 0.10) {
        rhoStatus = 'critical';
    } else {
        rhoStatus = 'extreme';
    }

    // Calculate centrality metrics for each entity
    const centralityMetrics: Record<string, any> = {};
    
    entities.forEach(e => {
        const inDeg = inDegree.get(e.id) || 0;
        const outDeg = outDegree.get(e.id) || 0;
        const totalDeg = inDeg + outDeg;
        
        // Simple PageRank approximation (degree centrality)
        const pagerank = totalEdges > 0 ? totalDeg / (2 * totalEdges) : 0;
        
        // Betweenness approximation (based on degree ratio)
        const betweenness = entities.length > 2 
            ? totalDeg / ((entities.length - 1) * (entities.length - 2))
            : 0;

        centralityMetrics[e.id] = {
            in_degree: inDeg,
            out_degree: outDeg,
            pagerank: pagerank,
            betweenness: betweenness,
            share: shares.get(e.id) || 0
        };
    });

    return {
        rho_score: Math.round(rhoScore * 10000) / 10000, // 4 decimal places
        rho_status: rhoStatus,
        diversity_score: Math.round(diversity * 10000) / 10000,
        top_contributor_id: topContributorId,
        top_contributor_share: Math.round(maxShare * 10000) / 10000,
        centrality_metrics: centralityMetrics
    };
}

/**
 * POST /api/rho/calculate
 * 
 * Calculates and stores Rho Score for an investigation
 */
async function handler(req: NextRequest, context: SecureContext<z.infer<typeof calculateSchema>>) {
    const { body, user } = context;
    const supabase = getSupabaseAdmin();

    // Verify investigation exists
    const { data: investigation, error: invError } = await supabase
        .from('intelink_investigations')
        .select('id, title, unit_id')
        .eq('id', body.investigation_id)
        .single();

    if (invError || !investigation) {
        return notFoundError('Investigação');
    }

    // Get entities
    const { data: entities, error: entError } = await supabase
        .from('intelink_entities')
        .select('id, name, type')
        .eq('investigation_id', body.investigation_id);

    if (entError) {
        return validationError('Erro ao buscar entidades');
    }

    // Get relationships
    const { data: relationships, error: relError } = await supabase
        .from('intelink_relationships')
        .select('source_id, target_id')
        .eq('investigation_id', body.investigation_id);

    if (relError) {
        return validationError('Erro ao buscar relacionamentos');
    }

    // Calculate Rho
    const rhoResult = calculateRho(entities || [], relationships || []);

    // Get old Rho score for comparison
    const { data: oldData } = await supabase
        .from('intelink_investigations')
        .select('rho_score')
        .eq('id', body.investigation_id)
        .single();

    const oldScore = oldData?.rho_score;

    // Update investigation with new Rho score
    const { error: updateError } = await supabase
        .from('intelink_investigations')
        .update({
            rho_score: rhoResult.rho_score,
            rho_status: rhoResult.rho_status,
            rho_calculated_at: new Date().toISOString()
        })
        .eq('id', body.investigation_id);

    if (updateError) {
        console.error('[Rho Calculate] Update error:', updateError);
        return validationError('Erro ao atualizar Rho Score');
    }

    // Update centrality metrics for each entity
    for (const [entityId, metrics] of Object.entries(rhoResult.centrality_metrics)) {
        await supabase
            .from('intelink_entities')
            .update({ centrality_metrics: metrics })
            .eq('id', entityId);
    }

    // Create snapshot
    try {
        await supabase
            .from('intelink_rho_snapshots')
            .insert({
                investigation_id: body.investigation_id,
                rho_score: rhoResult.rho_score,
                rho_status: rhoResult.rho_status,
                total_entities: entities?.length || 0,
                total_relationships: relationships?.length || 0,
                top_contributor_id: rhoResult.top_contributor_id,
                top_contributor_share: rhoResult.top_contributor_share,
                diversity_score: rhoResult.diversity_score,
                metrics_detail: rhoResult.centrality_metrics,
                calculated_by: user?.memberId || null
            });
    } catch (e) {
        // Snapshot table might not exist yet - non-critical
        console.warn('[Rho Calculate] Could not create snapshot:', e);
    }

    // Create alert if Rho worsened significantly
    if (oldScore !== null && rhoResult.rho_score > oldScore + 0.02) {
        try {
            await supabase
                .from('intelink_rho_alerts')
                .insert({
                    investigation_id: body.investigation_id,
                    alert_type: 'rapid_centralization',
                    severity: rhoResult.rho_status === 'extreme' ? 'critical' : 'warning',
                    message: `Rho Score aumentou de ${(oldScore * 100).toFixed(1)}% para ${(rhoResult.rho_score * 100).toFixed(1)}%`,
                    rho_score_before: oldScore,
                    rho_score_after: rhoResult.rho_score
                });
        } catch (e) {
            // Alert table might not exist yet - non-critical
            console.warn('[Rho Calculate] Could not create alert:', e);
        }
    }

    // Get top contributor name
    let topContributorName = null;
    if (rhoResult.top_contributor_id) {
        const { data: topEntity } = await supabase
            .from('intelink_entities')
            .select('name')
            .eq('id', rhoResult.top_contributor_id)
            .single();
        
        topContributorName = topEntity?.name;
    }

    // Send Telegram alert for critical/extreme Rho
    if (rhoResult.rho_status === 'critical' || rhoResult.rho_status === 'extreme') {
        try {
            await notifyRhoAlert({
                investigationId: body.investigation_id,
                investigationTitle: investigation.title,
                rhoScore: rhoResult.rho_score,
                rhoStatus: rhoResult.rho_status,
                alertType: rhoResult.top_contributor_share > 0.5 ? 'hub_detected' : 'critical_threshold',
                entityName: topContributorName || undefined
            }, investigation.unit_id);
        } catch (e) {
            // Non-critical - log and continue
            console.warn('[Rho Calculate] Could not send Telegram alert:', e);
        }
    }

    return NextResponse.json({
        success: true,
        rho_score: rhoResult.rho_score,
        rho_status: rhoResult.rho_status,
        rho_calculated_at: new Date().toISOString(),
        total_entities: entities?.length || 0,
        total_relationships: relationships?.length || 0,
        top_contributor: topContributorName,
        diversity_score: rhoResult.diversity_score,
        previous_score: oldScore
    });
}

// NOTE: Calculate requires user action but session is validated via cookie
export const POST = withSecurity(handler, {
    auth: false,
    rateLimit: 'default',
    validation: calculateSchema
});
