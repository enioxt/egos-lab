/**
 * Link Prediction Feedback API
 * 
 * POST /api/predictions/feedback
 * - Records user feedback (confirmed/rejected) for a prediction
 * 
 * GET /api/predictions/feedback?investigation_id=X
 * - Returns accuracy statistics for an investigation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, SecureContext } from '@/lib/security/middleware';

const feedbackSchema = z.object({
    prediction_id: z.string().uuid().optional(),
    investigation_id: z.string().uuid(),
    source_entity_id: z.string().uuid(),
    target_entity_id: z.string().uuid(),
    algorithm: z.string(),
    score: z.number().min(0).max(1),
    status: z.enum(['confirmed', 'rejected']),
    common_neighbors: z.number().optional()
});

/**
 * POST - Record feedback for a prediction
 */
async function handlePost(req: NextRequest, context: SecureContext<z.infer<typeof feedbackSchema>>) {
    const { body, user } = context;
    const supabase = getSupabaseAdmin();

    try {
        // Upsert the prediction with feedback
        const { data, error } = await supabase
            .from('intelink_link_predictions')
            .upsert({
                investigation_id: body.investigation_id,
                source_entity_id: body.source_entity_id,
                target_entity_id: body.target_entity_id,
                algorithm: body.algorithm,
                score: body.score,
                status: body.status,
                confirmed_by: user?.memberId || null,
                confirmed_at: new Date().toISOString(),
                common_neighbors: body.common_neighbors || 0,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'investigation_id,source_entity_id,target_entity_id,algorithm'
            })
            .select()
            .single();

        if (error) {
            console.error('[Predictions] Feedback error:', error);
            return errorResponse('Erro ao registrar feedback');
        }

        return successResponse({ prediction: data });

    } catch (e: any) {
        console.error('[Predictions] Error:', e);
        return errorResponse(e.message || 'Erro interno');
    }
}

/**
 * GET - Get accuracy statistics
 */
async function handleGet(req: NextRequest, context: SecureContext) {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const investigationId = searchParams.get('investigation_id');

    try {
        // Get overall stats
        let query = supabase
            .from('intelink_link_predictions')
            .select('algorithm, status, score');

        if (investigationId) {
            query = query.eq('investigation_id', investigationId);
        }

        const { data: predictions, error } = await query;

        if (error) {
            console.error('[Predictions] Stats error:', error);
            return errorResponse('Erro ao buscar estatísticas');
        }

        // Calculate stats per algorithm
        const stats: Record<string, {
            total: number;
            confirmed: number;
            rejected: number;
            pending: number;
            accuracy: number;
            avgConfirmedScore: number;
            avgRejectedScore: number;
        }> = {};

        for (const pred of predictions || []) {
            if (!stats[pred.algorithm]) {
                stats[pred.algorithm] = {
                    total: 0,
                    confirmed: 0,
                    rejected: 0,
                    pending: 0,
                    accuracy: 0,
                    avgConfirmedScore: 0,
                    avgRejectedScore: 0
                };
            }

            const s = stats[pred.algorithm];
            s.total++;
            
            if (pred.status === 'confirmed') {
                s.confirmed++;
                s.avgConfirmedScore = (s.avgConfirmedScore * (s.confirmed - 1) + pred.score) / s.confirmed;
            } else if (pred.status === 'rejected') {
                s.rejected++;
                s.avgRejectedScore = (s.avgRejectedScore * (s.rejected - 1) + pred.score) / s.rejected;
            } else {
                s.pending++;
            }
        }

        // Calculate accuracy
        for (const algo of Object.keys(stats)) {
            const s = stats[algo];
            const evaluated = s.confirmed + s.rejected;
            s.accuracy = evaluated > 0 ? Math.round((s.confirmed / evaluated) * 100) : 0;
        }

        // Overall accuracy
        const totalConfirmed = Object.values(stats).reduce((sum, s) => sum + s.confirmed, 0);
        const totalRejected = Object.values(stats).reduce((sum, s) => sum + s.rejected, 0);
        const overallAccuracy = totalConfirmed + totalRejected > 0
            ? Math.round((totalConfirmed / (totalConfirmed + totalRejected)) * 100)
            : 0;

        return successResponse({
            overall: {
                total: predictions?.length || 0,
                confirmed: totalConfirmed,
                rejected: totalRejected,
                accuracy: overallAccuracy
            },
            byAlgorithm: stats
        });

    } catch (e: any) {
        console.error('[Predictions] Error:', e);
        return errorResponse(e.message || 'Erro interno');
    }
}

export const POST = withSecurity(handlePost, {
    auth: false, // Frontend widget
    rateLimit: 'default',
    validation: feedbackSchema
});

export const GET = withSecurity(handleGet, {
    auth: false, // Frontend widget
    rateLimit: 'default'
});
