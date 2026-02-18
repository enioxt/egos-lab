'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { 
    Settings, Bot, Globe, Bell, Shield, Database,
    Save, RefreshCw, CheckCircle
} from 'lucide-react';
import { useRole, AccessDenied, RoleLoading } from '@/hooks/useRole';

export default function ConfiguracoesPage() {
    const permissions = useRole();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }, 1000);
    };

    // Check permissions
    if (permissions.isLoading) return <RoleLoading />;
    if (!permissions.canAccessConfig) return <AccessDenied />;

    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
                {/* Header com botão de salvar */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Settings className="w-7 h-7 text-slate-400" />
                            Configurações
                        </h2>
                        <p className="text-slate-400 mt-1">Ajuste as configurações do sistema Intelink</p>
                    </div>
                    {/* Botão Salvar no Header */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : saved ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Telegram Bot */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Bot className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Bot do Telegram</h3>
                                <p className="text-sm text-slate-400">Configurações do bot @IntelinkBot</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-slate-800">
                                <div>
                                    <p className="text-white">Status do Bot</p>
                                    <p className="text-sm text-slate-500">Conexão com a API do Telegram</p>
                                </div>
                                <span className="flex items-center gap-2 text-emerald-400">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                    Online
                                </span>
                            </div>
                            
                            <div className="flex items-center justify-between py-3 border-b border-slate-800">
                                <div>
                                    <p className="text-white">Notificações de Alerta</p>
                                    <p className="text-sm text-slate-500">Alertas automáticos para a equipe</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-white">Modo de Desenvolvimento</p>
                                    <p className="text-sm text-slate-500">Usar localhost:3001 para links</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <Shield className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Segurança</h3>
                                <p className="text-sm text-slate-400">Autenticação e controle de acesso</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-slate-800">
                                <div>
                                    <p className="text-white">2FA via Telegram</p>
                                    <p className="text-sm text-slate-500">Verificação em duas etapas obrigatória</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-3 border-b border-slate-800">
                                <div>
                                    <p className="text-white">Tempo de Sessão</p>
                                    <p className="text-sm text-slate-500">Expiração automática da sessão</p>
                                </div>
                                <select className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500">
                                    <option value="24">24 horas</option>
                                    <option value="12">12 horas</option>
                                    <option value="8">8 horas</option>
                                    <option value="4">4 horas</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-white">Bloqueio por Tentativas</p>
                                    <p className="text-sm text-slate-500">Tentativas antes de bloquear</p>
                                </div>
                                <select className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500">
                                    <option value="3">3 tentativas</option>
                                    <option value="5">5 tentativas</option>
                                    <option value="10">10 tentativas</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Database */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Database className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Banco de Dados</h3>
                                <p className="text-sm text-slate-400">Status e métricas do Supabase</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <p className="text-2xl font-bold text-white">∞</p>
                                <p className="text-xs text-slate-400">Conexões</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <p className="text-2xl font-bold text-white">--</p>
                                <p className="text-xs text-slate-400">Armazenamento</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <p className="text-2xl font-bold text-emerald-400">✓</p>
                                <p className="text-xs text-slate-400">RLS Ativo</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <p className="text-2xl font-bold text-white">BR</p>
                                <p className="text-xs text-slate-400">Região</p>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Salvando...
                                </>
                            ) : saved ? (
                                <>
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    Salvo!
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Salvar Configurações
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Sticky Footer para mobile */}
            <div className="fixed bottom-0 left-0 right-0 md:hidden bg-slate-900/95 backdrop-blur border-t border-slate-800 p-4 z-50">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Salvando...
                        </>
                    ) : saved ? (
                        <>
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                            Salvo!
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Salvar Configurações
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
