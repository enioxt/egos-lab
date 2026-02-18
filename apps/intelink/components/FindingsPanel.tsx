'use client';

import { useState, useEffect } from 'react';
import { 
    MessageSquare, 
    Eye, 
    BarChart3, 
    Link2, 
    Target, 
    UserSearch,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    Sparkles,
    Scale,
    Route,
    Shield,
    ClipboardList,
    FileText
} from 'lucide-react';

interface Finding {
    id: string;
    finding_type: string;
    finding_type_label: string;
    title: string;
    description: string;
    subject_names: string[];
    confidence: number;
    confidence_percent: number;
    suggested_action: string;
    action_priority: string;
    corroboration_status: string;
    created_at: string;
    investigation?: {
        id: string;
        title: string;
    };
}

interface FindingsPanelProps {
    investigationId?: string;
    showAll?: boolean;
    maxItems?: number;
    title?: string;
}

const TYPE_ICONS: Record<string, any> = {
    'interview_impression': MessageSquare,
    'surveillance_obs': Eye,
    'technical_analysis': BarChart3,
    'connection_hypothesis': Link2,
    'modus_operandi': Target,
    'source_intel': UserSearch,
    // AI Analysis types
    'criminal_article': Scale,
    'investigation_line': Route,
    'risk_analysis': Shield,
    'suggested_diligence': ClipboardList,
    'executive_summary': FileText
};

const TYPE_COLORS: Record<string, string> = {
    'interview_impression': 'text-blue-400 bg-blue-500/10',
    'surveillance_obs': 'text-purple-400 bg-purple-500/10',
    'technical_analysis': 'text-cyan-400 bg-cyan-500/10',
    'connection_hypothesis': 'text-amber-400 bg-amber-500/10',
    'modus_operandi': 'text-red-400 bg-red-500/10',
    'source_intel': 'text-emerald-400 bg-emerald-500/10',
    // AI Analysis types
    'criminal_article': 'text-amber-400 bg-amber-500/10',
    'investigation_line': 'text-purple-400 bg-purple-500/10',
    'risk_analysis': 'text-red-400 bg-red-500/10',
    'suggested_diligence': 'text-green-400 bg-green-500/10',
    'executive_summary': 'text-blue-400 bg-blue-500/10'
};

const PRIORITY_COLORS: Record<string, string> = {
    'immediate': 'bg-red-500 text-white',
    'high': 'bg-orange-500 text-white',
    'medium': 'bg-yellow-500 text-black',
    'low': 'bg-slate-500 text-white'
};

const CORROBORATION_COLORS: Record<string, string> = {
    'corroborated': 'text-emerald-400',
    'partially_corroborated': 'text-amber-400',
    'uncorroborated': 'text-slate-400',
    'contradicted': 'text-red-400'
};

