/**
 * API para Achados Investigativos (Provas Subjetivas)
 * 
 * GET: Listar achados de uma operação ou todos
 * POST: Criar novo achado
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
    getSupabaseAdmin, 
    successResponse, 
    errorResponse, 
    validationError,
    parseIntSafe 
} from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

// Labels para tipos de achados
const FINDING_TYPE_LABELS: Record<string, string> = {
    'interview_impression': 'Impressão de Entrevista',
    'surveillance_obs': 'Observação de Vigilância',
    'technical_analysis': 'Análise Técnica',
    'connection_hypothesis': 'Hipótese de Conexão',
    'modus_operandi': 'Modus Operandi',
    'source_intel': 'Informação de Fonte'
};

async function handleGet(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const investigationId = searchParams.get('investigation_id');
        const status = searchParams.get('status') || 'active';
        const priority = searchParams.get('priority'); // 'high' | 'all'
        const limit = parseIntSafe(searchParams.get('limit'), 20);
        
        let query = supabase
            .from('intelink_investigator_findings')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        // Filtrar por operação
        if (investigationId) {
            query = query.eq('investigation_id', investigationId);
        }
        
        // Filtrar apenas alta prioridade
        if (priority === 'high') {
            query = query
                .eq('is_actionable', true)
                .in('action_priority', ['immediate', 'high']);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Enriquecer com labels
        const enrichedData = data?.map((f: any) => ({
            ...f,
            finding_type_label: FINDING_TYPE_LABELS[f.finding_type] || f.finding_type,
            confidence_percent: Math.round((f.confidence || 0) * 100)
        }));
        
        // Agrupar por tipo se não filtrado por operação
        const grouped = !investigationId ? groupByType(enrichedData || []) : null;
        
        return successResponse({
            count: data?.length || 0,
            findings: enrichedData,
            grouped
        });
        
    } catch (error: any) {
        console.error('[Findings API] GET error:', error);
        return errorResponse(error.message || 'Erro ao buscar achados');
    }
}

async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json();
        const {
            investigation_id,
            finding_type,
            title,
            description,
            subject_names,
            confidence,
            suggested_action,
            action_priority,
            source_document_id
        } = body;
        
        // Validações
        if (!investigation_id || !finding_type || !title || !description) {
            return validationError('investigation_id, finding_type, title e description são obrigatórios');
        }
        
        // Validar tipo de achado
        const validTypes = Object.keys(FINDING_TYPE_LABELS);
        if (!validTypes.includes(finding_type)) {
            return validationError(`finding_type inválido. Use: ${validTypes.join(', ')}`);
        }
        
        // Inserir achado (com referência ao criador)
        const { data, error } = await supabase
            .from('intelink_investigator_findings')
            .insert({
                investigation_id,
                finding_type,
                title,
                description,
                subject_names: subject_names || [],
                confidence: confidence || 0.7,
                suggested_action,
                action_priority: action_priority || 'medium',
                is_actionable: !!suggested_action,
                source_document_id,
                source_type: source_document_id ? 'document_analysis' : 'direct_observation',
                status: 'active',
                created_by: auth.memberId
            })
            .select()
            .single();
        
        if (error) throw error;
        
        return successResponse({
            finding: {
                ...data,
                finding_type_label: FINDING_TYPE_LABELS[data.finding_type]
            }
        });
        
    } catch (error: any) {
        console.error('[Findings API] POST error:', error);
        return errorResponse(error.message || 'Erro ao criar achado');
    }
}

// Agrupar achados por tipo
function groupByType(findings: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    for (const f of findings) {
        const type = f.finding_type || 'other';
        if (!grouped[type]) {
            grouped[type] = [];
        }
        grouped[type].push(f);
    }
    
    return grouped;
}

// Protected: Only member+ can access findings
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
