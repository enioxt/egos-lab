'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UserPermissions {
    // Operação
    canCreateInvestigation: boolean;
    canEditInvestigation: boolean;
    canDeleteInvestigation: boolean;
    canArchiveInvestigation: boolean;
    
    // Documentos
    canUploadDocuments: boolean;
    canDeleteDocuments: boolean;
    canExtractDocuments: boolean;
    
    // Entidades
    canCreateEntity: boolean;
    canEditEntity: boolean;
    canDeleteEntity: boolean;
    
    // Membros
    canViewAllMembers: boolean;
    canEditMembers: boolean;
    canAddMembers: boolean;
    canRemoveMembers: boolean;
    canChangeMemberRole: boolean;
    
    // Central
    canAccessCentral: boolean;
    canViewCrossCaseAnalysis: boolean;
    canExportReports: boolean;
    
    // Chat
    canUseChat: boolean;
    canShareChatSessions: boolean;
    
    // Admin
    canManagePermissions: boolean;
    canAccessConfig: boolean;
    canViewAuditLogs: boolean;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
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

// Permissões baseadas em role (fallback quando API não responde)
const ROLE_PERMISSIONS: Record<string, Partial<UserPermissions>> = {
    delegado: {
        canCreateInvestigation: true,
        canEditInvestigation: true,
        canDeleteInvestigation: true,
        canArchiveInvestigation: true,
        canUploadDocuments: true,
        canDeleteDocuments: true,
        canExtractDocuments: true,
        canCreateEntity: true,
        canEditEntity: true,
        canDeleteEntity: true,
        canViewAllMembers: true,
        canEditMembers: true,
        canAddMembers: true,
        canRemoveMembers: true,
        canChangeMemberRole: true,
        canAccessCentral: true,
        canViewCrossCaseAnalysis: true,
        canExportReports: true,
        canUseChat: true,
        canShareChatSessions: true,
        canManagePermissions: true,
        canAccessConfig: true,
        canViewAuditLogs: true,
    },
    escrivao: {
        canCreateInvestigation: true,
        canEditInvestigation: true,
        canDeleteInvestigation: false,
        canUploadDocuments: true,
        canDeleteDocuments: true,
        canAccessCentral: true,
    },
    investigador: {
        canCreateInvestigation: false,
        canEditInvestigation: true,
        canUploadDocuments: true,
        canAccessCentral: true,
    },
    estagiario: {
        canUploadDocuments: true,
        canUseChat: true,
    },
};

export function usePermissions() {
    const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [systemRole, setSystemRole] = useState<string | null>(null);

    const fetchPermissions = useCallback(async () => {
        if (typeof window === 'undefined') return;
        
        const token = localStorage.getItem('intelink_token');
        const storedRole = localStorage.getItem('intelink_role');
        const storedSystemRole = localStorage.getItem('intelink_system_role');
        
        if (!token) {
            setPermissions(DEFAULT_PERMISSIONS);
            setLoading(false);
            return;
        }

        setRole(storedRole);
        setSystemRole(storedSystemRole);

        try {
            const res = await fetch('/api/permissions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (res.ok) {
                const data = await res.json();
                setPermissions(data.permissions || DEFAULT_PERMISSIONS);
                if (data.role) setRole(data.role);
            } else {
                // Fallback: use role-based permissions
                if (storedRole && ROLE_PERMISSIONS[storedRole]) {
                    setPermissions({
                        ...DEFAULT_PERMISSIONS,
                        ...ROLE_PERMISSIONS[storedRole]
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching permissions:', err);
            setError('Error fetching permissions');
            
            // Fallback: use role-based permissions
            if (storedRole && ROLE_PERMISSIONS[storedRole]) {
                setPermissions({
                    ...DEFAULT_PERMISSIONS,
                    ...ROLE_PERMISSIONS[storedRole]
                });
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    // Helper functions
    const hasPermission = useCallback((permission: keyof UserPermissions): boolean => {
        return permissions[permission] === true;
    }, [permissions]);

    const isAdmin = useCallback((): boolean => {
        return role === 'delegado' || role === 'delegado_regional' || permissions.canManagePermissions;
    }, [role, permissions.canManagePermissions]);

    const isSuperAdmin = systemRole === 'super_admin';

    return { 
        permissions, 
        loading,
        isLoading: loading, // Alias for backwards compatibility
        error, 
        role,
        systemRole,
        hasPermission,
        isAdmin,
        isSuperAdmin,
        refetch: fetchPermissions 
    };
}
