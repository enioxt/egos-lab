'use client';

export const dynamic = 'force-dynamic';

/**
 * Análise de Vínculos - AUTOMÁTICA
 * 
 * Esta página detecta automaticamente conexões importantes entre operações.
 * O usuário NÃO precisa selecionar manualmente origem/destino.
 * 
 * O sistema mostra:
 * 1. Entidades "Hub" - conectam múltiplas operações
 * 2. Conexões entre operações diferentes
 * 3. Caminhos descobertos automaticamente
 */

import React, { useEffect, useState } from 'react';
import { 
    GitBranch, User, Building2, Car, MapPin,
    Network, TrendingUp, Loader2, Info, Sparkles, 
    AlertTriangle, Link2, Eye, ChevronRight, X, Mail, Phone
} from 'lucide-react';
import Link from 'next/link';
import EntityDetailModal from '@/components/shared/EntityDetailModal';

interface TopNode {
    node: { id: string; name: string; type: string; metadata?: any };
    degree: number;
    connections: number;
}

interface GraphStats {
    nodeCount: number;
    edgeCount: number;
    density: number;
    avgDegree: number;
    componentCount: number;
    largestComponent: number;
}

interface CrossInvestigationLink {
    entity1: { id: string; name: string; type: string; investigation: string };
    entity2: { id: string; name: string; type: string; investigation: string };
    similarity: number;
    matchType: string;
}

interface CrossCaseEntity {
    id: string;
    name: string;
    type: string;
    typeLabel: string;
    investigationCount: number;
    appearances: Array<{
        investigationId: string;
        investigationTitle: string;
        role: string;
        relationType: string;
        relationIcon: string;
        details: string;
    }>;
    insight: string;
}

const TYPE_ICONS: Record<string, typeof User> = {
    PERSON: User,
    ORGANIZATION: Building2,
    COMPANY: Building2,
    VEHICLE: Car,
    LOCATION: MapPin,
};

