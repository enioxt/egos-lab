import { NextRequest, NextResponse } from 'next/server';
import { 
    getSupabaseAdmin, 
    successResponse, 
    errorResponse, 
    validationError,
    parseIntSafe,
    createdResponse
} from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('member_id') || searchParams.get('user_id');
        const limit = parseIntSafe(searchParams.get('limit'), 50);

        if (!userId) {
            return validationError('member_id ou user_id é obrigatório');
        }

        const { data: logs, error } = await supabase
            .from('intelink_activity_log')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.log('[Activities] Query error:', error.message);
            return successResponse({ activities: [] });
        }

        // Transform to activity format
        const activities = (logs || []).map((log: any) => ({
            id: log.id,
            type: log.action_type || 'other',
            title: getActivityTitle(log.action_type, log.action_details),
            description: log.action_details?.description || null,
            timestamp: log.created_at,
            link: log.investigation_id ? `/investigation/${log.investigation_id}` : null,
            read: true,
            actor: log.username
        }));

        return successResponse({ activities });

    } catch (e: any) {
        console.error('[Activities API] Error:', e);
        return successResponse({ activities: [] });
    }
}

function getActivityTitle(actionType: string, details: any): string {
    const titles: Record<string, string> = {
        'entity_created': `Entidade "${details?.entity_name || 'Nova'}" adicionada`,
        'entity_updated': `Entidade "${details?.entity_name || ''}" atualizada`,
        'relationship_created': 'Novo vínculo criado',
        'evidence_uploaded': 'Evidência anexada',
        'investigation_created': 'Nova operação criada',
        'analysis_run': 'Análise executada',
        'chat_message': 'Mensagem enviada',
    };
    return titles[actionType] || actionType || 'Ação realizada';
}

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { user_id, action_type, username, action_details, investigation_id, entity_id } = await req.json();

        if (!user_id || !action_type) {
            return validationError('user_id e action_type são obrigatórios');
        }

        const { data, error } = await supabase
            .from('intelink_activity_log')
            .insert({
                user_id,
                action_type,
                username,
                action_details: action_details || {},
                investigation_id,
                entity_id,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return createdResponse({ activity: data });

    } catch (e: any) {
        console.error('[Activities POST] Error:', e);
        return errorResponse(e.message || 'Erro ao registrar atividade');
    }
}

// Protected: Only authenticated users can access activities
export const GET = withSecurity(handleGet, { requiredRole: 'visitor' });
export const POST = withSecurity(handlePost, { requiredRole: 'visitor' });
