'use client';

export const dynamic = 'force-dynamic';

/**
 * New Investigation Page - Sprint 18 Refactor
 * 
 * Layout compacto e otimizado para mobile
 * Fluxo claro: Informações → Equipe → Criar
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
    ArrowLeft, Save, FileSearch, FileText, Users, Sparkles,
    ChevronRight, CheckCircle2, Lock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    PoliceUnit, TeamMember, TabType,
    TeamTab 
} from '@/components/investigation/new';
import { useRBAC } from '@/lib/rbac/useRBAC';
import { useToast } from '@/components/intelink/Toast';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Steps do fluxo
const STEPS = [
    { id: 'info' as TabType, label: 'Informações', icon: FileText, num: 1 },
    { id: 'equipe' as TabType, label: 'Equipe', icon: Users, num: 2 }
];

export default function NewInvestigationPage() {
    const router = useRouter();
    const rbac = useRBAC();
    const { showToast } = useToast(); // MUST be before early returns
    
    // ALL HOOKS MUST BE DECLARED BEFORE ANY EARLY RETURNS
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedUnit, setSelectedUnit] = useState<string>('');
    const [status, setStatus] = useState<'active' | 'archived'>('active');
    
    // Data
    const [units, setUnits] = useState<PoliceUnit[]>([]);
    const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    
    // UI state - MOVED UP before early returns
    const [activeTab, setActiveTab] = useState<TabType>('info');
    
    // Permission check - only member+ can create investigations
    const canCreate = rbac.can('investigation:create');
    
    // Load data on mount (also before early returns)
    useEffect(() => {
        if (canCreate) {
            loadData();
        }
    }, [canCreate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [{ data: unitsData }, { data: membersData }] = await Promise.all([
                supabase.from('intelink_police_units').select('*').order('name'),
                supabase.from('intelink_unit_members').select('*').order('name')
            ]);
            setUnits(unitsData || []);
            setAllMembers(membersData || []);
        } catch (error) {
            console.error('Error loading data:', error);
        }
        setLoading(false);
    };
    
    // Show loading while checking permissions
    if (rbac.isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    
    // Access denied
    if (!canCreate) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Acesso Restrito</h1>
                    <p className="text-slate-400 mb-6">
                        Você não tem permissão para criar operações. 
                        Seu perfil atual é <strong className="text-white">{rbac.roleLabel}</strong>.
                    </p>
                    <Link 
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar ao Início
                    </Link>
                </div>
            </div>
        );
    }

    // Save handler - creates investigation via API (RBAC protected)
    const handleSave = async () => {
        if (!title.trim()) {
            showToast('warning', 'Campo Obrigatório', 'Por favor, preencha o título da operação');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/investigations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || null,
                    unit_id: selectedUnit || null,
                    status,
                    team_members: selectedMembers
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao criar operação');
            }

            const { investigation } = await res.json();

            // Redirect to investigation page in setup mode (Etapa 2)
            router.push(`/investigation/${investigation.id}?mode=setup`);
        } catch (error: any) {
            console.error('Error saving investigation:', error);
            showToast('error', 'Erro ao Salvar', error.message || 'Erro ao salvar operação. Tente novamente.');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="h-screen max-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col overflow-hidden">
            {/* Header Compacto */}
            <header className="shrink-0 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50">
                <div className="px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold flex items-center gap-2">
                                <FileSearch className="w-5 h-5 text-blue-400" />
                                Nova Operação
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - Fixed Height */}
            <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                <div className="max-w-2xl mx-auto space-y-4">
                    
                    {/* Info Card - Próximos Passos (Compacto no topo) */}
                    <div className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-xl">
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <p className="text-slate-300 mb-2">Após criar, você poderá:</p>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">📄 REDS/BO</span>
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded">📋 Laudos</span>
                                    <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded">🤖 Análise IA</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Steps Indicator */}
                    <div className="flex items-center gap-2">
                        {STEPS.map((step, idx) => (
                            <React.Fragment key={step.id}>
                                <button
                                    onClick={() => setActiveTab(step.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                        activeTab === step.id 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                                >
                                    <step.icon className="w-4 h-4" />
                                    {step.label}
                                </button>
                                {idx < STEPS.length - 1 && (
                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Form Card */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        {activeTab === 'info' && (
                            <div className="space-y-4">
                                <h2 className="text-base font-semibold text-slate-200">Dados Básicos</h2>
                                
                                {/* Título */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                        Título da Operação *
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ex: Operação Tsunami - Tráfico Zona Norte"
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>

                                {/* Descrição - Menor */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                        Descrição <span className="text-slate-500">(opcional)</span>
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Breve contexto da operação..."
                                        rows={2}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                                    />
                                </div>

                                {/* Delegacia e Status em grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                            Delegacia
                                        </label>
                                        <select
                                            value={selectedUnit}
                                            onChange={(e) => setSelectedUnit(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                        >
                                            <option value="">Selecione</option>
                                            {units.map(unit => (
                                                <option key={unit.id} value={unit.id}>
                                                    {unit.code} - {unit.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                            Status
                                        </label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as 'active' | 'archived')}
                                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                        >
                                            <option value="active">Ativo</option>
                                            <option value="archived">Arquivado</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'equipe' && (
                            <TeamTab
                                allMembers={allMembers}
                                selectedMembers={selectedMembers}
                                setSelectedMembers={setSelectedMembers}
                                selectedUnit={selectedUnit}
                            />
                        )}
                    </div>
                </div>
            </main>

            {/* Footer com Botão - Fixo embaixo */}
            <footer className="shrink-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 px-4 sm:px-6 py-3">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
                    <div className="text-sm text-slate-400">
                        {activeTab === 'info' ? (
                            <span>Preencha os dados básicos</span>
                        ) : (
                            <span>Selecione membros da equipe <span className="text-slate-500">(opcional)</span></span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {activeTab === 'equipe' && (
                            <button
                                onClick={() => setActiveTab('info')}
                                className="px-3 py-2 text-slate-400 hover:text-white text-sm transition-colors"
                            >
                                Voltar
                            </button>
                        )}
                        
                        {activeTab === 'info' ? (
                            <button
                                onClick={() => setActiveTab('equipe')}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Próximo
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={saving || !title.trim()}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium text-sm transition-colors"
                            >
                                {saving ? (
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                {saving ? 'Criando...' : 'Criar Operação'}
                            </button>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
}
