/**
 * Tenant Guard - API Route Protection
 * 
 * Middleware-style helpers for tenant isolation in API routes.
 * Provides consistent access control across all endpoints.
 * 
 * @version 1.0.0
 * @date 2025-12-08
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from './api-utils';
import { AuthContext } from './api-security';

const supabase = getSupabaseAdmin();

/**
 * Access denied response (Portuguese)
 */
export function accessDenied(resource: string = 'recurso'): NextResponse {
    return NextResponse.json(
        { error: `Acesso negado: ${resource} pertence a outra unidade` },
        { status: 403 }
    );
}

/**
 * Check if user can access an investigation
 * Returns null if allowed, NextResponse if denied
 */
export async function guardInvestigation(
    auth: AuthContext, 
    investigationId: string
): Promise<NextResponse | null> {
    // Super admins bypass
    if (auth.systemRole === 'super_admin') return null;
    
    // No unit_id means user not properly authenticated
    if (!auth.unitId) {
        return NextResponse.json(
            { error: 'Contexto de unidade não encontrado. Faça login novamente.' },
            { status: 401 }
        );
    }
    
    // Get investigation's unit_id
    const { data: inv, error } = await supabase
        .from('intelink_investigations')
        .select('unit_id')
        .eq('id', investigationId)
        .single();
    
    if (error || !inv) {
        return NextResponse.json(
            { error: 'Operação não encontrada' },
            { status: 404 }
        );
    }
    
    // Check ownership
    if (inv.unit_id !== auth.unitId) {
        console.log(`[TenantGuard] Access denied: user unit ${auth.unitId} != investigation unit ${inv.unit_id}`);
        return accessDenied('operação');
    }
    
    return null; // Access granted
}

/**
 * Check if user can access an entity
 * Returns null if allowed, NextResponse if denied
 */
export async function guardEntity(
    auth: AuthContext, 
    entityId: string
): Promise<NextResponse | null> {
    // Super admins bypass
    if (auth.systemRole === 'super_admin') return null;
    
    if (!auth.unitId) {
        return NextResponse.json(
            { error: 'Contexto de unidade não encontrado' },
            { status: 401 }
        );
    }
    
    // Get entity's investigation -> unit
    const { data: entity, error } = await supabase
        .from('intelink_entities')
        .select('investigation_id')
        .eq('id', entityId)
        .single();
    
    if (error || !entity) {
        return NextResponse.json(
            { error: 'Entidade não encontrada' },
            { status: 404 }
        );
    }
    
    return guardInvestigation(auth, entity.investigation_id);
}

/**
 * Check if user can access a document
 * Returns null if allowed, NextResponse if denied
 */
export async function guardDocument(
    auth: AuthContext, 
    documentId: string
): Promise<NextResponse | null> {
    // Super admins bypass
    if (auth.systemRole === 'super_admin') return null;
    
    if (!auth.unitId) {
        return NextResponse.json(
            { error: 'Contexto de unidade não encontrado' },
            { status: 401 }
        );
    }
    
    // Get document's investigation -> unit
    const { data: doc, error } = await supabase
        .from('intelink_documents')
        .select('investigation_id')
        .eq('id', documentId)
        .single();
    
    if (error || !doc) {
        return NextResponse.json(
            { error: 'Documento não encontrado' },
            { status: 404 }
        );
    }
    
    return guardInvestigation(auth, doc.investigation_id);
}

/**
 * Filter query by unit_id
 * Call this on list queries to only return data from user's unit
 */
export function applyUnitFilter(
    query: any, 
    auth: AuthContext,
    unitIdColumn: string = 'unit_id'
): any {
    // Super admins see all
    if (auth.systemRole === 'super_admin') return query;
    
    // Filter by user's unit
    if (auth.unitId) {
        return query.eq(unitIdColumn, auth.unitId);
    }
    
    return query;
}

/**
 * Filter investigations query
 * For queries on tables that reference investigation_id
 */
export async function getAccessibleInvestigationIds(auth: AuthContext): Promise<string[]> {
    // Super admins get all
    if (auth.systemRole === 'super_admin') {
        const { data } = await supabase
            .from('intelink_investigations')
            .select('id');
        return (data || []).map((i: any) => i.id);
    }
    
    if (!auth.unitId) return [];
    
    const { data } = await supabase
        .from('intelink_investigations')
        .select('id')
        .eq('unit_id', auth.unitId);
    
    return (data || []).map((i: any) => i.id);
}

/**
 * Check if request is for user's own unit
 * Used for unit management endpoints
 */
export function guardOwnUnit(auth: AuthContext, targetUnitId: string): NextResponse | null {
    if (auth.systemRole === 'super_admin') return null;
    
    if (auth.unitId !== targetUnitId) {
        return accessDenied('unidade');
    }
    
    return null;
}

/**
 * Log tenant access attempt for auditing
 */
export function logTenantAccess(
    endpoint: string,
    action: 'allowed' | 'denied',
    auth: AuthContext,
    resourceType: string,
    resourceId?: string
): void {
    const level = action === 'denied' ? 'warn' : 'info';
    console[level](
        `[TenantGuard] ${endpoint} - ${action.toUpperCase()}`,
        {
            memberId: auth.memberId,
            unitId: auth.unitId,
            role: auth.systemRole,
            resourceType,
            resourceId,
        }
    );
}
