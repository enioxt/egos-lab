'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
    Fingerprint, Search, Filter, Download,
    Shield, FileText, Image as ImageIcon, MapPin, 
    Box, Tag, Lock, X, Loader2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Evidence {
    id: string;
    type: string;
    url?: string;
    content_text?: string;
    metadata?: Record<string, any>;
    created_at: string;
    investigation_id: string;
    investigation_title?: string;
}

const EVIDENCE_ICONS: Record<string, any> = {
    'weapon': Shield,
    'document': FileText,
    'media': ImageIcon,
    'location': MapPin,
    'object': Box,
    'default': Fingerprint
};


function CentralEvidenciasContent() {
    const searchParams = useSearchParams();
    const investigationFilter = searchParams.get('inv');
    
    const [evidences, setEvidences] = useState<Evidence[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [investigationTitle, setInvestigationTitle] = useState<string>('');

    useEffect(() => {
        loadEvidences();
    }, [investigationFilter]);

    const loadEvidences = async () => {
        setLoading(true);
        try {
            // Build query with optional investigation filter
            // Note: intelink_evidence has: id, investigation_id, type, url, content_text, metadata, created_at
            let query = supabase
                .from('intelink_evidence')
                .select(`
                    id, type, url, content_text, metadata, created_at,
                    investigation_id
                `)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(100);
            
            // Apply investigation filter if present
            if (investigationFilter) {
                query = query.eq('investigation_id', investigationFilter);
                
                // Get investigation title via API (bypasses RLS)
                try {
                    const res = await fetch(`/api/investigation/${investigationFilter}`);
                    if (res.ok) {
                        const invData = await res.json();
                        if (invData?.investigation?.title) {
                            setInvestigationTitle(invData.investigation.title);
                        }
                    }
                } catch (e) {
                    console.error('Error fetching investigation title:', e);
                }
            }
            
            const { data, error } = await query;

            if (data) {
                setEvidences(data as Evidence[]);
            }
        } catch (error) {
            console.error('Error loading evidence:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvidences = evidences.filter(ev => {
        const description = ev.content_text || ev.metadata?.fileName || ev.url || '';
        const matchesSearch = description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (ev.investigation_title || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || ev.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Investigation Filter Banner */}
            {investigationFilter && (
                <div className="mb-6 flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-emerald-400" />
                        <div>
                            <p className="text-sm text-emerald-300">Filtrando por operação</p>
                            <p className="text-white font-medium">{investigationTitle || 'Carregando...'}</p>
                        </div>
                    </div>
                    <Link
                        href="/central/evidencias"
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Limpar filtro
                    </Link>
                </div>
            )}
            
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Fingerprint className="w-8 h-8 text-blue-400" />
                        {investigationFilter ? 'Evidências da Operação' : 'Central de Evidências'}
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {investigationFilter 
                            ? `${evidences.length} evidências encontradas`
                            : 'Repositório global de artefatos com acesso controlado (RLS)'
                        }
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors">
                        <Filter className="w-4 h-4" />
                        Filtros
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                        <Download className="w-4 h-4" />
                        Exportar Relatório
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por descrição, número de série ou operação..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Evidence List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredEvidences.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800">
                    <Box className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Nenhuma evidência encontrada</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredEvidences.map((ev) => {
                        const Icon = EVIDENCE_ICONS[ev.type] || EVIDENCE_ICONS.default;
                        
                        const displayName = ev.content_text || ev.metadata?.fileName || ev.url || 'Evidência';
                        const displayDate = new Date(ev.created_at).toLocaleDateString('pt-BR');
                        
                        return (
                            <div 
                                key={ev.id}
                                className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:bg-slate-800/30"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon Box */}
                                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                                        <Icon className="w-6 h-6" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className="font-semibold text-white truncate pr-4">
                                                {displayName}
                                            </h3>
                                            <span className="text-xs text-slate-500">{displayDate}</span>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-slate-400 mt-2">
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 rounded text-xs">
                                                <Tag className="w-3 h-3" />
                                                {ev.type?.toUpperCase() || 'OUTROS'}
                                            </span>
                                            
                                            {ev.url && (
                                                <a 
                                                    href={ev.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300"
                                                >
                                                    <Shield className="w-3 h-3" />
                                                    Ver arquivo
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action - Only visible on hover */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white" title="Ver detalhes (Auditado)">
                                            <Lock className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function CentralEvidenciasPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>}>
            <CentralEvidenciasContent />
        </Suspense>
    );
}
