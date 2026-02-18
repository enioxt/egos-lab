'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    role: string;
    unit_id?: string;
}

interface Session {
    token: string;
    expires_at?: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (user: User, session: Session) => void;
    logout: () => void;
    refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    login: () => {},
    logout: () => {},
    refreshUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const refreshUser = useCallback(() => {
        if (typeof window === 'undefined') return;
        
        const storedUser = localStorage.getItem('intelink_user');
        const storedToken = localStorage.getItem('intelink_token');
        
        if (storedUser && storedToken) {
            try {
                setUser(JSON.parse(storedUser));
                setSession({ token: storedToken });
            } catch (e) {
                console.error('Error parsing stored user:', e);
                localStorage.removeItem('intelink_user');
                localStorage.removeItem('intelink_token');
                setUser(null);
                setSession(null);
            }
        } else {
            setUser(null);
            setSession(null);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        refreshUser();
        
        // Listen for storage changes (cross-tab sync)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'intelink_token' || e.key === 'intelink_user') {
                refreshUser();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [refreshUser]);

    const login = useCallback((newUser: User, newSession: Session) => {
        setUser(newUser);
        setSession(newSession);
        localStorage.setItem('intelink_user', JSON.stringify(newUser));
        localStorage.setItem('intelink_token', newSession.token);
        
        // Set cookie for middleware
        document.cookie = `intelink_session=${newSession.token}; path=/; max-age=${60*60*24*30}; SameSite=Lax`;
    }, []);

    const logout = useCallback(async () => {
        // Call logout API to clear server-side cookies
        try {
            await fetch('/api/v2/auth/logout', { 
                method: 'POST',
                credentials: 'include',
            });
        } catch (e) {
            console.error('Logout API error:', e);
        }

        setUser(null);
        setSession(null);
        
        // Clear all auth data
        localStorage.removeItem('intelink_user');
        localStorage.removeItem('intelink_token');
        localStorage.removeItem('intelink_chat_id');
        localStorage.removeItem('intelink_username');
        localStorage.removeItem('intelink_member_id');
        localStorage.removeItem('intelink_role');
        localStorage.removeItem('intelink_remember_token');
        localStorage.removeItem('intelink_phone');
        
        // Clear cookies (both legacy and v2) - client side backup
        document.cookie = 'intelink_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'intelink_access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'intelink_refresh=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'intelink_member_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        
        router.push('/login');
    }, [router]);

    return (
        <AuthContext.Provider value={{ 
            user, 
            session, 
            loading, 
            isAuthenticated: !!user && !!session,
            login, 
            logout,
            refreshUser 
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
