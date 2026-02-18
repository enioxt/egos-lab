'use client';

import React, { useState, useEffect } from 'react';

export type SystemRole = 'super_admin' | 'unit_admin' | 'member' | 'intern' | 'visitor';

export interface UserPermissions {
    role: SystemRole;
    isLoading: boolean;
    error: string | null;
    isSuperAdmin: boolean;
    canManageSystem: boolean;
    canManagePermissions: boolean;
    canManageUnits: boolean;
    canManageMembers: boolean;
    canViewMembers: boolean; // Ver membros da própria equipe (todos têm)
    canEditInvestigations: boolean;
    canViewInvestigations: boolean;
    canAccessConfig: boolean;
    isHidden: boolean; // Oculto para outros membros (visitante)
}

const ROLE_PERMISSIONS: Record<SystemRole, Omit<UserPermissions, 'role' | 'isLoading' | 'error'>> = {
    super_admin: {
        isSuperAdmin: true,
        canManageSystem: true,
        canManagePermissions: true,
        canManageUnits: true,
        canManageMembers: true,
        canViewMembers: true,
        canEditInvestigations: true,
        canViewInvestigations: true,
        canAccessConfig: true,
        isHidden: false,
    },
    unit_admin: {
        isSuperAdmin: false,
        canManageSystem: false,
        canManagePermissions: false,
        canManageUnits: true,
        canManageMembers: true,
        canViewMembers: true,
        canEditInvestigations: true,
        canViewInvestigations: true,
        canAccessConfig: false,
        isHidden: false,
    },
    member: {
        isSuperAdmin: false,
        canManageSystem: false,
        canManagePermissions: false,
        canManageUnits: false,
        canManageMembers: false,
        canViewMembers: true,
        canEditInvestigations: true,
        canViewInvestigations: true,
        canAccessConfig: false,
        isHidden: false,
    },
    intern: {
        isSuperAdmin: false,
        canManageSystem: false,
        canManagePermissions: false,
        canManageUnits: false,
        canManageMembers: false,
        canViewMembers: true,
        canEditInvestigations: false,
        canViewInvestigations: true,
        canAccessConfig: false,
        isHidden: false,
    },
    visitor: {
        isSuperAdmin: false,
        canManageSystem: false,
        canManagePermissions: false,
        canManageUnits: false,
        canManageMembers: false,
        canViewMembers: true,
        canEditInvestigations: false,
        canViewInvestigations: true,
        canAccessConfig: false,
        isHidden: true,
    },
};

export const ROLE_LABELS: Record<SystemRole, { label: string; description: string; color: string }> = {
    super_admin: { 
        label: 'Super Admin', 
        description: 'Acesso total ao sistema',
        color: 'red'
    },
    unit_admin: { 
        label: 'Admin da Unidade', 
        description: 'Gerencia sua delegacia',
        color: 'orange'
    },
    member: { 
        label: 'Membro', 
        description: 'Acesso às operações',
        color: 'blue'
    },
    intern: { 
        label: 'Estagiário', 
        description: 'Apenas visualização',
        color: 'gray'
    },
    visitor: { 
        label: 'Visitante', 
        description: 'Demonstração - somente leitura',
        color: 'slate'
    },
};

export function useRole(): UserPermissions {
    const [role, setRole] = useState<SystemRole>('member');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRole = async () => {
            try {
                // First try to get member_id from localStorage
                const memberId = localStorage.getItem('intelink_member_id');
                const accessToken = localStorage.getItem('intelink_access_token');
                const legacyToken = localStorage.getItem('intelink_token');
                
                if (!memberId && !accessToken && !legacyToken) {
                    console.log('[useRole] No auth tokens found, defaulting to visitor');
                    setRole('visitor');
                    setIsLoading(false);
                    return;
                }

                // Try v2 API with access token first, then member_id
                const authValue = accessToken || memberId || legacyToken;
                
                const res = await fetch('/api/v2/auth/me', {
                    headers: { 'Authorization': `Bearer ${authValue}` },
                    credentials: 'include', // Include cookies
                });

                if (res.ok) {
                    const data = await res.json();
                    // v2 API returns systemRole in member object
                    const systemRole = data.member?.systemRole || data.system_role || 'member';
                    console.log('[useRole] Got system_role:', systemRole, 'from API');
                    setRole(systemRole as SystemRole);
                } else {
                    // Try to get role directly from member via API
                    console.warn('[useRole] v2 API failed, trying members API');
                    if (memberId) {
                        const memberRes = await fetch(`/api/members/me`, {
                            headers: { 'Authorization': `Bearer ${memberId}` }
                        });
                        if (memberRes.ok) {
                            const memberData = await memberRes.json();
                            const systemRole = memberData.system_role || memberData.systemRole || 'member';
                            console.log('[useRole] Got system_role from members API:', systemRole);
                            setRole(systemRole as SystemRole);
                            return;
                        }
                    }
                    console.warn('[useRole] All APIs failed, defaulting to visitor');
                    setRole('visitor');
                }
            } catch (e) {
                console.error('[useRole] Error:', e);
                setError('Erro ao verificar permissões');
                setRole('visitor');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRole();
    }, []);

    const permissions = ROLE_PERMISSIONS[role];

    return {
        role,
        isLoading,
        error,
        ...permissions,
    };
}

// Component for access denied screen
export function AccessDenied({ message }: { message?: string }) {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h1 className="text-xl font-bold text-white mb-2">Acesso Restrito</h1>
                <p className="text-slate-400">{message || 'Você não tem permissão para acessar esta página.'}</p>
            </div>
        </div>
    );
}

// Loading component
export function RoleLoading() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
}
