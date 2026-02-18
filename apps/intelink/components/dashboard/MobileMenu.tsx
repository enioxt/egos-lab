'use client';

import React from 'react';
import Link from 'next/link';
import { Brain, FileText, Users, Building2, Shield, X } from 'lucide-react';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    canAccessAdmin: boolean;
}

export default function MobileMenu({ isOpen, onClose, canAccessAdmin }: MobileMenuProps) {
    if (!isOpen) return null;
    
    return (
        <div className="xl:hidden fixed inset-0 z-40">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Menu Panel */}
            <div className="absolute right-0 top-0 h-full w-72 bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <h2 className="font-semibold text-white">Menu</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                
                <nav className="p-4 space-y-2">
                    <Link
                        href="/chat"
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-white">Chat IA</p>
                            <p className="text-xs text-slate-400">Assistente inteligente</p>
                        </div>
                    </Link>
                    
                    <Link
                        href="/reports"
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-white">Relatórios</p>
                            <p className="text-xs text-slate-400">Todos os tipos</p>
                        </div>
                    </Link>
                    
                    {/* ADMIN ONLY */}
                    {canAccessAdmin && (
                        <>
                            <div className="border-t border-slate-700 my-3"></div>
                            
                            <p className="text-xs text-slate-500 uppercase tracking-wide px-3 mb-2">Gestão</p>
                            
                            <Link
                                href="/central/equipe"
                                onClick={onClose}
                                className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <Users className="w-5 h-5 text-slate-400" />
                                <span className="text-slate-300">Equipe</span>
                            </Link>
                            
                            <Link
                                href="/central/delegacias"
                                onClick={onClose}
                                className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <Building2 className="w-5 h-5 text-slate-400" />
                                <span className="text-slate-300">Delegacias</span>
                            </Link>
                            
                            <Link
                                href="/central/auditoria"
                                onClick={onClose}
                                className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <Shield className="w-5 h-5 text-red-400" />
                                <span className="text-red-300">Auditoria</span>
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </div>
    );
}
