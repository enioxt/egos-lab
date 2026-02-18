import { NextRequest, NextResponse } from 'next/server';
import { 
    getSupabaseAdmin, 
    successResponse, 
    errorResponse, 
    validationError,
    createdResponse 
} from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { data: units, error } = await supabase
            .from('intelink_police_units')
            .select('*')
            .order('code');

        if (error) throw error;

        return successResponse({ units });
    } catch (e: any) {
        console.error('[Units API] Error:', e);
        return errorResponse(e.message || 'Erro ao buscar unidades');
    }
}

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        
        if (!body.code || !body.name) {
            return validationError('code e name são obrigatórios');
        }

        const { data, error } = await supabase
            .from('intelink_police_units')
            .insert([body])
            .select()
            .single();

        if (error) throw error;

        return createdResponse({ unit: data });
    } catch (e: any) {
        console.error('[Units API] Error:', e);
        return errorResponse(e.message || 'Erro ao criar unidade');
    }
}

async function handlePatch(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return validationError('ID é obrigatório');
        }

        const { data, error } = await supabase
            .from('intelink_police_units')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return successResponse({ unit: data });
    } catch (e: any) {
        console.error('[Units API] Error:', e);
        return errorResponse(e.message || 'Erro ao atualizar unidade');
    }
}

async function handleDelete(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return validationError('ID é obrigatório');
        }

        const { error } = await supabase
            .from('intelink_police_units')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return successResponse({ deleted: true });
    } catch (e: any) {
        console.error('[Units API] Error:', e);
        return errorResponse(e.message || 'Erro ao remover unidade');
    }
}

// Protected: GET for all, POST/PATCH/DELETE for admins only
export const GET = withSecurity(handleGet, { requiredRole: 'visitor' });
export const POST = withSecurity(handlePost, { requiredRole: 'super_admin' });
export const PATCH = withSecurity(handlePatch, { requiredRole: 'super_admin' });
export const DELETE = withSecurity(handleDelete, { requiredRole: 'super_admin' });
