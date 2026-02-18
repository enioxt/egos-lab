import { NextRequest, NextResponse } from 'next/server';
import { 
    getSupabaseAdmin, 
    successResponse, 
    errorResponse, 
    validationError,
    parseIntSafe
} from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'open';
        const limit = parseIntSafe(searchParams.get('limit'), 50);

        let query = supabase
            .from('intelink_data_jobs')
            .select('*')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        // Filtro especial: minhas tarefas (assigned to me)
        if (status === 'my_tasks') {
            // Buscar pelo member ID do usuário atual
            const memberId = auth.memberId;
            if (memberId) {
                // Buscar ID numérico do membro
                const { data: member } = await supabase
                    .from('intelink_unit_members')
                    .select('id')
                    .eq('id', memberId)
                    .single();
                
                if (member) {
                    query = supabase
                        .from('intelink_data_jobs')
                        .select('*')
                        .eq('status', 'in_progress')
                        .not('assigned_to', 'is', null)
                        .order('deadline_at', { ascending: true, nullsFirst: false })
                        .limit(10);
                }
            }
        } else if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: jobs, error } = await query;
        if (error) throw error;

        // Get stats in parallel
        const { data: statsData } = await supabase
            .from('intelink_data_jobs')
            .select('status');

        const stats = { open: 0, in_progress: 0, completed: 0 };
        statsData?.forEach((job: any) => {
            if (job.status === 'open') stats.open++;
            else if (job.status === 'in_progress') stats.in_progress++;
            else if (job.status === 'completed') stats.completed++;
        });

        return successResponse({ jobs: jobs || [], stats });

    } catch (e: any) {
        console.error('[Jobs API] Error:', e);
        return errorResponse(e.message || 'Erro ao buscar tarefas');
    }
}

async function handlePatch(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { id, status, resolution_notes, deadline_days, deadline_at } = body;

        if (!id) {
            return validationError('ID é obrigatório');
        }

        const validStatuses = ['open', 'in_progress', 'completed', 'rejected'];
        if (status && !validStatuses.includes(status)) {
            return validationError(`status inválido. Use: ${validStatuses.join(', ')}`);
        }

        // Preparar objeto de atualização
        const updateData: any = {
            status,
            resolution_notes,
            updated_at: new Date().toISOString()
        };

        // Se está pegando a tarefa (in_progress), salvar quem pegou e deadline
        if (status === 'in_progress') {
            updateData.assigned_at = new Date().toISOString();
            if (deadline_days) updateData.deadline_days = deadline_days;
            if (deadline_at) updateData.deadline_at = deadline_at;
        }

        // Se está completando, salvar quem resolveu
        if (status === 'completed') {
            updateData.resolved_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('intelink_data_jobs')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return successResponse({ job: data });

    } catch (e: any) {
        console.error('[Jobs API] Error:', e);
        return errorResponse(e.message || 'Erro ao atualizar tarefa');
    }
}

// Protected: Only member+ can access jobs
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
export const PATCH = withSecurity(handlePatch, { requiredRole: 'member' });
