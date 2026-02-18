import { NextRequest, NextResponse } from 'next/server';
import { 
    getSupabaseAdmin, 
    successResponse, 
    errorResponse, 
    validationError,
    parseIntSafe,
    parseBoolSafe
} from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { logInvestigationAction } from '@/lib/audit-service';

async function handlePatch(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { id, status } = await req.json();

        if (!id || !status) {
            return validationError('id e status são obrigatórios');
        }

        const validStatuses = ['active', 'archived', 'finished', 'pending'];
        if (!validStatuses.includes(status)) {
            return validationError(`status inválido. Use: ${validStatuses.join(', ')}`);
        }

        // Get investigation title for audit (with tenant check)
        const { data: inv } = await supabase
            .from('intelink_investigations')
            .select('title, unit_id')
            .eq('id', id)
            .single();

        // TENANT ISOLATION: Verify ownership (unless super_admin)
        if (inv && auth.unitId && auth.systemRole !== 'super_admin' && inv.unit_id !== auth.unitId) {
            return NextResponse.json({ error: 'Acesso negado: operação de outra unidade' }, { status: 403 });
        }

        const { error } = await supabase
            .from('intelink_investigations')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        // Audit log for archive action
        if (status === 'archived') {
            await logInvestigationAction(
                'investigation_archive',
                { id: auth.memberId, name: auth.memberName, role: auth.systemRole },
                { id, title: inv?.title || 'Unknown' }
            );
        }

        return successResponse({ updated: true });
    } catch (e: any) {
        console.error('[Investigations PATCH] Error:', e);
        return errorResponse(e.message || 'Erro ao atualizar operação');
    }
}

// Protected: Only member+ can update investigations
export const PATCH = withSecurity(handlePatch, { requiredRole: 'member' });

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const limit = parseIntSafe(searchParams.get('limit'), 10);
        const showDeleted = parseBoolSafe(searchParams.get('deleted'), false);

        // Build query based on deleted filter
        let query = supabase
            .from('intelink_investigations')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(limit);

        // TENANT ISOLATION: Filter by unit_id (unless super_admin)
        if (auth.unitId && auth.systemRole !== 'super_admin') {
            query = query.eq('unit_id', auth.unitId);
            console.log(`[Investigations API] Filtering by unit_id: ${auth.unitId}`);
        }

        // Filter by deleted status
        if (showDeleted) {
            query = query.not('deleted_at', 'is', null);
        } else {
            query = query.is('deleted_at', null);
        }

        const { data: investigations, error } = await query;

        if (error) throw error;

        // Get counts for each investigation in parallel
        const enriched = await Promise.all((investigations || []).map(async (inv: any) => {
            const [{ count: entityCount }, { count: relCount }, { count: evidenceCount }, { count: documentsCount }] = await Promise.all([
                supabase.from('intelink_entities').select('*', { count: 'exact', head: true }).eq('investigation_id', inv.id),
                supabase.from('intelink_relationships').select('*', { count: 'exact', head: true }).eq('investigation_id', inv.id),
                supabase.from('intelink_evidence').select('*', { count: 'exact', head: true }).eq('investigation_id', inv.id),
                supabase.from('intelink_documents').select('*', { count: 'exact', head: true }).eq('investigation_id', inv.id)
            ]);
            return {
                ...inv,
                entity_count: entityCount || 0,
                relationship_count: relCount || 0,
                evidence_count: (evidenceCount || 0) + (documentsCount || 0)
            };
        }));

        return successResponse({ investigations: enriched });

    } catch (e: any) {
        console.error('[Investigations API] Error:', e);
        return errorResponse(e.message || 'Erro ao buscar operações');
    }
}

// Protected: Only member+ can view investigations
export const GET = withSecurity(handleGet, { requiredRole: 'member' });

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { title, description, unit_id, status = 'active', team_members = [] } = await req.json();

        if (!title?.trim()) {
            return validationError('Título é obrigatório');
        }

        // Check if user has permission to create (intern cannot)
        // NOTE: visitor temporarily allowed for testing
        if (auth.systemRole === 'intern') {
            return NextResponse.json(
                { error: 'Estagiários não podem criar operações' },
                { status: 403 }
            );
        }

        // TENANT ISOLATION: Use auth.unitId if unit_id not provided
        // If still null, get the first available unit (for testing/demo)
        let effectiveUnitId = unit_id || auth.unitId;
        
        if (!effectiveUnitId) {
            // Fallback: get first unit from database
            const { data: firstUnit } = await supabase
                .from('intelink_police_units')
                .select('id')
                .limit(1)
                .single();
            effectiveUnitId = firstUnit?.id;
        }
        
        if (!effectiveUnitId) {
            return validationError('Nenhuma delegacia disponível. Crie uma delegacia primeiro.');
        }
        
        // Prevent creating in another unit (unless super_admin)
        if (unit_id && auth.systemRole !== 'super_admin' && unit_id !== auth.unitId) {
            return NextResponse.json({ error: 'Acesso negado: não pode criar operação em outra unidade' }, { status: 403 });
        }

        // DUPLICATE PREVENTION: Check if name already exists and add number if needed
        let finalTitle = title.trim().toUpperCase();
        const baseTitle = finalTitle;
        
        // Check for existing operations with same name
        const { data: existing } = await supabase
            .from('intelink_investigations')
            .select('title')
            .ilike('title', `${baseTitle}%`)
            .eq('unit_id', effectiveUnitId);
        
        if (existing && existing.length > 0) {
            // Find the highest number suffix
            const existingTitles = existing.map(e => e.title);
            
            // Check if exact match exists
            if (existingTitles.includes(baseTitle)) {
                // Find next available number
                let counter = 2;
                while (existingTitles.includes(`${baseTitle} ${counter}`)) {
                    counter++;
                }
                finalTitle = `${baseTitle} ${counter}`;
            }
        }

        // Create investigation
        const { data: investigation, error: invError } = await supabase
            .from('intelink_investigations')
            .insert([{
                title: finalTitle,
                description: description?.trim() || null,
                unit_id: effectiveUnitId,
                status,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (invError) throw invError;

        // Save team members if provided
        if (team_members.length > 0 && investigation) {
            const teamInserts = team_members.map((memberId: string) => ({
                investigation_id: investigation.id,
                member_id: memberId
            }));
            await supabase.from('intelink_investigation_members').insert(teamInserts);
        }

        // Audit log
        await logInvestigationAction(
            'investigation_create',
            { id: auth.memberId, name: auth.memberName, role: auth.systemRole },
            { id: investigation.id, title: investigation.title }
        );

        return NextResponse.json({ 
            success: true, 
            investigation 
        }, { status: 201 });

    } catch (e: any) {
        console.error('[Investigations POST] Error:', e);
        return errorResponse(e.message || 'Erro ao criar operação');
    }
}

// TESTING: Public access during development. Set requiredRole: 'member' for production
export const POST = withSecurity(handlePost, { allowPublic: true });
