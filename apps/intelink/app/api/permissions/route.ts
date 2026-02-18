/**
 * API de Permissões
 * Retorna as permissões do usuário logado baseado no seu role
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { withSecurity, SecureContext } from '@/lib/security/middleware';

async function handler(request: NextRequest, context: SecureContext) {
    const { user } = context;
    const supabase = getSupabaseAdmin();
    
    // User is already authenticated by withSecurity
    if (!user?.memberId) {
        return NextResponse.json({ 
            error: 'Membro não encontrado',
            permissions: getDefaultPermissions() 
        }, { status: 404 });
    }
    
    // Get member role
    const { data: member } = await supabase
        .from('intelink_unit_members')
        .select('role')
        .eq('id', user.memberId)
        .single();
    
    if (!member) {
        return NextResponse.json({ 
            error: 'Membro não encontrado',
            permissions: getDefaultPermissions() 
        }, { status: 404 });
    }
    
    // Get permissions for role
    const { data: permissions } = await supabase
        .from('intelink_role_permissions')
        .select('*')
        .eq('role_code', member.role)
        .single();
    
    if (!permissions) {
        // Role não tem permissões definidas, usar padrão restritivo
        return NextResponse.json({ 
            role: member.role,
            permissions: getDefaultPermissions() 
        });
    }
    
    return NextResponse.json({
        role: member.role,
        permissions: {
            // Operação
            canCreateInvestigation: permissions.can_create_investigation,
            canEditInvestigation: permissions.can_edit_investigation,
            canDeleteInvestigation: permissions.can_delete_investigation,
            canArchiveInvestigation: permissions.can_archive_investigation,
            
            // Documentos
            canUploadDocuments: permissions.can_upload_documents,
            canDeleteDocuments: permissions.can_delete_documents,
            canExtractDocuments: permissions.can_extract_documents,
            
            // Entidades
            canCreateEntity: permissions.can_create_entity,
            canEditEntity: permissions.can_edit_entity,
            canDeleteEntity: permissions.can_delete_entity,
            
            // Membros
            canViewAllMembers: permissions.can_view_all_members,
            canEditMembers: permissions.can_edit_members,
            canAddMembers: permissions.can_add_members,
            canRemoveMembers: permissions.can_remove_members,
            canChangeMemberRole: permissions.can_change_member_role,
            
            // Central
            canAccessCentral: permissions.can_access_central,
            canViewCrossCaseAnalysis: permissions.can_view_cross_case_analysis,
            canExportReports: permissions.can_export_reports,
            
            // Chat
            canUseChat: permissions.can_use_chat,
            canShareChatSessions: permissions.can_share_chat_sessions,
            
            // Admin
            canManagePermissions: permissions.can_manage_permissions,
            canAccessConfig: permissions.can_access_config,
            canViewAuditLogs: permissions.can_view_audit_logs,
        }
    });
}

export const GET = withSecurity(handler, {
    auth: true,
    rateLimit: 'default',
});

function getDefaultPermissions() {
    return {
        canCreateInvestigation: false,
        canEditInvestigation: false,
        canDeleteInvestigation: false,
        canArchiveInvestigation: false,
        canUploadDocuments: true,
        canDeleteDocuments: false,
        canExtractDocuments: true,
        canCreateEntity: true,
        canEditEntity: true,
        canDeleteEntity: false,
        canViewAllMembers: false,
        canEditMembers: false,
        canAddMembers: false,
        canRemoveMembers: false,
        canChangeMemberRole: false,
        canAccessCentral: false,
        canViewCrossCaseAnalysis: false,
        canExportReports: false,
        canUseChat: true,
        canShareChatSessions: false,
        canManagePermissions: false,
        canAccessConfig: false,
        canViewAuditLogs: false,
    };
}
