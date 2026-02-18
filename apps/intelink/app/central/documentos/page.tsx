'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
    FileText, Search, Filter, Download,
    Calendar, Hash, X, Eye, Loader2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Document {
    id: string;
    document_type: string;
    title: string;
    numero_ocorrencia?: string;
    summary?: string;
    created_at: string;
    investigation_id: string;
    investigation?: { title: string };
}

const DOC_TYPE_LABELS: Record<string, string> = {
    'reds': 'REDS/B.O.',
    'laudo': 'Laudo Pericial',
    'relatorio': 'Relatório',
    'inquerito': 'Inquérito',
    'outros': 'Outros'
};

function CentralDocumentosContent() {
    const searchParams = useSearchParams();
    const investigationFilter = searchParams.get('inv');
    
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [investigationTitle, setInvestigationTitle] = useState<string>('');

    useEffect(() => {
        loadDocuments();
    }, [investigationFilter]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('intelink_documents')
                .select(`
                    id, document_type, title, numero_ocorrencia, summary, created_at,
                    investigation_id,
                    investigation:intelink_investigations(title)
                `)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(100);
            
            if (investigationFilter) {
                query = query.eq('investigation_id', investigationFilter);
                
                const { data: invData } = await supabase
                    .from('intelink_investigations')
                    .select('title')
                    .eq('id', investigationFilter)
                    .single();
                if (invData) setInvestigationTitle(invData.title);
            }
            
            const { data, error } = await query;

            if (data) {
                const enhanced = data.map((item: any) => ({
                    ...item,
                    investigation: Array.isArray(item.investigation) ? item.investigation[0] : item.investigation
                }));
                setDocuments(enhanced as Document[]);
            }
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = (doc.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (doc.numero_ocorrencia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (doc.summary || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || doc.document_type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Investigation Filter Banner */}
            {investigationFilter && (
                <div className="mb-6 flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div>
                            <p className="text-sm text-blue-300">Filtrando por operação</p>
                            <p className="text-white font-medium">{investigationTitle || 'Carregando...'}</p>
                        </div>
                    </div>
                    <Link
                        href="/central/documentos"
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
                        <FileText className="w-8 h-8 text-blue-400" />
                        {investigationFilter ? 'Documentos da Operação' : 'Central de Documentos'}
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {filteredDocuments.length} documentos encontrados
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm"
                    >
                        <option value="all">Todos os tipos</option>
                        {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por título, número de ocorrência ou resumo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
            ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Nenhum documento encontrado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredDocuments.map((doc) => (
                        <div 
                            key={doc.id}
                            className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:bg-slate-800/30"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                                    <FileText className="w-6 h-6" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                        <h3 className="font-semibold text-white truncate pr-4">
                                            {doc.title}
                                        </h3>
                                        <span className="text-xs text-slate-500">
                                            {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>

                                    {doc.summary && (
                                        <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                                            {doc.summary}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 rounded text-xs">
                                            {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                                        </span>
                                        
                                        {doc.numero_ocorrencia && (
                                            <span className="flex items-center gap-1.5">
                                                <Hash className="w-3 h-3" />
                                                {doc.numero_ocorrencia}
                                            </span>
                                        )}

                                        {doc.investigation && (
                                            <span className="text-xs text-slate-500">
                                                Op. {doc.investigation.title}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white" title="Ver detalhes">
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Wrapper with Suspense for useSearchParams
export default function CentralDocumentosPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        }>
            <CentralDocumentosContent />
        </Suspense>
    );
}