const TYPE_COLORS: Record<string, string> = {
    PERSON: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ORGANIZATION: 'bg-red-500/20 text-red-400 border-red-500/30',
    COMPANY: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    VEHICLE: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    LOCATION: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const TYPE_LABELS: Record<string, string> = {
    PERSON: 'Pessoa',
    ORGANIZATION: 'Org. Criminosa',
    COMPANY: 'Empresa',
    VEHICLE: 'Veículo',
    LOCATION: 'Local',
    WEAPON: 'Arma',
    FIREARM: 'Arma de Fogo',
};

export default function AnaliseVinculosPage() {
    const [stats, setStats] = useState<GraphStats | null>(null);
    const [topNodes, setTopNodes] = useState<TopNode[]>([]);
    const [crossLinks, setCrossLinks] = useState<CrossInvestigationLink[]>([]);
    const [crossCaseEntities, setCrossCaseEntities] = useState<CrossCaseEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedEntity, setExpandedEntity] = useState<string | null>(null);
    const [showAllEntities, setShowAllEntities] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    
    // Entity modal
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    
    // Access request modal
    const [accessRequestModal, setAccessRequestModal] = useState<{
        isOpen: boolean;
        investigationTitle: string;
        details: string;
    } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // 1. Load graph stats and top nodes
            const statsRes = await fetch('/api/intelink/graph-analysis');
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
                setTopNodes(data.topNodes || []);
            }

            // 2. Load Cross-Case Analysis (entities in multiple investigations)
            const crossCaseRes = await fetch('/api/intelink/cross-case-analysis?min_appearances=2&limit=15');
            if (crossCaseRes.ok) {
                const data = await crossCaseRes.json();
                setCrossCaseEntities(data.crossCaseEntities || []);
            }

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            
            <div className="w-full px-4 md:px-6 py-6">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <GitBranch className="w-7 h-7 text-purple-400" />
                        Análise de Vínculos
                    </h2>
                    <p className="text-slate-400 mt-1 text-sm">
                        Conexões detectadas automaticamente entre operações
                    </p>
                </div>

                {/* Collapsible Help Box */}
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6 flex items-center gap-3 hover:bg-slate-800 transition-colors"
                >
                    <Info className="w-5 h-5 text-purple-400" />
                    <span className="text-slate-300 text-sm">Como funciona a Análise de Vínculos?</span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${showHelp ? 'rotate-90' : ''}`} />
                </button>
                
                {showHelp && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-5 mb-6">
                        <p className="text-slate-300 text-sm mb-3">
                            O sistema analisa automaticamente todas as entidades e detecta conexões entre operações:
                        </p>
                        <div className="grid md:grid-cols-3 gap-3 text-sm">
                            <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-purple-300 font-medium mb-1">📊 Conexões Totais</p>
                                <p className="text-slate-400 text-xs">
                                    Quantas vezes essa entidade está ligada a outras
                                </p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-purple-300 font-medium mb-1">🔄 Cross-Case Analysis</p>
                                <p className="text-slate-400 text-xs">
                                    Mesma entidade aparecendo em operações diferentes
                                </p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-purple-300 font-medium mb-1">🎯 Insights Automáticos</p>
                                <p className="text-slate-400 text-xs">
                                    Alertas sobre padrões suspeitos (suspeito em múltiplos casos, etc)
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Cross-Case Analysis - Unified View */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-amber-500/10 to-purple-500/10">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                                    Cross-Case Analysis
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Entidades que aparecem em múltiplas operações com suas conexões totais
                                </p>
                            </div>
                            
                            <div className="divide-y divide-slate-800">
                                {crossCaseEntities.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">
                                        <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">Nenhuma conexão cruzada detectada</p>
                                        <p className="text-xs mt-1">As entidades parecem isoladas por operação</p>
                                    </div>
                                ) : (
                                    (showAllEntities ? crossCaseEntities : crossCaseEntities.slice(0, 5)).map((entity) => {
                                        const Icon = TYPE_ICONS[entity.type] || User;
                                        const isExpanded = expandedEntity === entity.id;
                                        return (
                                            <div key={entity.id} className="transition-colors">
                                                <button
                                                    onClick={() => setExpandedEntity(isExpanded ? null : entity.id)}
                                                    className="w-full p-4 hover:bg-slate-800/30 flex items-center gap-3 text-left"
                                                >
                                                    <div className={`p-2 rounded-lg ${TYPE_COLORS[entity.type]?.split(' ')[0] || 'bg-slate-700'}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-white truncate">{entity.name}</p>
                                                        <p className="text-xs text-slate-400">{entity.typeLabel}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-bold">
                                                            {entity.investigationCount} casos
                                                        </span>
                                                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </div>
                                                </button>
                                                {isExpanded && (
                                                    <div className="mx-3 mb-3 p-4 bg-gradient-to-br from-purple-900/30 to-slate-800/50 border border-purple-500/30 rounded-xl shadow-lg shadow-purple-900/20">
                                                        <p className="text-xs text-purple-300 mb-3 font-semibold flex items-center gap-2">
                                                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                                                            📁 INVESTIGAÇÕES CONECTADAS:
                                                        </p>
                                                        <div className="space-y-3">
                                                            {entity.appearances.map((app, idx) => (
                                                                <div key={idx} className="flex items-start gap-3 text-sm p-3 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg transition-colors border border-slate-700/50">
                                                                    <span className="text-lg mt-0.5">{app.relationIcon}</span>
                                                                    <div className="flex-1">
                                                                        <Link href={`/investigation/${app.investigationId}`} className="text-blue-400 hover:text-blue-300 font-medium text-base block mb-1">
                                                                            {app.investigationTitle}
                                                                        </Link>
                                                                        <p className="text-sm text-slate-400 leading-relaxed">
                                                                            <span className="font-semibold">{app.role}</span>
                                                                            {app.details && (
                                                                                <>
                                                                                    {' — '}
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setAccessRequestModal({
                                                                                                isOpen: true,
                                                                                                investigationTitle: app.investigationTitle,
                                                                                                details: app.details || ''
                                                                                            });
                                                                                        }}
                                                                                        className="text-blue-400 hover:text-blue-300 hover:underline inline-block py-0.5"
                                                                                    >
                                                                                        {app.details}
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                    <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
                                                                        {app.relationType}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedEntityId(entity.id)}
                                                            className="mt-3 w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Ver Detalhes da Entidade
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            {crossCaseEntities.length > 5 && !showAllEntities && (
                                <button
                                    onClick={() => setShowAllEntities(true)}
                                    className="w-full p-4 text-center text-purple-400 hover:text-purple-300 hover:bg-slate-800/30 transition-colors border-t border-slate-800"
                                >
                                    Ver mais {crossCaseEntities.length - 5} entidades →
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Entity Modal */}
            <EntityDetailModal
                isOpen={!!selectedEntityId}
                onClose={() => setSelectedEntityId(null)}
                entityId={selectedEntityId || ''}
            />

            {/* Access Request Modal */}
            {accessRequestModal?.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setAccessRequestModal(null)}
                    />
                    <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-700 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                                    Acesso Restrito
                                </h3>
                                <button
                                    onClick={() => setAccessRequestModal(null)}
                                    className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <p className="text-slate-300 text-sm mb-4">
                                Para acessar a evidência <span className="font-semibold text-white">"{accessRequestModal.details}"</span> da 
                                operação <span className="font-semibold text-amber-400">{accessRequestModal.investigationTitle}</span>, 
                                é necessário solicitar acesso ao responsável.
                            </p>

                            {/* Contact Info */}
                            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                                <p className="text-xs text-slate-400 font-semibold uppercase">Responsável pela Operação</p>
                                
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Del. Carlos Henrique</p>
                                        <p className="text-xs text-slate-400">Delegado Titular</p>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-700">
                                    <a 
                                        href="mailto:carlos.henrique@policia.gov.br"
                                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        <Mail className="w-4 h-4" />
                                        carlos.henrique@policia.gov.br
                                    </a>
                                    <a 
                                        href="tel:+5511999999999"
                                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        <Phone className="w-4 h-4" />
                                        (11) 99999-9999
                                    </a>
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 mt-4">
                                💡 Em breve: solicitação de acesso pelo sistema
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-slate-700 bg-slate-800/30 flex justify-end">
                            <button
                                onClick={() => setAccessRequestModal(null)}
                                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function StatCard({ icon: Icon, label, value, color }: {
    icon: any; label: string; value: number | string; color: string;
}) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    };
    
    return (
        <div className={`${colors[color]} border rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs opacity-70">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}
