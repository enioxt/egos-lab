'use client';

/**
 * Auth System v2.0 - useAuth Hook
 * 
 * React hook for authentication state management
 * Handles login, logout, and session verification
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthState, Member, SystemRole, Permission } from '../types';
import { ROLE_PERMISSIONS, hasPermission } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseAuthReturn {
    // State
    isAuthenticated: boolean;
    isLoading: boolean;
    member: Member | null;
    error: string | null;
    
    // Actions
    login: (phone: string, password: string, rememberMe?: boolean) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshSession: () => Promise<boolean>;
    
    // Permissions
    hasPermission: (permission: Permission) => boolean;
    canAccessAdmin: boolean;
    
    // Utilities
    clearError: () => void;
}

export interface UseAuthOptions {
    /** Redirect to login if not authenticated */
    requireAuth?: boolean;
    /** Required roles for access */
    requiredRoles?: SystemRole[];
    /** Redirect URL if not authorized */
    redirectUrl?: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
    const { requireAuth = false, requiredRoles, redirectUrl = '/login' } = options;
    const router = useRouter();

    // State
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        session: null,
        error: null,
    });

    const [member, setMember] = useState<Member | null>(null);

    // ========================================================================
    // SESSION VERIFICATION
    // ========================================================================

    const verifySession = useCallback(async (): Promise<boolean> => {
        try {
            const response = await fetch('/api/v2/auth/verify', {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                const data = await response.json();
                
                // If token should be refreshed, try to refresh
                if (data.shouldRefresh) {
                    return await refreshSessionInternal();
                }
                
                setMember(null);
                setState(prev => ({
                    ...prev,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                }));
                return false;
            }

            const data = await response.json();
            
            if (data.valid && data.member) {
                setMember(data.member);
                setState(prev => ({
                    ...prev,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                }));
                
                // If should refresh soon, do it in background
                if (data.shouldRefresh) {
                    refreshSessionInternal();
                }
                
                return true;
            }

            return false;
        } catch (error) {
            console.error('[useAuth] Verify error:', error);
            setState(prev => ({
                ...prev,
                isAuthenticated: false,
                isLoading: false,
                error: 'Erro ao verificar sessão',
            }));
            return false;
        }
    }, []);

    // ========================================================================
    // REFRESH SESSION
    // ========================================================================

    const refreshSessionInternal = useCallback(async (): Promise<boolean> => {
        try {
            const response = await fetch('/api/v2/auth/refresh', {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                return false;
            }

            // Re-verify to get updated member info
            return await verifySession();
        } catch (error) {
            console.error('[useAuth] Refresh error:', error);
            return false;
        }
    }, [verifySession]);

    const refreshSession = useCallback(async (): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true }));
        const result = await refreshSessionInternal();
        setState(prev => ({ ...prev, isLoading: false }));
        return result;
    }, [refreshSessionInternal]);

    // ========================================================================
    // LOGIN
    // ========================================================================

    const login = useCallback(async (
        phone: string, 
        password: string, 
        rememberMe = false
    ): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await fetch('/api/v2/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ phone, password, rememberMe }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: data.error || 'Erro ao fazer login',
                }));
                return false;
            }

            // Login successful - verify session to get full member data
            await verifySession();
            return true;
        } catch (error) {
            console.error('[useAuth] Login error:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Erro de conexão. Verifique sua internet.',
            }));
            return false;
        }
    }, [verifySession]);

    // ========================================================================
    // LOGOUT
    // ========================================================================

    const logout = useCallback(async (): Promise<void> => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            await fetch('/api/v2/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('[useAuth] Logout error:', error);
        }

        // Clear state regardless of API result
        setMember(null);
        setState({
            isAuthenticated: false,
            isLoading: false,
            session: null,
            error: null,
        });

        // Clear localStorage (legacy)
        if (typeof window !== 'undefined') {
            localStorage.removeItem('intelink_chat_id');
            localStorage.removeItem('intelink_phone');
            localStorage.removeItem('intelink_token');
            localStorage.removeItem('intelink_username');
            localStorage.removeItem('intelink_member_id');
            localStorage.removeItem('intelink_role');
            localStorage.removeItem('intelink_user');
        }

        // Redirect to login
        router.push('/login');
    }, [router]);

    // ========================================================================
    // PERMISSIONS
    // ========================================================================

    const checkPermission = useCallback((permission: Permission): boolean => {
        if (!member?.systemRole) return false;
        return hasPermission(member.systemRole as SystemRole, permission);
    }, [member?.systemRole]);

    const canAccessAdmin = useMemo(() => {
        if (!member?.systemRole) return false;
        return ['super_admin', 'unit_admin'].includes(member.systemRole);
    }, [member?.systemRole]);

    // ========================================================================
    // CLEAR ERROR
    // ========================================================================

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    // ========================================================================
    // INITIAL VERIFICATION
    // ========================================================================

    useEffect(() => {
        verifySession();
    }, [verifySession]);

    // ========================================================================
    // REQUIRE AUTH REDIRECT
    // ========================================================================

    useEffect(() => {
        if (state.isLoading) return;

        if (requireAuth && !state.isAuthenticated) {
            router.push(redirectUrl);
            return;
        }

        if (requiredRoles && member) {
            if (!requiredRoles.includes(member.systemRole as SystemRole)) {
                router.push('/');
            }
        }
    }, [state.isLoading, state.isAuthenticated, requireAuth, requiredRoles, member, router, redirectUrl]);

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        member,
        error: state.error,
        login,
        logout,
        refreshSession,
        hasPermission: checkPermission,
        canAccessAdmin,
        clearError,
    };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for protected pages
 */
export function useRequireAuth(redirectUrl = '/auth') {
    return useAuth({ requireAuth: true, redirectUrl });
}

/**
 * Hook for admin pages
 */
export function useRequireAdmin(redirectUrl = '/') {
    return useAuth({ 
        requireAuth: true, 
        requiredRoles: ['super_admin', 'unit_admin'],
        redirectUrl,
    });
}
