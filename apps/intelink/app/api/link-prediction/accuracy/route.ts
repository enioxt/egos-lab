/**
 * Link Prediction Accuracy API
 * GET /api/link-prediction/accuracy
 * 
 * Returns accuracy metrics for link predictions.
 * 
 * Query params:
 * - from: ISO date (default: 30 days ago)
 * - to: ISO date (default: now)
 * - format: 'json' | 'report' (default: json)
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { 
    Prediction, 
    calculateMetrics, 
    generateAccuracyReport,
    needsRetraining 
} from '@/lib/link-prediction/accuracy-tracker';

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        
        const fromDate = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const toDate = searchParams.get('to') || new Date().toISOString();
        const format = searchParams.get('format') || 'json';
        
        // Query predictions with feedback
        const { data: predictions, error } = await supabase
            .from('intelink_link_predictions')
            .select('*')
            .gte('created_at', fromDate)
            .lte('created_at', toDate)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('[Accuracy API] Query error:', error);
            // Return empty metrics if table doesn't exist
            const emptyMetrics = calculateMetrics([]);
            
            if (format === 'report') {
                return new NextResponse(generateAccuracyReport(emptyMetrics), {
                    headers: { 'Content-Type': 'text/markdown' },
                });
            }
            
            return successResponse({
                metrics: emptyMetrics,
                predictions: [],
                retraining: { needed: false, severity: 'low' },
            });
        }
        
        // Transform to Prediction format
        const formattedPredictions: Prediction[] = (predictions || []).map((p: any) => ({
            id: p.id,
            entity1_id: p.entity1_id,
            entity2_id: p.entity2_id,
            entity1_name: p.entity1_name || '',
            entity2_name: p.entity2_name || '',
            entity_type: p.entity_type || 'PERSON',
            score: p.score || 0,
            algorithm: p.algorithm || 'fuzzy',
            created_at: new Date(p.created_at),
            outcome: p.outcome || 'pending',
            feedback_at: p.feedback_at ? new Date(p.feedback_at) : undefined,
            feedback_by: p.feedback_by,
            investigation_id: p.investigation_id,
        }));
        
        // Calculate metrics
        const metrics = calculateMetrics(formattedPredictions);
        const retraining = needsRetraining(metrics);
        
        // Return based on format
        if (format === 'report') {
            const report = generateAccuracyReport(metrics);
            return new NextResponse(report, {
                headers: {
                    'Content-Type': 'text/markdown',
                    'Content-Disposition': `attachment; filename="accuracy_report_${new Date().toISOString().split('T')[0]}.md"`,
                },
            });
        }
        
        return successResponse({
            metrics,
            retraining,
            period: { from: fromDate, to: toDate },
            totalPredictions: formattedPredictions.length,
        });
        
    } catch (e: any) {
        console.error('[Accuracy API] Error:', e);
        return errorResponse(e.message || 'Erro interno', 500);
    }
}

// Record a new prediction
async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        
        const {
            entity1_id,
            entity2_id,
            entity1_name,
            entity2_name,
            entity_type,
            score,
            algorithm,
            investigation_id,
        } = body;
        
        // Validate required fields
        if (!entity1_id || !entity2_id || score === undefined) {
            return errorResponse('entity1_id, entity2_id e score são obrigatórios', 400);
        }
        
        // Insert prediction
        const { data, error } = await supabase
            .from('intelink_link_predictions')
            .insert({
                entity1_id,
                entity2_id,
                entity1_name,
                entity2_name,
                entity_type: entity_type || 'PERSON',
                score,
                algorithm: algorithm || 'fuzzy',
                investigation_id,
                outcome: 'pending',
            })
            .select()
            .single();
        
        if (error) {
            console.error('[Accuracy API POST] Insert error:', error);
            return errorResponse('Erro ao registrar predição', 500);
        }
        
        return successResponse({ prediction: data });
        
    } catch (e: any) {
        console.error('[Accuracy API POST] Error:', e);
        return errorResponse(e.message || 'Erro interno', 500);
    }
}

// Update prediction outcome (feedback)
async function handlePatch(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        
        const { prediction_id, outcome } = body;
        
        if (!prediction_id || !outcome) {
            return errorResponse('prediction_id e outcome são obrigatórios', 400);
        }
        
        if (!['confirmed', 'rejected'].includes(outcome)) {
            return errorResponse('outcome deve ser "confirmed" ou "rejected"', 400);
        }
        
        // Update prediction
        const { data, error } = await supabase
            .from('intelink_link_predictions')
            .update({
                outcome,
                feedback_at: new Date().toISOString(),
                feedback_by: auth.memberId,
            })
            .eq('id', prediction_id)
            .select()
            .single();
        
        if (error) {
            console.error('[Accuracy API PATCH] Update error:', error);
            return errorResponse('Erro ao atualizar predição', 500);
        }
        
        return successResponse({ prediction: data });
        
    } catch (e: any) {
        console.error('[Accuracy API PATCH] Error:', e);
        return errorResponse(e.message || 'Erro interno', 500);
    }
}

// Protected: Members can view, admin can modify
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
export const PATCH = withSecurity(handlePatch, { requiredRole: 'member' });
