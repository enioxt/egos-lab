'use client';

import React from 'react';
import Link from 'next/link';
import {
    Shield, Activity, Users, FileText, Brain,
    Building2, User, Settings, LogOut, ChevronDown, Key, Eye, X
} from 'lucide-react';
import GlobalSearch from '@/components/shared/GlobalSearch';

interface MemberInfo {
    name: string;
    displayName?: string;
    role: string;
    phone?: string;
    systemRole?: string;
}

interface DashboardHeaderProps {
    memberInfo: MemberInfo | null;
    canAccessAdmin: boolean;
    userMenuOpen: boolean;
    setUserMenuOpen: (open: boolean) => void;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    presentationMenuOpen: boolean;
    setPresentationMenuOpen: (open: boolean) => void;
    viewAsRole: 'visitor' | 'member' | 'admin' | null;
    setViewAsRole: (role: 'visitor' | 'member' | 'admin' | null) => void;
    isViewingAs: boolean;
    onLogout: () => void;
}

export default function DashboardHeader({
    memberInfo,
    canAccessAdmin,
    userMenuOpen,
    setUserMenuOpen,
    mobileMenuOpen,
    setMobileMenuOpen,
    presentationMenuOpen,
    setPresentationMenuOpen,
    viewAsRole,
    setViewAsRole,
    isViewingAs,
    onLogout,
}: DashboardHeaderProps) {
    return (
        <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border-b border-slate-600/50 sticky top-0 z-50">
            <div className="w-full px-6 py-3">
                <div className="flex items-center justify-between gap-6">
                    {/* 1. BRANDING */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg shadow-blue-900/30">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold text-white tracking-tight leading-none">INTELINK</h1>
                            <p className="text-blue-300 text-xs font-medium leading-none mt-1">Inteligência Policial</p>
                        </div>
                    </div>

                    {/* 2. SEARCH - Center Stage */}
                    <div className="flex-1 max-w-3xl hidden md:block">
                        <GlobalSearch />
                    </div>

                    {/* 3. ACTIONS - Right Side */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Mobile Search */}
                        <div className="md:hidden">
                            <GlobalSearch />
                        </div>
                        
                        {/* Quick Actions - Desktop only */}
                        <div className="hidden xl:flex items-center gap-2">
                            <Link
                                href="/chat"
                                className="flex items-center gap-2 px-3 h-10 text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded-lg transition-all"
                                title="Chat com IA"
                            >
                                <Brain className="w-4 h-4" />
                                <span className="text-sm font-medium">Chat IA</span>
                            </Link>

                            <Link
                                href="/reports"
                                className="flex items-center gap-2 px-3 h-10 text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded-lg transition-all"
                                title="Relatórios"
                            >
                                <FileText className="w-4 h-4" />
                                <span className="text-sm font-medium">Relatórios</span>
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="xl:hidden w-10 h-10 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
                            title="Menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-5 h-5 text-white" />
                            ) : (
                                <Activity className="w-5 h-5 text-white" />
                            )}
                        </button>

                        {/* Separator */}
                        <div className="hidden xl:block w-px h-8 bg-slate-700/50 mx-1"></div>

                        {/* Gestão Dropdown - ADMIN ONLY */}
                        {canAccessAdmin && (
                            <div className="relative group">
                                <button 
                                    className="flex items-center gap-2 px-3 h-10 text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded-lg transition-all"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span className="hidden xl:inline text-sm font-medium">Gestão</span>
                                    <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                                </button>
                                
                                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100 duration-200">
                                    <div className="p-1.5 space-y-0.5">
                                        <Link 
                                            href="/central/equipe"
                                            className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            <Users className="w-4 h-4" />
                                            Equipe
                                        </Link>
                                        <Link 
                                            href="/central/delegacias"
                                            className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            <Building2 className="w-4 h-4" />
                                            Delegacias
                                        </Link>
                                        <Link 
                                            href="/central/configuracoes"
                                            className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Configurações
                                        </Link>
                                        <div className="border-t border-slate-700 my-1"></div>
                                        <Link 
                                            href="/central/evidencias"
                                            className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Evidências
                                        </Link>
                                        <Link 
                                            href="/central/auditoria"
                                            className="flex items-center gap-2 px-3 py-2 text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Shield className="w-4 h-4" />
                                            Auditoria
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* User Menu */}
                        <div className="relative">
                            <button 
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 px-3 h-10 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {(memberInfo?.displayName || memberInfo?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium text-white">{memberInfo?.displayName || memberInfo?.name || 'Usuário'}</p>
                                    <p className="text-xs text-slate-400">{memberInfo?.role || 'Membro'}</p>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                    <div className="p-4 border-b border-slate-700 bg-slate-800/80">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                                {(memberInfo?.displayName || memberInfo?.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">{memberInfo?.displayName || memberInfo?.name || 'Usuário'}</p>
                                                <p className="text-sm text-blue-400">{memberInfo?.role || 'Membro'}</p>
                                                {memberInfo?.phone && <p className="text-xs text-slate-400">{memberInfo.phone}</p>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-2">
                                        <Link 
                                            href="/profile" 
                                            className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <User className="w-4 h-4" />
                                            <span>Meu Perfil</span>
                                        </Link>
                                        <Link 
                                            href="/activity" 
                                            className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <Activity className="w-4 h-4" />
                                            <span>Minhas Atividades</span>
                                        </Link>
                                        
                                        {/* Presentation Mode - ADMIN ONLY */}
                                        {canAccessAdmin && (
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setPresentationMenuOpen(!presentationMenuOpen)}
                                                    className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span>Modo Apresentação</span>
                                                    {isViewingAs && (
                                                        <span className="ml-auto text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                                            {viewAsRole === 'admin' ? 'Admin' : viewAsRole === 'member' ? 'Membro' : 'Visitante'}
                                                        </span>
                                                    )}
                                                    <ChevronDown className={`w-3 h-3 text-slate-400 ${presentationMenuOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                                {presentationMenuOpen && (
                                                    <div className="mt-1 ml-7 space-y-1 border-l border-slate-700 pl-3">
                                                        <p className="text-xs text-slate-500 mb-2">Ver como (somente leitura):</p>
                                                        <button 
                                                            onClick={() => { setViewAsRole(null); setPresentationMenuOpen(false); }}
                                                            className={`w-full text-left px-2 py-1 text-sm rounded ${!viewAsRole ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                                                        >
                                                            🔓 Normal (seu perfil)
                                                        </button>
                                                        <button 
                                                            onClick={() => { setViewAsRole('visitor'); setPresentationMenuOpen(false); }}
                                                            className={`w-full text-left px-2 py-1 text-sm rounded ${viewAsRole === 'visitor' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                                                        >
                                                            👤 Visitante
                                                        </button>
                                                        <button 
                                                            onClick={() => { setViewAsRole('member'); setPresentationMenuOpen(false); }}
                                                            className={`w-full text-left px-2 py-1 text-sm rounded ${viewAsRole === 'member' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                                                        >
                                                            👮 Membro
                                                        </button>
                                                        <button 
                                                            onClick={() => { setViewAsRole('admin'); setPresentationMenuOpen(false); }}
                                                            className={`w-full text-left px-2 py-1 text-sm rounded ${viewAsRole === 'admin' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                                                        >
                                                            ⚡ Super Admin
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        <button 
                                            className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-700 rounded-lg transition-colors cursor-not-allowed"
                                            disabled
                                        >
                                            <Key className="w-4 h-4" />
                                            <span>Alterar Senha</span>
                                            <span className="text-xs text-slate-600 ml-auto">Em breve</span>
                                        </button>
                                        <button 
                                            className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-700 rounded-lg transition-colors cursor-not-allowed"
                                            disabled
                                        >
                                            <Settings className="w-4 h-4" />
                                            <span>Configurações</span>
                                            <span className="text-xs text-slate-600 ml-auto">Em breve</span>
                                        </button>
                                    </div>
                                    
                                    <div className="border-t border-slate-700 p-2">
                                        <button 
                                            onClick={() => { onLogout(); setUserMenuOpen(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Sair</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
