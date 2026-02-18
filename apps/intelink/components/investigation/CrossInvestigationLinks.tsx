'use client';

/**
 * CrossInvestigationLinks - Mostra conexões detectadas com outras operações
 * 
 * Usa embeddings para encontrar documentos similares e exibe em tempo real
 */

import React, { useEffect, useState } from 'react';
import { Network, ExternalLink, Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface CrossLink {
    id: string;
    target_investigation_id: string;
    target_investigation?: { id: string; title: string };
    source_document?: { id: string; title: string; document_type: string };
    target_document?: { id: string; title: string; document_type: string };
    confidence: number;
    link_type: string;
    description?: string;
    status: string;
    created_at: string;
}

interface Props {
    investigationId: string;
    onConnectionClick?: (link: CrossLink) => void;
}

export default function CrossInvestigationLinks({ investigationId, onConnectionClick }: Props) {
    const [links, setLinks] = useState<CrossLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadConnections = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const res = await fetch(`/api/documents/embeddings?investigation_id=${investigationId}`);
            const data = await res.json();
            
            if (res.ok) {
                setLinks(data.connections || []);
            } else {
                setError(data.error || 'Erro ao carregar conexões');
            }
        } catch (err) {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (investigationId) {
            loadConnections();
        }
    }, [investigationId]);

    if (loading) {
        return (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Buscando conexões...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-red-500/30">
                <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                </div>
            </div>
        );
    }

    if (links.length === 0) {
        return (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Network className="w-4 h-4" />
                        <span className="text-sm">Nenhuma conexão detectada</span>
                    </div>
                    <button
                        onClick={loadConnections}
                        className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                        title="Atualizar"
                    >
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/30 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-purple-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-purple-400" />
                    <span className="font-medium text-white">
                        Conexões Cross-Case ({links.length})
                    </span>
                </div>
                <button
                    onClick={loadConnections}
                    className="p-1.5 hover:bg-slate-700/50 rounded transition-colors"
                    title="Atualizar"
                >
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            {/* Links List */}
            <div className="divide-y divide-slate-700/50 max-h-64 overflow-y-auto">
                {links.map((link) => (
                    <div
                        key={link.id}
                        className="px-4 py-3 hover:bg-slate-800/30 transition-colors cursor-pointer"
                        onClick={() => onConnectionClick?.(link)}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-medium truncate">
                                        {link.target_investigation?.title || 'Operação'}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                                        link.confidence >= 0.9 ? 'bg-emerald-500/20 text-emerald-400' :
                                        link.confidence >= 0.8 ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-amber-500/20 text-amber-400'
                                    }`}>
                                        {Math.round(link.confidence * 100)}%
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                                    {link.description || `Similaridade semântica detectada`}
                                </p>
                            </div>
                            <Link
                                href={`/investigation/${link.target_investigation_id}`}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink className="w-4 h-4 text-slate-400" />
                            </Link>
                        </div>
                        
                        {/* Status indicator */}
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            {link.status === 'confirmed' ? (
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                            ) : (
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                            )}
                            <span>{link.status === 'confirmed' ? 'Confirmado' : 'Pendente revisão'}</span>
                            <span>•</span>
                            <span>{new Date(link.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-700/50">
                <Link
                    href={`/central/graph?highlight=${investigationId}`}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                    <Network className="w-3 h-3" />
                    Ver no grafo completo
                </Link>
            </div>
        </div>
    );
}
