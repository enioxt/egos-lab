'use client';

/**
 * useRBAC - React Hook for Role-Based Access Control
 * ==================================================
 * 
 * Provides permission checking in React components
 * with automatic context loading and caching.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    SystemRole,
    FunctionalRole,
    Permission,
    UserAccessContext,
    buildAccessContext,
    hasPermission,
    canAccessRoute,
    getRestrictedRoutes,
    canManageRole,
    SYSTEM_ROLE_METADATA,
    FUNCTIONAL_ROLE_METADATA,
} from './index';

// ========================================
// TYPES
// ========================================

export interface RBACState {
    context: UserAccessContext | null;
    isLoading: boolean;
    error: string | null;
}

export interface RBACActions {
    can: (permission: Permission, resourceOwnerId?: string, resourceUnitId?: string) => boolean;
    canRoute: (route: string) => boolean;
    canManage: (targetRole: SystemRole) => boolean;
    isAdmin: () => boolean;
    isUnitAdmin: () => boolean;
    isHidden: () => boolean;
    refresh: () => Promise<void>;
}

export type RBACHook = RBACState & RBACActions & {
    // Convenience accessors
    role: SystemRole;
    functionalRole: FunctionalRole;
    unitId: string;
    unitName: string;
    roleLabel: string;
    roleColor: string;
    restrictedRoutes: string[];
};

// ========================================
// HOOK IMPLEMENTATION
// ========================================

export function useRBAC(): RBACHook {
    const [state, setState] = useState<RBACState>({
        context: null,
        isLoading: true,
        error: null,
    });

    const fetchContext = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            
            // TESTING MODE: Make system permissive during development
            // Uses NEXT_PUBLIC_TESTING_MODE env var (default: false in production)
            const TESTING_MODE = process.env.NEXT_PUBLIC_TESTING_MODE === 'true';
            
            // Use member_id if available, otherwise use token
            const memberId = localStorage.getItem('intelink_member_id');
            const token = localStorage.getItem('intelink_token');
            const username = localStorage.getItem('intelink_username');
            const authValue = memberId || token;
            
            if (!authValue) {
                // In TESTING_MODE, default to member (can do most things)
                // In production, default to visitor (read-only)
                const defaultRole = TESTING_MODE ? 'member' : 'visitor';
                const defaultContext = buildAccessContext(
                    username || 'anonymous',
                    defaultRole,
                    'agente',
                    'none'
                );
                setState({ context: defaultContext, isLoading: false, error: null });
                return;
            }

            const res = await fetch('/api/v2/auth/me', {
                headers: { 'Authorization': `Bearer ${authValue}` }
            });

            if (!res.ok) {
                throw new Error('Failed to fetch user context');
            }

            const data = await res.json();
            
            const context = buildAccessContext(
                data.id || data.member_id,
                (data.system_role as SystemRole) || 'member',
                (data.role as FunctionalRole) || 'agente',
                data.unit_id || '',
                data.unit?.name || data.unit?.code
            );

            setState({ context, isLoading: false, error: null });
        } catch (e) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: e instanceof Error ? e.message : 'Unknown error',
            }));
        }
    }, []);

    useEffect(() => {
        fetchContext();
    }, [fetchContext]);

    // ========================================
    // PERMISSION CHECK METHODS
    // ========================================

    const can = useCallback((
        permission: Permission,
        resourceOwnerId?: string,
        resourceUnitId?: string
    ): boolean => {
        if (!state.context) return false;
        return hasPermission(state.context, permission, resourceOwnerId, resourceUnitId);
    }, [state.context]);

    const canRoute = useCallback((route: string): boolean => {
        if (!state.context) return false;
        return canAccessRoute(state.context, route);
    }, [state.context]);

    const canManage = useCallback((targetRole: SystemRole): boolean => {
        if (!state.context) return false;
        return canManageRole(state.context.systemRole, targetRole);
    }, [state.context]);

    const isAdmin = useCallback((): boolean => {
        if (!state.context) return false;
        return ['super_admin', 'org_admin'].includes(state.context.systemRole);
    }, [state.context]);

    const isUnitAdmin = useCallback((): boolean => {
        if (!state.context) return false;
        return ['super_admin', 'org_admin', 'unit_admin'].includes(state.context.systemRole);
    }, [state.context]);

    const isHidden = useCallback((): boolean => {
        if (!state.context) return false;
        return state.context.isHidden;
    }, [state.context]);

    // ========================================
    // COMPUTED VALUES
    // ========================================

    const role = state.context?.systemRole || 'visitor';
    const functionalRole = state.context?.functionalRole || 'estagiario';
    const unitId = state.context?.unitId || '';
    const unitName = state.context?.unitName || '';
    
    const roleLabel = SYSTEM_ROLE_METADATA[role]?.label || role;
    const roleColor = SYSTEM_ROLE_METADATA[role]?.color || 'slate';
    
    const restrictedRoutes = useMemo(() => {
        if (!state.context) return [];
        return getRestrictedRoutes(state.context);
    }, [state.context]);

    // ========================================
    // RETURN
    // ========================================

    return {
        // State
        context: state.context,
        isLoading: state.isLoading,
        error: state.error,
        
        // Actions
        can,
        canRoute,
        canManage,
        isAdmin,
        isUnitAdmin,
        isHidden,
        refresh: fetchContext,
        
        // Convenience
        role,
        functionalRole,
        unitId,
        unitName,
        roleLabel,
        roleColor,
        restrictedRoutes,
    };
}

// ========================================
// GUARD COMPONENTS
// ========================================

interface PermissionGuardProps {
    permission: Permission;
    resourceOwnerId?: string;
    resourceUnitId?: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function PermissionGuard({
    permission,
    resourceOwnerId,
    resourceUnitId,
    children,
    fallback = null,
}: PermissionGuardProps) {
    const { can, isLoading } = useRBAC();
    
    if (isLoading) return null;
    
    if (!can(permission, resourceOwnerId, resourceUnitId)) {
        return <>{fallback}</>;
    }
    
    return <>{children}</>;
}

interface RoleGuardProps {
    roles: SystemRole[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function RoleGuard({
    roles,
    children,
    fallback = null,
}: RoleGuardProps) {
    const { role, isLoading } = useRBAC();
    
    if (isLoading) return null;
    
    if (!roles.includes(role)) {
        return <>{fallback}</>;
    }
    
    return <>{children}</>;
}

// ========================================
// HIGHER-ORDER COMPONENT
// ========================================

export function withRBAC<P extends object>(
    WrappedComponent: React.ComponentType<P & { rbac: RBACHook }>,
    requiredPermission?: Permission
) {
    return function WithRBACComponent(props: P) {
        const rbac = useRBAC();
        
        if (rbac.isLoading) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            );
        }
        
        if (requiredPermission && !rbac.can(requiredPermission)) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🔒</div>
                        <h1 className="text-xl font-bold text-white mb-2">Acesso Restrito</h1>
                        <p className="text-slate-400">Você não tem permissão para acessar esta página.</p>
                    </div>
                </div>
            );
        }
        
        return <WrappedComponent {...props} rbac={rbac} />;
    };
}

export default useRBAC;
