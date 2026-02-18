/**
 * Tenant Isolation Utilities
 * 
 * Server-side protection for multi-tenancy while RLS is not implemented.
 * This is a TEMPORARY solution until custom JWT + RLS is in place.
 * 
 * @version 1.0.0
 * @date 2025-12-08
 */

import { getSupabaseAdmin } from './api-utils';

const supabase = getSupabaseAdmin();

/**
 * Get the unit_id for a member
 */
export async function getMemberUnitId(memberId: string): Promise<string | null> {
    if (!memberId) return null;
    
    const { data, error } = await supabase
        .from('intelink_unit_members')
        .select('unit_id')
        .eq('id', memberId)
        .single();
    
    if (error || !data) return null;
    return data.unit_id;
}

/**
 * Get the unit_id for an investigation
 */
export async function getInvestigationUnitId(investigationId: string): Promise<string | null> {
    if (!investigationId) return null;
    
    const { data, error } = await supabase
        .from('intelink_investigations')
        .select('unit_id')
        .eq('id', investigationId)
        .single();
    
    if (error || !data) return null;
    return data.unit_id;
}

/**
 * Check if a member has access to an investigation
 * Returns true if member's unit matches investigation's unit
 */
export async function canAccessInvestigation(
    memberId: string, 
    investigationId: string
): Promise<boolean> {
    const [memberUnitId, investigationUnitId] = await Promise.all([
        getMemberUnitId(memberId),
        getInvestigationUnitId(investigationId)
    ]);
    
    if (!memberUnitId || !investigationUnitId) return false;
    return memberUnitId === investigationUnitId;
}

/**
 * Check if a member has access to an entity (via investigation)
 */
export async function canAccessEntity(
    memberId: string, 
    entityId: string
): Promise<boolean> {
    if (!memberId || !entityId) return false;
    
    // Get entity's investigation
    const { data: entity, error } = await supabase
        .from('intelink_entities')
        .select('investigation_id')
        .eq('id', entityId)
        .single();
    
    if (error || !entity?.investigation_id) return false;
    
    return canAccessInvestigation(memberId, entity.investigation_id);
}

/**
 * Check if a member has access to a document (via investigation)
 */
export async function canAccessDocument(
    memberId: string, 
    documentId: string
): Promise<boolean> {
    if (!memberId || !documentId) return false;
    
    // Get document's investigation
    const { data: doc, error } = await supabase
        .from('intelink_documents')
        .select('investigation_id')
        .eq('id', documentId)
        .single();
    
    if (error || !doc?.investigation_id) return false;
    
    return canAccessInvestigation(memberId, doc.investigation_id);
}

/**
 * Get all investigations a member can access
 */
export async function getAccessibleInvestigations(memberId: string): Promise<string[]> {
    const memberUnitId = await getMemberUnitId(memberId);
    if (!memberUnitId) return [];
    
    const { data, error } = await supabase
        .from('intelink_investigations')
        .select('id')
        .eq('unit_id', memberUnitId);
    
    if (error || !data) return [];
    return data.map(inv => inv.id);
}

/**
 * Filter a list of investigation IDs to only those accessible by the member
 */
export async function filterAccessibleInvestigations(
    memberId: string, 
    investigationIds: string[]
): Promise<string[]> {
    const accessible = await getAccessibleInvestigations(memberId);
    const accessibleSet = new Set(accessible);
    return investigationIds.filter(id => accessibleSet.has(id));
}

/**
 * Middleware helper for API routes
 * Throws an error if access is denied
 */
export async function requireInvestigationAccess(
    memberId: string, 
    investigationId: string
): Promise<void> {
    const hasAccess = await canAccessInvestigation(memberId, investigationId);
    if (!hasAccess) {
        throw new Error('TENANT_ACCESS_DENIED');
    }
}

/**
 * Check if member is a super_admin (can access all units)
 */
export async function isSuperAdmin(memberId: string): Promise<boolean> {
    if (!memberId) return false;
    
    const { data, error } = await supabase
        .from('intelink_unit_members')
        .select('system_role')
        .eq('id', memberId)
        .single();
    
    if (error || !data) return false;
    return data.system_role === 'super_admin';
}

/**
 * Check access with super_admin bypass
 */
export async function canAccessInvestigationOrAdmin(
    memberId: string, 
    investigationId: string
): Promise<boolean> {
    // Super admins can access everything
    if (await isSuperAdmin(memberId)) return true;
    
    return canAccessInvestigation(memberId, investigationId);
}