export default function FindingsPanel({ 
    investigationId, 
    showAll = false,
    maxItems = 5,
    title = 'Achados Investigativos'
}: FindingsPanelProps) {
    const [findings, setFindings] = useState<Finding[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showMore, setShowMore] = useState(false);

    useEffect(() => {
        loadFindings();
    }, [investigationId, showAll]);

    async function loadFindings() {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (investigationId) {
                params.set('investigation_id', investigationId);
            }
            if (showAll) {
                params.set('priority', 'high');
            }
            params.set('limit', '20');

            const res = await fetch(`/api/findings?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setFindings(data.findings || []);
            } else {
                setError(data.error);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function toggleExpand(id: string) {
        setExpandedId(expandedId === id ? null : id);
    }

    const displayedFindings = showMore ? findings : findings.slice(0, maxItems);

    if (loading) {
        return (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="animate-pulse flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="text-slate-400">Carregando achados...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>Erro: {error}</span>
                </div>
            </div>
        );
    }

    if (findings.length === 0) {
        return (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400">
                    <Eye className="w-5 h-5" />
                    <span>Nenhum achado investigativo registrado</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                    Achados são observações do investigador durante entrevistas, vigilâncias e análises técnicas.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="font-semibold text-white">{title}</h3>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                        {findings.length}
                    </span>
                </div>
                <span className="text-xs text-slate-500">
                    Provas Subjetivas
                </span>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-700/30">
                {displayedFindings.map((finding) => {
                    const Icon = TYPE_ICONS[finding.finding_type] || Eye;
                    const colorClass = TYPE_COLORS[finding.finding_type] || 'text-slate-400 bg-slate-500/10';
                    const isExpanded = expandedId === finding.id;

                    return (
                        <div 
                            key={finding.id}
                            className="p-4 hover:bg-slate-700/20 transition-colors"
                        >
                            {/* Main row */}
                            <div 
                                className="flex items-start gap-3 cursor-pointer"
                                onClick={() => toggleExpand(finding.id)}
                            >
                                {/* Icon */}
                                <div className={`p-2 rounded-lg ${colorClass}`}>
                                    <Icon className="w-4 h-4" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-white">
                                            {finding.title}
                                        </span>
                                        {finding.action_priority && (
                                            <span className={`px-1.5 py-0.5 text-xs rounded ${PRIORITY_COLORS[finding.action_priority] || 'bg-slate-600'}`}>
                                                {finding.action_priority}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                        {finding.description}
                                    </p>

                                    {/* Meta */}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <BarChart3 className="w-3 h-3" />
                                            {finding.confidence_percent}% confiança
                                        </span>
                                        <span className={`flex items-center gap-1 ${CORROBORATION_COLORS[finding.corroboration_status] || ''}`}>
                                            {finding.corroboration_status === 'corroborated' ? (
                                                <CheckCircle2 className="w-3 h-3" />
                                            ) : (
                                                <Clock className="w-3 h-3" />
                                            )}
                                            {finding.corroboration_status === 'corroborated' ? 'Corroborado' :
                                             finding.corroboration_status === 'partially_corroborated' ? 'Parcialmente corroborado' :
                                             finding.corroboration_status === 'contradicted' ? 'Contradito' : 'Não corroborado'}
                                        </span>
                                    </div>
                                </div>

                                {/* Expand button */}
                                <button className="text-slate-400 hover:text-white">
                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5" />
                                    )}
                                </button>
                            </div>

                            {/* Expanded content */}
                            {isExpanded && (
                                <div className="mt-4 pl-11 space-y-3">
                                    {/* Type label */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Tipo:</span>
                                        <span className={`text-sm ${colorClass.split(' ')[0]}`}>
                                            {finding.finding_type_label}
                                        </span>
                                    </div>

                                    {/* Investigation (if showing all) */}
                                    {finding.investigation && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">Operação:</span>
                                            <span className="text-sm text-cyan-400">
                                                {finding.investigation.title}
                                            </span>
                                        </div>
                                    )}

                                    {/* Entities involved */}
                                    {finding.subject_names && finding.subject_names.length > 0 && (
                                        <div>
                                            <span className="text-xs text-slate-500">Entidades envolvidas:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {finding.subject_names.map((name, i) => (
                                                    <span 
                                                        key={i}
                                                        className="px-2 py-0.5 bg-slate-700 rounded text-xs text-white"
                                                    >
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Suggested action */}
                                    {finding.suggested_action && (
                                        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                            <span className="text-xs text-amber-400 font-medium">
                                                Ação Sugerida:
                                            </span>
                                            <p className="text-sm text-slate-300 mt-1">
                                                {finding.suggested_action}
                                            </p>
                                        </div>
                                    )}

                                    {/* Timestamp */}
                                    <div className="text-xs text-slate-500">
                                        Registrado em: {new Date(finding.created_at).toLocaleString('pt-BR')}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Show more button */}
            {findings.length > maxItems && (
                <div className="px-4 py-3 border-t border-slate-700/50">
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        {showMore ? 'Ver menos' : `Ver mais ${findings.length - maxItems} achados`}
                    </button>
                </div>
            )}
        </div>
    );
}
