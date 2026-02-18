'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { 
    FileText, Download, ArrowLeft, Loader2, Sparkles, 
    Eye, X, Copy, MessageSquare, CheckCircle, Clock,
    File, Calendar, Share2, Footprints
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
// jsPDF loaded dynamically to reduce initial bundle size (~300KB)
import { DOCUMENT_TYPE_LABELS } from '@/lib/constants';
import { getSupabaseClient } from '@/lib/supabase-client';
import JourneyList from '@/components/shared/JourneyList';
import { useToast } from '@/components/intelink/Toast';

const supabase = getSupabaseClient();

interface Document {
    id: string;
    document_type: string;
    title: string;
    summary: string;
    historico_completo: string;
    original_filename: string;
    extraction_time_ms: number;
    extraction_cost_usd: number;
    status: string;
    created_at: string;
    metadata: {
        insights?: string[];
        warnings?: string[];
    };
}

interface Investigation {
    id: string;
    title: string;
    description: string;
}

export default function InvestigationReportsPage() {
    const params = useParams();
    const investigationId = params.id as string;
    const { showToast } = useToast();
    
    const [investigation, setInvestigation] = useState<Investigation | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [generating, setGenerating] = useState(false);
    const [aiReport, setAiReport] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadData();
    }, [investigationId]);

    const loadData = async () => {
        if (!supabase) return;
        
        setLoading(true);
        try {
            // Load investigation
            const { data: inv } = await supabase
                .from('intelink_investigations')
                .select('id, title, description')
                .eq('id', investigationId)
                .single();
            
            setInvestigation(inv);

            // Load documents
            const { data: docs } = await supabase
                .from('intelink_documents')
                .select('*')
                .eq('investigation_id', investigationId)
                .order('created_at', { ascending: false });
            
            setDocuments(docs || []);
        } catch (e) {
            console.error('Error loading data:', e);
        } finally {
            setLoading(false);
        }
    };

    const generateAIReport = async () => {
        setGenerating(true);
        try {
            const res = await fetch(`/api/investigation/${investigationId}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'detailed' })
            });

            const data = await res.json();
            if (res.ok) {
                setAiReport(data.report);
                showToast('success', 'Relatório gerado', 'O relatório foi gerado com sucesso');
            } else {
                showToast('error', 'Erro ao gerar relatório', data.error || 'Tente novamente');
            }
        } catch (e) {
            console.error('Error generating report:', e);
            showToast('error', 'Erro ao gerar relatório', 'Verifique sua conexão e tente novamente');
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = (text: string) => {
        // Truncate for WhatsApp (max ~65000 chars but keep it reasonable)
        const maxLength = 4000;
        const truncatedText = text.length > maxLength 
            ? text.substring(0, maxLength) + '\n\n[...relatório truncado, use o PDF para versão completa]'
            : text;
        
        const encodedText = encodeURIComponent(truncatedText);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    const downloadPDF = async (content: string, title: string) => {
        // Dynamic import jsPDF only when needed (~300KB saved from initial load)
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const lines = content.split('\n');
        let y = 20;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const lineHeight = 6;

        doc.setFontSize(10);

        for (const line of lines) {
            if (line.startsWith('# ')) {
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                y += 4;
            } else if (line.startsWith('## ')) {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                y += 2;
            } else {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
            }

            const cleanLine = line.replace(/^#{1,3}\s/, '').replace(/\*\*/g, '');

            if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }

            const splitLines = doc.splitTextToSize(cleanLine, 170);
            for (const sl of splitLines) {
                if (y > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }
                doc.text(sl, margin, y);
                y += lineHeight;
            }
        }

        doc.save(`Relatorio_${title.replace(/\s+/g, '_')}.pdf`);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link 
                                href={`/investigation/${investigationId}`} 
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-400" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    Relatórios
                                </h1>
                                <p className="text-slate-400 text-xs">{investigation?.title}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/chat?inv=${investigationId}`}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white font-medium transition-all flex items-center gap-2"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Chat IA
                            </Link>
                            <button
                                onClick={generateAIReport}
                                disabled={generating}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 rounded-lg text-white font-medium transition-all flex items-center gap-2"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Gerando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Gerar Relatório IA
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                <main className="w-full px-6 py-6 space-y-6">
                    {/* AI Report Section */}
                    {aiReport && (
                        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    Relatório Gerado por IA
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyToClipboard(aiReport)}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Copiar"
                                    >
                                        {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => downloadPDF(aiReport, investigation?.title || 'Relatório')}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Baixar PDF"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => shareWhatsApp(aiReport)}
                                        className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                                        title="Compartilhar via WhatsApp"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setAiReport(null)}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Fechar"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-slate-950 rounded-xl p-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                                <pre className="text-sm text-slate-300 whitespace-pre-wrap">{aiReport}</pre>
                            </div>
                        </div>
                    )}

                    {/* Investigation Journeys Section */}
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Footprints className="w-5 h-5 text-cyan-400" />
                                Jornadas de Investigação
                            </h3>
                            <Link
                                href={`/investigation/${investigationId}/history`}
                                className="text-cyan-400 hover:text-cyan-300 text-sm"
                            >
                                Ver histórico completo →
                            </Link>
                        </div>
                        <div className="p-4">
                            <JourneyList 
                                investigationId={investigationId} 
                                limit={3}
                            />
                        </div>
                    </div>

                    {/* Documents List */}
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="font-semibold text-lg">
                                Documentos Extraídos ({documents.length})
                            </h3>
                        </div>

                        {documents.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p>Nenhum documento processado ainda.</p>
                                <p className="text-sm mt-2">
                                    Use "Adicionar Documento" para processar PDFs e extrair informações.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800/50">
                                {documents.map((doc) => (
                                    <div 
                                        key={doc.id} 
                                        className="p-4 hover:bg-slate-800/30 transition-colors cursor-pointer"
                                        onClick={() => setSelectedDoc(doc)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-blue-500/10 rounded-xl">
                                                    <File className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-white">
                                                        {doc.original_filename || DOCUMENT_TYPE_LABELS[doc.document_type] || 'Documento'}
                                                    </h4>
                                                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                                        {doc.summary}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {doc.extraction_time_ms}ms
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                                                            {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Eye className="w-5 h-5 text-slate-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chat AI Section - Future */}
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <MessageSquare className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Chat com IA</h3>
                                <p className="text-slate-400 text-sm">
                                    Em breve: converse com a IA sobre esta operação para gerar relatórios personalizados.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Document Detail Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-lg">
                                    {selectedDoc.original_filename || 'Documento'}
                                </h3>
                                <p className="text-sm text-slate-400">
                                    {DOCUMENT_TYPE_LABELS[selectedDoc.document_type]}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => copyToClipboard(selectedDoc.historico_completo || selectedDoc.summary || '')}
                                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Copiar"
                                >
                                    {copied ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-400" />}
                                </button>
                                <button
                                    onClick={() => setSelectedDoc(null)}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Summary */}
                            <div>
                                <h4 className="text-sm font-medium text-slate-400 mb-2">Resumo</h4>
                                <p className="text-white">{selectedDoc.summary}</p>
                            </div>

                            {/* Full History */}
                            {selectedDoc.historico_completo && (
                                <div>
                                    <h4 className="text-sm font-medium text-slate-400 mb-2">
                                        Histórico Completo ({selectedDoc.historico_completo.length} caracteres)
                                    </h4>
                                    <div className="bg-slate-950 rounded-xl p-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                                        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                            {selectedDoc.historico_completo}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Insights */}
                            {selectedDoc.metadata?.insights && selectedDoc.metadata.insights.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-slate-400 mb-2">Insights</h4>
                                    <ul className="space-y-2">
                                        {selectedDoc.metadata.insights.map((insight: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-emerald-300">
                                                <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                {insight}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Warnings */}
                            {selectedDoc.metadata?.warnings && selectedDoc.metadata.warnings.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-slate-400 mb-2">Avisos</h4>
                                    <ul className="space-y-2">
                                        {selectedDoc.metadata.warnings.map((warning: string, idx: number) => (
                                            <li key={idx} className="text-sm text-amber-300">• {warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
