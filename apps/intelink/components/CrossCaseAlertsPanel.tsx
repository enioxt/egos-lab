'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VoteModal from '@/components/shared/VoteModal';
import BreakTheGlassModal from '@/components/shared/BreakTheGlassModal';
import { 
    AlertTriangle, 
    Link2, 
    CheckCircle2, 
    XCircle, 
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Shield,
    Users,
    Car,
    Phone,
    FileText,
    ArrowRight,
    Eye
} from 'lucide-react';

interface CrossCaseAlert {
    id: string;
    entity_name: string;
    entity_type: string;
    match_type: string;
    confidence: number;
    description: string;
    status: string;
    created_at: string;
    reviewed_at?: string;
    reviewed_by?: string;
    reviewer_name?: string;
    source_investigation_id: string;
    target_investigation_id: string;
    source_inv?: { title: string };
    target_inv?: { title: string };
}

interface CrossCaseAlertsPanelProps {
    investigationId?: string;
    maxItems?: number;
    title?: string;
    onAlertClick?: (alert: CrossCaseAlert) => void;
    className?: string;
}

const MATCH_TYPE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
    'name': { label: 'Nome', color: 'text-blue-400 bg-blue-500/10', icon: Users },
    'nome': { label: 'Nome', color: 'text-blue-400 bg-blue-500/10', icon: Users },
    'cpf': { label: 'CPF', color: 'text-emerald-400 bg-emerald-500/10', icon: FileText },
    'phone': { label: 'Telefone', color: 'text-purple-400 bg-purple-500/10', icon: Phone },
    'telefone': { label: 'Telefone', color: 'text-purple-400 bg-purple-500/10', icon: Phone },
    'plate': { label: 'Placa', color: 'text-amber-400 bg-amber-500/10', icon: Car },
    'placa': { label: 'Placa', color: 'text-amber-400 bg-amber-500/10', icon: Car },
    'rg': { label: 'RG', color: 'text-cyan-400 bg-cyan-500/10', icon: FileText },
    'arma': { label: 'Arma', color: 'text-red-400 bg-red-500/10', icon: Shield },
    'veiculo': { label: 'Veículo', color: 'text-pink-400 bg-pink-500/10', icon: Car }
};

// Simplificar descrições técnicas para linguagem policial
const translateMatchReason = (reason: string): string => {
    // Se for texto técnico, substituir por algo mais limpo
    if (reason.toLowerCase().includes('auto-detect') || reason.toLowerCase().includes('duplicat')) {
        return ''; // Omitir texto técnico redundante
    }
    const translations: Record<string, string> = {
        'Manual link': 'Vínculo confirmado manualmente',
        'AI suggested': 'Identificado por análise de IA'
    };
    return translations[reason] || reason;
};

const CONFIDENCE_COLORS: Record<string, string> = {
    'critical': 'bg-red-500/20 border-red-500/40 text-red-400',
    'high': 'bg-orange-500/20 border-orange-500/40 text-orange-400',
    'medium': 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    'low': 'bg-slate-500/20 border-slate-500/40 text-slate-400'
};

function getSeverity(confidence: number): string {
    if (confidence >= 0.95) return 'critical';
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
}

