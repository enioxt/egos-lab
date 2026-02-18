'use client';

import React, { useState, useEffect } from 'react';
import { 
    Lightbulb, 
    Plus, 
    Search,
    AlertTriangle,
    CheckCircle2,
    Clock,
    User,
    ChevronDown,
    ChevronRight,
    Loader2,
    MoreHorizontal,
    Trash2,
    Edit2,
    Flag,
    Target,
    TrendingUp,
    Brain
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Finding {
    id: string;
    type: 'insight' | 'hypothesis' | 'conclusion' | 'recommendation' | 'warning';
    title: string;
    description: string;
    confidence: number; // 0-1
    status: 'pending' | 'verified' | 'rejected' | 'investigating';
    created_at: string;
    created_by?: string;
    source?: string; // 'ai' | 'manual' | 'document'
    metadata?: Record<string, any>;
}

interface FindingsPanelProps {
    investigationId: string;
    onAddFinding?: () => void;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const FINDING_ICONS: Record<string, any> = {
    'insight': Lightbulb,
    'hypothesis': Target,
    'conclusion': CheckCircle2,
    'recommendation': TrendingUp,
    'warning': AlertTriangle
};

const FINDING_COLORS: Record<string, string> = {
    'insight': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'hypothesis': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'conclusion': 'bg-green-500/20 text-green-400 border-green-500/30',
    'recommendation': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'warning': 'bg-red-500/20 text-red-400 border-red-500/30'
};

const TYPE_LABELS: Record<string, string> = {
    'insight': 'Insight',
    'hypothesis': 'Hipótese',
    'conclusion': 'Conclusão',
    'recommendation': 'Recomendação',
    'warning': 'Alerta'
};

const STATUS_LABELS: Record<string, string> = {
    'pending': 'Pendente',
    'verified': 'Verificado',
    'rejected': 'Descartado',
    'investigating': 'Investigando'
};

const STATUS_COLORS: Record<string, string> = {
    'pending': 'bg-slate-500/20 text-slate-400',
    'verified': 'bg-green-500/20 text-green-400',
    'rejected': 'bg-red-500/20 text-red-400',
    'investigating': 'bg-blue-500/20 text-blue-400'
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUPABASE CLIENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIDENCE BAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ConfidenceBar({ value }: { value: number }) {
    const percentage = Math.round(value * 100);
    const color = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500';
    
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color} transition-all`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-xs text-slate-400 w-8">{percentage}%</span>
        </div>
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FINDING CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function FindingCard({ finding, onEdit, onDelete, onVerify }: { 
    finding: Finding; 
    onEdit?: () => void;
    onDelete?: () => void;
    onVerify?: (status: 'verified' | 'rejected') => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    
    const Icon = FINDING_ICONS[finding.type] || Lightbulb;
    const colorClass = FINDING_COLORS[finding.type] || FINDING_COLORS.insight;
    
    return (
        <div className={`border rounded-lg overflow-hidden ${colorClass.split(' ')[2]} bg-slate-800/30`}>
            {/* Header */}
            <div 
                className="p-3 flex items-start justify-between cursor-pointer hover:bg-slate-700/20"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start gap-3">
                    {expanded ? <ChevronDown className="w-4 h-4 mt-1 text-slate-400" /> : <ChevronRight className="w-4 h-4 mt-1 text-slate-400" />}
                    
                    <div className={`p-2 rounded-lg ${colorClass.split(' ').slice(0, 2).join(' ')}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                                {TYPE_LABELS[finding.type]}
                            </span>
                            {finding.source === 'ai' && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 flex items-center gap-1">
                                    <Brain className="w-3 h-3" />
                                    IA
                                </span>
                            )}
                        </div>
                        <p className="font-medium text-white">{finding.title}</p>
                        <p className="text-sm text-slate-400 line-clamp-2 mt-1">{finding.description}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 ml-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[finding.status]}`}>
                        {STATUS_LABELS[finding.status]}
                    </span>
                    
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1 min-w-[140px]">
                                {finding.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onVerify?.('verified'); setShowMenu(false); }}
                                            className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-700 text-green-400 flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="w-3 h-3" />
                                            Verificar
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onVerify?.('rejected'); setShowMenu(false); }}
                                            className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-700 text-red-400 flex items-center gap-2"
                                        >
                                            <Flag className="w-3 h-3" />
                                            Descartar
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit?.(); setShowMenu(false); }}
                                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Edit2 className="w-3 h-3" />
                                    Editar
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete?.(); setShowMenu(false); }}
                                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-700 text-red-400 flex items-center gap-2"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Remover
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Expanded Details */}
            {expanded && (
                <div className="p-3 border-t border-slate-700/50 bg-slate-900/30 space-y-3">
                    {/* Confidence */}
                    <div>
                        <span className="text-xs text-slate-500 block mb-1">Confiança</span>
                        <ConfidenceBar value={finding.confidence} />
                    </div>
                    
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(finding.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {finding.created_by && (
                            <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {finding.created_by}
                            </span>
                        )}
                    </div>
                    
                    {/* Related Entities */}
                    {finding.metadata?.related_entities && (
                        <div>
                            <span className="text-xs text-slate-500 block mb-1">Entidades Relacionadas</span>
                            <div className="flex flex-wrap gap-1">
                                {finding.metadata.related_entities.map((entity: string, idx: number) => (
                                    <span key={idx} className="text-xs px-2 py-0.5 bg-slate-700 rounded">
                                        {entity}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function FindingsPanel({ investigationId, onAddFinding }: FindingsPanelProps) {
    const [findings, setFindings] = useState<Finding[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    
    // Load findings
    useEffect(() => {
        const loadFindings = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('intelink_investigator_findings')
                    .select('*')
                    .eq('investigation_id', investigationId)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                setFindings(data || []);
            } catch (err) {
                console.error('Error loading findings:', err);
            } finally {
                setLoading(false);
            }
        };
        
        loadFindings();
    }, [investigationId]);
    
    // Filter findings
    const filteredFindings = findings.filter(f => {
        const matchesType = filterType === 'all' || f.type === filterType;
        const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
        return matchesType && matchesStatus;
    });
    
    // Stats
    const stats = {
        total: findings.length,
        pending: findings.filter(f => f.status === 'pending').length,
        verified: findings.filter(f => f.status === 'verified').length,
        ai: findings.filter(f => f.source === 'ai').length
    };
    
    if (loading) {
        return (
            <div className="p-6 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Carregando achados...
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                    <span className="font-medium">Achados & Insights</span>
                    <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
                        {findings.length}
                    </span>
                </div>
                
                <button
                    onClick={onAddFinding}
                    className="px-3 py-1.5 text-sm rounded bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar
                </button>
            </div>
            
            {/* Stats */}
            {findings.length > 0 && (
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        <span className="text-slate-400">Pendentes: {stats.pending}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-slate-400">Verificados: {stats.verified}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Brain className="w-3 h-3 text-purple-400" />
                        <span className="text-slate-400">IA: {stats.ai}</span>
                    </div>
                </div>
            )}
            
            {/* Filters */}
            {findings.length > 0 && (
                <div className="flex gap-2">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
                    >
                        <option value="all">Todos os tipos</option>
                        <option value="insight">Insights</option>
                        <option value="hypothesis">Hipóteses</option>
                        <option value="conclusion">Conclusões</option>
                        <option value="recommendation">Recomendações</option>
                        <option value="warning">Alertas</option>
                    </select>
                    
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
                    >
                        <option value="all">Todos os status</option>
                        <option value="pending">Pendentes</option>
                        <option value="verified">Verificados</option>
                        <option value="investigating">Investigando</option>
                        <option value="rejected">Descartados</option>
                    </select>
                </div>
            )}
            
            {/* Content */}
            {filteredFindings.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/30 rounded-lg border border-slate-800">
                    <Lightbulb className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">
                        {findings.length === 0 
                            ? 'Nenhum achado registrado'
                            : 'Nenhum achado encontrado com esses filtros'
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredFindings.map(finding => (
                        <FindingCard
                            key={finding.id}
                            finding={finding}
                            onEdit={() => console.log('Edit', finding.id)}
                            onDelete={() => console.log('Delete', finding.id)}
                            onVerify={(status) => console.log('Verify', finding.id, status)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
