'use client';

import React, { useEffect, useState } from 'react';
import { Network, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { SkeletonInvestigationList, SkeletonQuickActions, SkeletonHero } from '@/components/ui/Skeleton';
import { SkeletonPage } from '@/components/shared/Skeleton';
import DemoWalkthrough, { useDemoWalkthrough } from '@/components/demo/DemoWalkthrough';
import { DashboardHeader, InvestigationsList, MobileMenu } from '@/components/dashboard';
import type { Investigation } from '@/lib/utils/formatters';

interface Stats {
    investigations: number;
    entities: number;
    relationships: number;
    evidence: number;
}

interface MemberInfo {
    name: string;
    displayName?: string;
    role: string;
    phone?: string;
    systemRole?: string;
}

export default function IntelinkHome() {
    const [chatId, setChatId] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true); 
    const [investigations, setInvestigations] = useState<Investigation[]>([]);
    const [stats, setStats] = useState<Stats>({ investigations: 0, entities: 0, relationships: 0, evidence: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [visibleCount, setVisibleCount] = useState(5);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
    
    const canAccessAdmin = memberInfo?.systemRole && ['super_admin', 'unit_admin'].includes(memberInfo.systemRole);
    const [showDeleted, setShowDeleted] = useState(false);
    const [investigationSearch, setInvestigationSearch] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'activity' | 'name'>('recent');
    
    const [viewAsRole, setViewAsRole] = useState<'visitor' | 'member' | 'admin' | null>(null);
    const [presentationMenuOpen, setPresentationMenuOpen] = useState(false);
    const isViewingAs = viewAsRole !== null;
    
    const { isOpen: isDemoOpen, openDemo, closeDemo, DemoComponent } = useDemoWalkthrough();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const verifyRes = await fetch('/api/v2/auth/verify', {
                    method: 'GET',
                    credentials: 'include',
                });
                
                if (verifyRes.ok) {
                    const verifyData = await verifyRes.json();
                    if (verifyData.valid && verifyData.member) {
                        setIsAuthenticated(true);
                        setMemberInfo({
                            name: verifyData.member.name,
                            displayName: verifyData.member.name,
                            role: verifyData.member.role || 'member',
                            phone: verifyData.member.phone,
                            systemRole: verifyData.member.systemRole,
                        });
                        setChatId(verifyData.member.phone || verifyData.member.id);
                        setIsCheckingAuth(false);
                        return;
                    }
                }
            } catch (e) {
                console.log('[Auth] v2 check failed, trying legacy');
            }

            const savedAuth = localStorage.getItem('intelink_chat_id');
            
            if (savedAuth && savedAuth.startsWith('-')) {
                console.log('[Auth] Cleaning up invalid chat_id:', savedAuth);
                localStorage.removeItem('intelink_chat_id');
                localStorage.removeItem('intelink_phone');
                localStorage.removeItem('intelink_token');
                localStorage.removeItem('intelink_username');
                localStorage.removeItem('intelink_member_id');
                localStorage.removeItem('intelink_role');
                localStorage.removeItem('intelink_user');
                setIsCheckingAuth(false);
                return;
            }
            
            if (savedAuth) {
                setChatId(savedAuth);
                await authenticateAndLoad(savedAuth);
            }
            setIsCheckingAuth(false);
        };
        checkAuth();
    }, []);

    const authenticateAndLoad = async (id: string) => {
        setLoading(true);
        setError('');
        
        try {
            if (id.startsWith('-')) {
                console.log('[Auth] Rejecting fake chat_id:', id);
                setError('Sessão inválida. Por favor, faça login novamente.');
                setLoading(false);
                localStorage.removeItem('intelink_chat_id');
                return;
            }
            
            const cleanId = id.replace(/\D/g, '');
            const isLikelyPhone = cleanId.length >= 10 && cleanId.length <= 11;
            const requestBody = isLikelyPhone ? { phone: cleanId } : { chat_id: id };
            
            const sessionRes = await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!sessionRes.ok) {
                const errorData = await sessionRes.json().catch(() => ({}));
                setError(errorData.error || 'Credencial não encontrada.');
                setLoading(false);
                return;
            }

            const sessionData = await sessionRes.json();
            setIsAuthenticated(true);
            localStorage.setItem('intelink_chat_id', id);

            if (sessionData.member) {
                if (sessionData.member.id) {
                    localStorage.setItem('intelink_member_id', sessionData.member.id);
                }
                setMemberInfo({ 
                    name: sessionData.member.name, 
                    displayName: sessionData.member.displayName || sessionData.member.telegram_username || sessionData.member.name,
                    role: sessionData.member.role, 
                    phone: sessionData.member.phone,
                    systemRole: sessionData.member.system_role || 'member'
                });
            }

            const invRes = await fetch('/api/investigations?limit=20');
            if (invRes.ok) {
                const invData = await invRes.json();
                const cases = invData.investigations || [];
                const sortedCases = cases.sort((a: Investigation, b: Investigation) => {
                    if (a.status === 'active' && b.status !== 'active') return -1;
                    if (a.status !== 'active' && b.status === 'active') return 1;
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                });
                setInvestigations(sortedCases);
            }

            const statsRes = await fetch('/api/stats');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats({
                    investigations: statsData.investigations || 0,
                    entities: statsData.entities || 0,
                    relationships: statsData.relationships || 0,
                    evidence: statsData.evidence || 0
                });
            }

        } catch (e) {
            console.error('Auth error:', e);
            setError('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        
        const loadInvestigations = async () => {
            setLoading(true);
            try {
                const invRes = await fetch(`/api/investigations?limit=20&deleted=${showDeleted}`);
                if (invRes.ok) {
                    const invData = await invRes.json();
                    const cases = invData.investigations || [];
                    const sortedCases = cases.sort((a: Investigation, b: Investigation) => {
                        if (a.status === 'active' && b.status !== 'active') return -1;
                        if (a.status !== 'active' && b.status === 'active') return 1;
                        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                    });
                    setInvestigations(sortedCases);
                }
            } catch (e) {
                console.error('Error loading investigations:', e);
            } finally {
                setLoading(false);
            }
        };
        
        loadInvestigations();
    }, [showDeleted, isAuthenticated]);

    const handleToggleStatus = async (e: React.MouseEvent, inv: Investigation) => {
        e.preventDefault(); 
        e.stopPropagation();

        const newStatus = inv.status === 'active' ? 'archived' : 'active';
        
        const updatedList = investigations.map(i => 
            i.id === inv.id ? { ...i, status: newStatus } : i
        ).sort((a, b) => {
            const statA = a.id === inv.id ? newStatus : a.status;
            const statB = b.id === inv.id ? newStatus : b.status;
            if (statA === 'active' && statB !== 'active') return -1;
            if (statA !== 'active' && statB === 'active') return 1;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
        
        setInvestigations(updatedList);

        await fetch('/api/investigations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: inv.id, status: newStatus })
        });
    };

    const handleRestore = async (e: React.MouseEvent, inv: Investigation) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const res = await fetch(`/api/investigation/${inv.id}/restore`, { method: 'POST' });
            if (res.ok) {
                setInvestigations(prev => prev.filter(i => i.id !== inv.id));
            }
        } catch (e) {
            console.error('Error restoring investigation:', e);
        }
    };

    const handleLogout = async () => {
        localStorage.removeItem('intelink_chat_id');
        localStorage.removeItem('intelink_username');
        localStorage.removeItem('intelink_token');
        localStorage.removeItem('intelink_member_id');
        localStorage.removeItem('intelink_role');
        localStorage.removeItem('intelink_keep_logged');
        
        try {
            await fetch('/api/v2/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (e) {
            console.error('Logout error:', e);
        }
        
        document.cookie = 'intelink_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'intelink_access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'intelink_refresh=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'intelink_member_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        
        window.location.href = '/login';
    };

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-700/50 rounded-lg animate-pulse" />
                            <div className="space-y-2">
                                <div className="w-24 h-5 bg-slate-700/50 rounded animate-pulse" />
                                <div className="w-32 h-3 bg-slate-700/50 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                    <SkeletonHero />
                    <SkeletonQuickActions />
                    <SkeletonInvestigationList count={3} />
                </div>
            </div>
        );
    }

    // PUBLIC MODE: show dashboard for everyone (data is clean)
    const isVisitor = !isAuthenticated;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white overflow-hidden">
            <DemoComponent />
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {isVisitor && (
                    <div className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20 flex items-center justify-between">
                        <span className="text-sm text-slate-300">
                            Modo visitante — <span className="text-cyan-400 font-medium">explore o sistema livremente</span>
                        </span>
                        <Link href="/login" className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-xs font-semibold text-cyan-300 transition-colors">
                            Fazer Login
                        </Link>
                    </div>
                )}
                <DashboardHeader
                    memberInfo={memberInfo}
                    canAccessAdmin={canAccessAdmin || false}
                    userMenuOpen={userMenuOpen}
                    setUserMenuOpen={setUserMenuOpen}
                    mobileMenuOpen={mobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                    presentationMenuOpen={presentationMenuOpen}
                    setPresentationMenuOpen={setPresentationMenuOpen}
                    viewAsRole={viewAsRole}
                    setViewAsRole={setViewAsRole}
                    isViewingAs={isViewingAs}
                    onLogout={handleLogout}
                />

                <MobileMenu
                    isOpen={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                    canAccessAdmin={canAccessAdmin || false}
                />

                <main className="w-full px-6 py-6 space-y-6">
                    {/* Central Strip */}
                    <Link 
                        href="/central"
                        className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-800/80 to-slate-800/40 hover:from-slate-700/80 hover:to-slate-700/40 border border-slate-700/50 hover:border-cyan-500/30 rounded-xl group transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors">
                                <Network className="w-5 h-5 text-cyan-400" />
                            </div>
                            <span className="font-semibold text-white group-hover:text-cyan-100 transition-colors">Central</span>
                        </div>
                        
                        <div className="hidden sm:flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-cyan-400">{stats.investigations}</span>
                                <span className="text-xs text-slate-400">Operações</span>
                            </div>
                            <div className="h-4 w-px bg-slate-600"/>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-blue-400">{stats.entities}</span>
                                <span className="text-xs text-slate-400">Entidades</span>
                            </div>
                            <div className="h-4 w-px bg-slate-600"/>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-purple-400">{stats.relationships}</span>
                                <span className="text-xs text-slate-400">Vínculos</span>
                            </div>
                        </div>
                        
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </Link>

                    <InvestigationsList
                        investigations={investigations}
                        loading={loading}
                        showDeleted={showDeleted}
                        setShowDeleted={setShowDeleted}
                        investigationSearch={investigationSearch}
                        setInvestigationSearch={setInvestigationSearch}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        visibleCount={visibleCount}
                        setVisibleCount={setVisibleCount}
                        onToggleStatus={handleToggleStatus}
                        onRestore={handleRestore}
                    />
                    
                    <div className="h-24"></div>
                </main>
            </div>
        </div>
    );
}
