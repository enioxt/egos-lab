'use client';

/**
 * Central Capabilities Registry
 * 
 * Lists all AI/Intelligence features available in INTELINK
 * with their status, usage, and access points.
 * 
 * @route /central/capabilities
 */

import React from 'react';
import { 
    Brain, 
    Scale, 
    Network, 
    Clock, 
    Merge, 
    Search,
    FileText,
    Shield,
    AlertTriangle,
    CheckCircle2,
    Construction,
    ArrowRight,
    ExternalLink,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface Capability {
    id: string;
    name: string;
    description: string;
    icon: typeof Brain;
    color: string;
    status: 'active' | 'beta' | 'coming_soon';
    accessPoints: Array<{
        label: string;
        path: string;
        context: string;
    }>;
    features: string[];
    lastUsed?: string;
}

const CAPABILITIES: Capability[] = [
    {
        id: 'guardian',
        name: 'Guardião IA (Jurista)',
        description: 'Análise jurídica automática de documentos. Identifica tipificação penal, verifica flagrância e sugere providências legais.',
        icon: Scale,
        color: 'amber',
        status: 'active',
        accessPoints: [
            { label: 'Intelligence Lab', path: '/central/intelligence-lab', context: 'Tab Jurista IA' },
            { label: 'Upload de Documento', path: '#', context: 'Executado automaticamente' },
        ],
        features: [
            'Identificação de crimes (tipificação)',
            'Verificação de flagrância',
            'Sugestão de providências',
            'Análise de legalidade'
        ]
    },
    {
        id: 'extractor',
        name: 'Extrator de Entidades',
        description: 'Extrai automaticamente pessoas, veículos, locais, organizações e armas de documentos policiais.',
        icon: Brain,
        color: 'blue',
        status: 'active',
        accessPoints: [
            { label: 'Upload de Documento', path: '#', context: 'Qualquer documento' },
            { label: 'Nova Investigação', path: '/investigation/new', context: 'Setup Wizard' },
        ],
        features: [
            'Extração de PESSOAS (nome, CPF, vulgo)',
            'Extração de VEÍCULOS (placa, modelo)',
            'Extração de LOCAIS (endereços)',
            'Extração de ARMAS',
            'Relacionamentos entre entidades'
        ]
    },
    {
        id: 'cross-case',
        name: 'Cross-Case Alerts',
        description: 'Detecta automaticamente quando entidades aparecem em múltiplas investigações, sugerindo conexões entre casos.',
        icon: Network,
        color: 'red',
        status: 'active',
        accessPoints: [
            { label: 'Dashboard', path: '/', context: 'Painel de alertas' },
            { label: 'Central de Vínculos', path: '/central/vinculos', context: 'Lista completa' },
        ],
        features: [
            'Detecção automática de matches',
            'Score de similaridade',
            'Workflow de revisão',
            'Integração com dossiês'
        ]
    },
    {
        id: 'entity-resolver',
        name: 'Entity Resolver',
        description: 'Detecta e permite fundir entidades duplicadas dentro de uma investigação (ex: "JOÃO SILVA" vs "Joao Silva").',
        icon: Merge,
        color: 'purple',
        status: 'active',
        accessPoints: [
            { label: 'Intelligence Lab', path: '/central/intelligence-lab', context: 'Tab Entity Resolver' },
        ],
        features: [
            'Detecção de duplicatas por similaridade',
            'Preview de merge',
            'Votação para merge (multi-user)',
            'Rollback de merges'
        ]
    },
    {
        id: 'quantum-search',
        name: 'Busca Global (Quantum)',
        description: 'Busca entidades em todas as investigações e gera dossiês narrativos completos.',
        icon: Search,
        color: 'cyan',
        status: 'active',
        accessPoints: [
            { label: 'Intelligence Lab', path: '/central/intelligence-lab', context: 'Tab Busca Global' },
            { label: 'Header Global', path: '#', context: 'Barra de busca' },
        ],
        features: [
            'Busca por nome, CPF, placa',
            'Dossiê narrativo automático',
            'Timeline de aparições',
            'Grafo de relacionamentos'
        ]
    },
    {
        id: 'ai-analysis',
        name: 'Análise IA de Investigação',
        description: 'Gera análise completa de uma investigação: artigos criminais, linhas investigativas, análise de risco e diligências sugeridas.',
        icon: Sparkles,
        color: 'emerald',
        status: 'active',
        accessPoints: [
            { label: 'Setup Wizard', path: '#', context: 'Etapa de Análise' },
            { label: 'Página da Investigação', path: '#', context: 'Painel de Findings' },
        ],
        features: [
            'Artigos criminais aplicáveis',
            'Linhas de investigação',
            'Análise de risco',
            'Diligências sugeridas',
            'Sumário executivo'
        ]
    },
    {
        id: 'timeline',
        name: 'Cronos (Timeline)',
        description: 'Gera linha do tempo unificada de eventos a partir de múltiplos documentos.',
        icon: Clock,
        color: 'indigo',
        status: 'coming_soon',
        accessPoints: [
            { label: 'Intelligence Lab', path: '/central/intelligence-lab', context: 'Em desenvolvimento' },
        ],
        features: [
            'Extração de datas/horários',
            'Ordenação cronológica',
            'Visualização de timeline',
            'Detecção de gaps'
        ]
    },
    {
        id: 'nexus',
        name: 'Nexus (Grafo Global)',
        description: 'Visualização de grafo de todas as conexões entre entidades de diferentes investigações.',
        icon: Network,
        color: 'slate',
        status: 'coming_soon',
        accessPoints: [
            { label: 'Intelligence Lab', path: '/central/intelligence-lab', context: 'Em desenvolvimento' },
        ],
        features: [
            'Grafo interativo',
            'Filtros por tipo',
            'Clusters automáticos',
            'Exportação'
        ]
    },
];

const STATUS_BADGES = {
    active: { label: 'Ativo', color: 'emerald', icon: CheckCircle2 },
    beta: { label: 'Beta', color: 'amber', icon: AlertTriangle },
    coming_soon: { label: 'Em breve', color: 'slate', icon: Construction },
};

export default function CapabilitiesPage() {
    const activeCount = CAPABILITIES.filter(c => c.status === 'active').length;
    const betaCount = CAPABILITIES.filter(c => c.status === 'beta').length;
    const comingCount = CAPABILITIES.filter(c => c.status === 'coming_soon').length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
                                    <Brain className="w-6 h-6 text-blue-400" />
                                </div>
                                Capabilities Registry
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">
                                Todas as funcionalidades de IA do INTELINK
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm text-emerald-400 font-medium">{activeCount} ativos</span>
                            </div>
                            {betaCount > 0 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm text-amber-400 font-medium">{betaCount} beta</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-500/10 border border-slate-500/30 rounded-lg">
                                <Construction className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-400 font-medium">{comingCount} em breve</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {CAPABILITIES.map((cap) => {
                        const Icon = cap.icon;
                        const statusInfo = STATUS_BADGES[cap.status];
                        const StatusIcon = statusInfo.icon;
                        
                        return (
                            <div 
                                key={cap.id}
                                className={`bg-slate-800/50 border border-${cap.color}-500/20 rounded-2xl p-6 hover:border-${cap.color}-500/40 transition-all group`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 bg-${cap.color}-500/20 rounded-xl`}>
                                            <Icon className={`w-6 h-6 text-${cap.color}-400`} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white">{cap.name}</h2>
                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 bg-${statusInfo.color}-500/20 border border-${statusInfo.color}-500/30 rounded-full mt-1`}>
                                                <StatusIcon className={`w-3 h-3 text-${statusInfo.color}-400`} />
                                                <span className={`text-xs font-medium text-${statusInfo.color}-400`}>{statusInfo.label}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                                    {cap.description}
                                </p>

                                {/* Features */}
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Funcionalidades</h3>
                                    <ul className="space-y-1">
                                        {cap.features.slice(0, 4).map((feat, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                                                <span className={`w-1.5 h-1.5 bg-${cap.color}-400 rounded-full`}></span>
                                                {feat}
                                            </li>
                                        ))}
                                        {cap.features.length > 4 && (
                                            <li className="text-xs text-slate-500">+{cap.features.length - 4} mais...</li>
                                        )}
                                    </ul>
                                </div>

                                {/* Access Points */}
                                {cap.status !== 'coming_soon' && (
                                    <div className="pt-4 border-t border-slate-700/50">
                                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Como acessar</h3>
                                        <div className="space-y-2">
                                            {cap.accessPoints.map((ap, idx) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <ArrowRight className="w-3 h-3 text-slate-500" />
                                                        <span className="text-sm text-slate-300">{ap.label}</span>
                                                        <span className="text-xs text-slate-500">({ap.context})</span>
                                                    </div>
                                                    {ap.path !== '#' && (
                                                        <Link 
                                                            href={ap.path}
                                                            className={`p-1.5 hover:bg-${cap.color}-500/20 rounded-lg transition-colors`}
                                                        >
                                                            <ExternalLink className={`w-3.5 h-3.5 text-${cap.color}-400`} />
                                                        </Link>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