export default function CrossCaseAlertsPanel({
    investigationId,
    maxItems = 5,
    title = 'Alertas Cross-Case',
    onAlertClick,
    className = ''
}: CrossCaseAlertsPanelProps) {
    const [alerts, setAlerts] = useState<CrossCaseAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showMore, setShowMore] = useState(false);
    
    // Vote Modal state
    const [voteModalOpen, setVoteModalOpen] = useState(false);
    const [votingAlert, setVotingAlert] = useState<CrossCaseAlert | null>(null);
    const [isVoting, setIsVoting] = useState(false);
    
    // Break the Glass Modal state
    const [breakGlassOpen, setBreakGlassOpen] = useState(false);
    const [breakGlassAlert, setBreakGlassAlert] = useState<CrossCaseAlert | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadAlerts();
    }, [investigationId]);

    async function loadAlerts() {
        try {
            setLoading(true);
            
            let url = '/api/intelink/alerts';
            if (investigationId) {
                url += `?investigation_id=${investigationId}`;
            }
            
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.alerts) {
                setAlerts(data.alerts);
            } else if (Array.isArray(data)) {
                setAlerts(data);
            } else {
                // Fallback: fetch directly from supabase via API
                const directRes = await fetch(`/api/central/cross-case-alerts${investigationId ? `?inv=${investigationId}` : ''}`);
                const directData = await directRes.json();
                setAlerts(directData.alerts || []);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleResolve(alertId: string, action: 'confirm' | 'dismiss') {
        // Feedback visual imediato
        const actionLabel = action === 'confirm' ? 'Confirmando' : 'Descartando';
        const alertElement = document.getElementById(`alert-${alertId}`);
        if (alertElement) {
            alertElement.style.opacity = '0.5';
            alertElement.style.pointerEvents = 'none';
        }
        
        try {
            const res = await fetch(`/api/intelink/alerts/${alertId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: action === 'confirm' ? 'confirmed' : 'dismissed' 
                })
            });
            
            if (res.ok) {
                // Remover da lista com animação
                setAlerts(prev => prev.filter(a => a.id !== alertId));
                
                // Toast de sucesso (usar alert temporariamente)
                const msg = action === 'confirm' 
                    ? '✓ Conexão confirmada! O vínculo foi registrado.'
                    : '✗ Alerta descartado.';
                
                // Criar toast visual simples
                const toast = document.createElement('div');
                toast.className = 'fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white text-sm z-50 animate-pulse';
                toast.style.backgroundColor = action === 'confirm' ? '#10b981' : '#6b7280';
                toast.textContent = msg;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
            } else {
                throw new Error('Erro ao processar');
            }
        } catch (err) {
            console.error('Error resolving alert:', err);
            if (alertElement) {
                alertElement.style.opacity = '1';
                alertElement.style.pointerEvents = 'auto';
            }
        }
    }

    const displayedAlerts = showMore ? alerts : alerts.slice(0, maxItems);
    const pendingCount = alerts.filter(a => a.status === 'pending').length;

    if (loading) {
        return (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="animate-pulse flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-cyan-400" />
                    <span className="text-slate-400">Verificando conexões...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Erro: {error}</span>
                </div>
            </div>
        );
    }

    if (alerts.length === 0) {
        return (
            <div className={`bg-emerald-500/5 rounded-xl p-6 border border-emerald-500/20 flex flex-col justify-center ${className}`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Shield className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="font-medium text-emerald-400">✓ Sem conflitos detectados</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Nenhuma entidade desta operação aparece em outros casos
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col ${className}`}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-semibold text-white">{title}</h3>
                    {pendingCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full animate-pulse">
                            {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <Link 
                    href={investigationId ? `/central/vinculos?inv=${investigationId}` : '/central/vinculos'}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                    Ver tudo →
                </Link>
            </div>

            {/* List - Scrollable */}
            <div className="divide-y divide-slate-700/30 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                {displayedAlerts.map((alert) => {
                    const matchInfo = MATCH_TYPE_LABELS[alert.match_type] || { 
                        label: alert.match_type, 
                        color: 'text-slate-400 bg-slate-500/10',
                        icon: Link2
                    };
                    const MatchIcon = matchInfo.icon;
                    const severity = getSeverity(alert.confidence);
                    const isExpanded = expandedId === alert.id;

                    return (
                        <div 
                            key={alert.id}
                            id={`alert-${alert.id}`}
                            className={`p-4 transition-all duration-300 ${
                                alert.status === 'pending' 
                                    ? 'hover:bg-slate-700/30' 
                                    : 'opacity-60'
                            }`}
                        >
                            {/* Main row */}
                            <div 
                                className="flex items-start gap-3 cursor-pointer"
                                onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                            >
                                {/* Severity indicator */}
                                <div className={`p-2 rounded-lg border ${CONFIDENCE_COLORS[severity]}`}>
                                    <AlertTriangle className="w-4 h-4" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-white">
                                            {alert.entity_name}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${matchInfo.color}`}>
                                            <MatchIcon className="w-3 h-3 inline mr-1" />
                                            {matchInfo.label}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {Math.round(alert.confidence * 100)}%
                                        </span>
                                        {alert.status !== 'pending' && alert.reviewer_name && (
                                            <span className={`px-2 py-0.5 rounded text-xs ${
                                                alert.status === 'confirmed' 
                                                    ? 'bg-emerald-500/20 text-emerald-400' 
                                                    : 'bg-red-500/20 text-red-400'
                                            }`}>
                                                {alert.status === 'confirmed' ? '✓' : '✗'} {alert.reviewer_name}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Descrição (apenas se não vazia) */}
                                    {translateMatchReason(alert.description) && (
                                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                            {translateMatchReason(alert.description)}
                                        </p>
                                    )}

                                    {/* Operações envolvidas - DESTAQUE */}
                                    <div className="flex items-center gap-2 mt-2 text-xs">
                                        <span className="text-cyan-400 font-medium">
                                            {alert.source_inv?.title || 'Operação 1'}
                                        </span>
                                        <span className="text-slate-500">↔</span>
                                        <span className="text-cyan-400 font-medium">
                                            {alert.target_inv?.title || 'Operação 2'}
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
                                    {/* Full description */}
                                    <div className="p-3 bg-slate-700/30 rounded-lg">
                                        <p className="text-sm text-slate-300">
                                            {translateMatchReason(alert.description)}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    {alert.status === 'pending' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setVotingAlert(alert);
                                                    setVoteModalOpen(true);
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Confirmar Conexão
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleResolve(alert.id, 'dismiss');
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Descartar
                                            </button>
                                            {onAlertClick && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAlertClick(alert);
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Ver Detalhes
                                                </button>
                                            )}
                                            {/* Break the Glass - Ver operação externa */}
                                            {alert.target_investigation_id && alert.target_investigation_id !== investigationId && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setBreakGlassAlert(alert);
                                                        setBreakGlassOpen(true);
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm border border-red-500/30"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Ver Op. Externa
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Timestamp & Reviewer */}
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>Detectado em: {new Date(alert.created_at).toLocaleString('pt-BR')}</span>
                                        {alert.reviewer_name && alert.status !== 'pending' && (
                                            <span className={`flex items-center gap-1 ${
                                                alert.status === 'confirmed' ? 'text-emerald-400' : 'text-red-400'
                                            }`}>
                                                {alert.status === 'confirmed' ? (
                                                    <CheckCircle2 className="w-3 h-3" />
                                                ) : (
                                                    <XCircle className="w-3 h-3" />
                                                )}
                                                {alert.status === 'confirmed' ? 'Confirmado' : 'Descartado'} por {alert.reviewer_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Show more button */}
            {alerts.length > maxItems && (
                <div className="px-4 py-3 border-t border-slate-700/50">
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        {showMore ? 'Ver menos' : `Ver mais ${alerts.length - maxItems} alertas`}
                    </button>
                </div>
            )}
            
            {/* Vote Modal with Quorum System */}
            {votingAlert && (
                <VoteModal
                    isOpen={voteModalOpen}
                    onClose={() => {
                        setVoteModalOpen(false);
                        setVotingAlert(null);
                    }}
                    onVote={async (action, evidence) => {
                        setIsVoting(true);
                        try {
                            // Map 'reject' to 'dismiss' for our API
                            const apiAction = action === 'reject' ? 'dismiss' : action;
                            await handleResolve(votingAlert.id, apiAction);
                            setVoteModalOpen(false);
                            setVotingAlert(null);
                        } finally {
                            setIsVoting(false);
                        }
                    }}
                    entityName={votingAlert.entity_name}
                    entityType={votingAlert.entity_type}
                    matchConfidence={votingAlert.confidence * 100}
                    matchCriteria={{ [votingAlert.match_type]: true }}
                    targetInvestigation={votingAlert.target_inv?.title || 'Outra operação'}
                    requiredQuorum={2}
                    isLoading={isVoting}
                />
            )}

            {/* Break the Glass Modal for Cross-Case Access */}
            {breakGlassAlert && (
                <BreakTheGlassModal
                    isOpen={breakGlassOpen}
                    onClose={() => {
                        setBreakGlassOpen(false);
                        setBreakGlassAlert(null);
                    }}
                    onConfirm={(justification) => {
                        // Navigate to external operation after justification
                        router.push(`/central/investigacoes/${breakGlassAlert.target_investigation_id}`);
                    }}
                    resourceType="operation"
                    resourceId={breakGlassAlert.target_investigation_id}
                    resourceName={breakGlassAlert.entity_name}
                    targetOperation={breakGlassAlert.target_inv?.title || 'Operação Externa'}
                />
            )}
        </div>
    );
}
