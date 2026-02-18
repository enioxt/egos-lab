/**
 * API: Roles and Chief Functions
 * 
 * GET: List all roles and chief functions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handleGet(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const type = request.nextUrl.searchParams.get('type'); // 'cargo' | 'funcao_chefia' | null (all)
        
        let query = supabase
            .from('intelink_role_definitions')
            .select('*')
            .order('role_type')
            .order('role_name');
        
        if (type) {
            query = query.eq('role_type', type);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('[Roles API] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        // Group by type
        const roles = {
            cargos: data?.filter(r => r.role_type === 'cargo') || [],
            funcoes_chefia: data?.filter(r => r.role_type === 'funcao_chefia') || [],
            all: data || []
        };
        
        return NextResponse.json(roles);
        
    } catch (error) {
        console.error('[Roles API] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }
}

// Protected: Only authenticated users can access roles
export const GET = withSecurity(handleGet, { requiredRole: 'visitor' });
