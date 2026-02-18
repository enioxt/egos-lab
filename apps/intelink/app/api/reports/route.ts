/**
 * POST /api/reports
 * 
 * Create a new report in intelink_reports.
 * Supports all report types: relint, cronologia, vinculos, dossie, risco, journey, custom
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json();
        
        const {
            report_type,
            investigation_id,
            entity_id,
            journey_id,
            title,
            content,
            summary,
            status = 'final'
        } = body;
        
        // Validate required fields
        if (!report_type || !title || !content) {
            return errorResponse('report_type, title e content são obrigatórios', 400);
        }
        
        // Validate report_type
        const validTypes = ['relint', 'cronologia', 'vinculos', 'dossie', 'risco', 'journey', 'custom'];
        if (!validTypes.includes(report_type)) {
            return errorResponse(`report_type inválido. Valores aceitos: ${validTypes.join(', ')}`, 400);
        }
        
        // Insert report
        const { data, error } = await supabase
            .from('intelink_reports')
            .insert({
                report_type,
                investigation_id,
                entity_id,
                journey_id,
                title,
                content,
                summary,
                status
            })
            .select('id, report_type, title, created_at')
            .single();
        
        if (error) {
            console.error('[Reports API] Insert error:', error);
            return errorResponse(error.message, 500);
        }
        
        return successResponse(data, 201);
        
    } catch (err: any) {
        console.error('[Reports API] Error:', err);
        return errorResponse(err.message || 'Erro interno', 500);
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        
        const investigation_id = searchParams.get('investigation_id');
        const report_type = searchParams.get('type');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        let query = supabase
            .from('intelink_reports')
            .select('id, report_type, title, summary, status, created_at, investigation_id')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (investigation_id) {
            query = query.eq('investigation_id', investigation_id);
        }
        
        if (report_type) {
            query = query.eq('report_type', report_type);
        }
        
        const { data, error } = await query;
        
        if (error) {
            return errorResponse(error.message, 500);
        }
        
        return successResponse({ reports: data, count: data?.length || 0 });
        
    } catch (err: any) {
        console.error('[Reports API] Error:', err);
        return errorResponse(err.message || 'Erro interno', 500);
    }
}
