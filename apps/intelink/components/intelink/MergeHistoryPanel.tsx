'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    History, 
    RotateCcw, 
    Clock, 
    User,
    GitMerge,
    AlertTriangle,
    Check,
    Loader2
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface MergeLog {
    id: string;
    action: string;
    source_entity_id: string;
    target_entity_id: string;
    source_entity_snapshot: {
        name: string;
        type: string;
        metadata?: Record<string, any>;
    };
    target_entity_snapshot: {
        name: string;
        type: string;
        metadata?: Record<string, any>;
    };
    performed_at: string;
    rollback_available: boolean;
    rollback_performed_at: string | null;
}

interface MergeHistoryPanelProps {
    investigationId: string;
    onRollbackComplete?: () => void;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function MergeHistoryPanel({ 
    investigationId, 
    onRollbackComplete 
}: MergeHistoryPanelProps) {
    const [logs, setLogs] = useState<MergeLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [rolling, setRolling] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Fetch merge history
    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/entities/merge/history?investigation_id=${investigationId}`);
            if (!res.ok) throw new Error('Failed to fetch history');
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (err) {
            console.error('Error fetching merge history:', err);
            setError('Erro ao carregar histórico');
        } finally {
            setLoading(false);
        }
    }, [investigationId]);
    
    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);
    
    // Handle rollback
    const handleRollback = async (logId: string) => {
        setRolling(logId);
        setError(null);
        
        try {
            const res = await fetch('/api/entities/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'rollback',
                    log_id: logId
                })
            });
            
            if (!res.ok) throw new Error('Failed to rollback');
            
            // Update local state
            setLogs(prev => prev.map(log => 
                log.id === logId 
                    ? { ...log, rollback_available: false, rollback_performed_at: new Date().toISOString() }
                    : log
            ));
            
            onRollbackComplete?.();
        } catch (err) {
            setError('Erro ao desfazer merge');
            console.error(err);
        } finally {
            setRolling(null);
        }
    };
    
    // Format date
    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Loading
    if (loading) {
        return (
            <div className="p-4 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Carregando histórico...
            </div>
        );
    }
    
    // No history
    if (logs.length === 0) {
        return (
            <div className="p-4 text-center text-slate-400">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Nenhum merge realizado ainda
            </div>
        );
    }
    
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-400" />
                    <span className="font-medium">Histórico de Merges</span>
                    <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
                        {logs.length}
                    </span>
                </div>
                <button
                    onClick={fetchHistory}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                    <RotateCcw className="w-3 h-3" />
                    Atualizar
                </button>
            </div>
            
            {/* Error */}
            {error && (
                <div className="p-2 bg-red-500/20 border border-red-500/30 rounded text-sm text-red-400">
                    {error}
                </div>
            )}
            
            {/* Logs */}
            <div className="space-y-2">
                {logs.map(log => (
                    <div 
                        key={log.id}
                        className={`p-3 rounded-lg border ${
                            log.rollback_performed_at 
                                ? 'bg-slate-900/50 border-slate-700/50 opacity-60'
                                : 'bg-slate-800/50 border-slate-700'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <GitMerge className={`w-4 h-4 ${
                                    log.rollback_performed_at ? 'text-slate-500' : 'text-blue-400'
                                }`} />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">
                                            {log.source_entity_snapshot?.name}
                                        </span>
                                        <span className="text-slate-500">→</span>
                                        <span className="font-medium text-sm">
                                            {log.target_entity_snapshot?.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(log.performed_at)}
                                        {log.rollback_performed_at && (
                                            <span className="text-amber-400 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Desfeito em {formatDate(log.rollback_performed_at)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Rollback button */}
                            {log.rollback_available && !log.rollback_performed_at && (
                                <button
                                    onClick={() => handleRollback(log.id)}
                                    disabled={rolling === log.id}
                                    className="px-3 py-1.5 text-xs rounded bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 flex items-center gap-1 disabled:opacity-50"
                                >
                                    {rolling === log.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <RotateCcw className="w-3 h-3" />
                                    )}
                                    Desfazer
                                </button>
                            )}
                            
                            {log.rollback_performed_at && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Desfeito
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
