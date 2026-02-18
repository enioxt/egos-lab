'use client';

/**
 * ResumeProcessingBanner - Banner para continuar processamento interrompido
 * 
 * Exibe um banner quando detecta checkpoints não finalizados,
 * permitindo o usuário continuar de onde parou.
 */

import React, { useState, useEffect } from 'react';
import { 
    RefreshCw, 
    X, 
    FileText, 
    AlertTriangle,
    Clock,
    ArrowRight,
    Trash2
} from 'lucide-react';
import { getAllCheckpoints, ProcessingCheckpoint } from '@/hooks/useProcessingCheckpoint';

interface ResumeProcessingBannerProps {
    /** Filtrar por tipo específico */
    filterType?: string;
    /** Filtrar por contextId (ex: investigationId) */
    filterContextId?: string;
    /** Callback quando clicar em continuar */
    onResume?: (checkpoint: ProcessingCheckpoint) => void;
    /** Callback quando descartar checkpoint */
    onDiscard?: (checkpoint: ProcessingCheckpoint) => void;
}

const TYPE_LABELS: Record<string, string> = {
    'document-upload': 'Upload de Documentos',
    'setup-wizard': 'Configuração de Operação',
    'batch-process': 'Processamento em Lote',
    'analysis': 'Análise IA'
};

const TYPE_ICONS: Record<string, typeof FileText> = {
    'document-upload': FileText,
    'setup-wizard': RefreshCw,
    'batch-process': FileText,
    'analysis': AlertTriangle
};

export default function ResumeProcessingBanner({
    filterType,
    filterContextId,
    onResume,
    onDiscard
}: ResumeProcessingBannerProps) {
    const [checkpoints, setCheckpoints] = useState<ProcessingCheckpoint[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    
    useEffect(() => {
        loadCheckpoints();
        
        // Recheck periodically
        const interval = setInterval(loadCheckpoints, 30000);
        return () => clearInterval(interval);
    }, [filterType, filterContextId]);
    
    const loadCheckpoints = () => {
        let cps = getAllCheckpoints();
        
        // Apply filters
        if (filterType) {
            cps = cps.filter(cp => cp.type === filterType);
        }
        if (filterContextId) {
            cps = cps.filter(cp => cp.contextId === filterContextId);
        }
        
        // Remove dismissed
        cps = cps.filter(cp => !dismissed.has(cp.id));
        
        setCheckpoints(cps);
    };
    
    const handleDismiss = (cp: ProcessingCheckpoint) => {
        setDismissed(prev => new Set([...prev, cp.id]));
    };
    
    const handleDiscard = (cp: ProcessingCheckpoint) => {
        // Remove from localStorage
        const key = `intelink_checkpoint_${cp.type}_${cp.contextId}`;
        localStorage.removeItem(key);
        
        // Update state
        setCheckpoints(prev => prev.filter(c => c.id !== cp.id));
        
        // Callback
        onDiscard?.(cp);
    };
    
    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        
        if (diffMins < 1) return 'agora mesmo';
        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        return date.toLocaleDateString('pt-BR');
    };
    
    if (checkpoints.length === 0) return null;
    
    return (
        <div className="space-y-2">
            {checkpoints.map(cp => {
                const Icon = TYPE_ICONS[cp.type] || FileText;
                const label = TYPE_LABELS[cp.type] || cp.type;
                const progress = cp.totalItems > 0 
                    ? Math.round((cp.processedItems / cp.totalItems) * 100)
                    : 0;
                
                return (
                    <div 
                        key={cp.id}
                        className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4 animate-slide-down"
                    >
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <Icon className="w-5 h-5 text-amber-400" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-amber-200">
                                        Processamento Interrompido
                                    </h4>
                                    <span className="text-xs px-2 py-0.5 bg-amber-500/20 rounded text-amber-300">
                                        {label}
                                    </span>
                                </div>
                                
                                <p className="text-sm text-slate-400 mb-2">
                                    {cp.processedItems} de {cp.totalItems} itens processados ({progress}%)
                                </p>
                                
                                {/* Progress bar */}
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
                                    <div 
                                        className="h-full bg-amber-500 transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    <span>Interrompido {formatTimeAgo(cp.updatedAt)}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {/* Discard Button */}
                                <button
                                    onClick={() => handleDiscard(cp)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Descartar e começar do zero"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                
                                {/* Dismiss Button */}
                                <button
                                    onClick={() => handleDismiss(cp)}
                                    className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Ignorar por agora"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                
                                {/* Resume Button */}
                                <button
                                    onClick={() => onResume?.(cp)}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium text-sm transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Continuar
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {/* Animation styles */}
            <style jsx global>{`
                @keyframes slide-down {
                    from {
                        transform: translateY(-10px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-down {
                    animation: slide-down 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
