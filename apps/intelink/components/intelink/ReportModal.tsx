'use client';

import React, { useState } from 'react';
import { X, FileText, Download, Copy, Loader2, CheckCircle, FileDown, FileType } from 'lucide-react';
import { exportToPDF, exportToDOCX, exportToMarkdown } from '@/lib/reports/export-utils';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    investigationId: string;
    investigationTitle: string;
}

export default function ReportModal({ 
    isOpen, 
    onClose, 
    investigationId, 
    investigationTitle 
}: ReportModalProps) {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);

    const generateReport = async (type: 'summary' | 'detailed' = 'summary') => {
        setLoading(true);
        setError(null);
        setReport(null);

        try {
            const res = await fetch(`/api/investigation/${investigationId}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao gerar relatório');
            }

            setReport(data.report);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (report) {
            navigator.clipboard.writeText(report);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const filename = `relatorio-${investigationTitle.toLowerCase().replace(/\s+/g, '-')}`;
    
    const downloadMarkdown = () => {
        if (report) {
            exportToMarkdown(report, { 
                title: investigationTitle, 
                filename 
            });
        }
    };
    
    const downloadPDF = async () => {
        if (report) {
            setExporting('pdf');
            try {
                await exportToPDF(report, { 
                    title: investigationTitle, 
                    filename,
                    date: new Date()
                });
            } catch (err) {
                console.error('Error exporting PDF:', err);
            } finally {
                setExporting(null);
            }
        }
    };
    
    const downloadDOCX = async () => {
        if (report) {
            setExporting('docx');
            try {
                await exportToDOCX(report, { 
                    title: investigationTitle, 
                    filename,
                    date: new Date()
                });
            } catch (err) {
                console.error('Error exporting DOCX:', err);
            } finally {
                setExporting(null);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
                onClick={onClose} 
            />
            <div className={`relative bg-slate-900 rounded-2xl border border-cyan-500/30 shadow-2xl w-full overflow-hidden flex flex-col transition-all ${
                report ? 'max-w-3xl max-h-[90vh]' : 'max-w-md'
            }`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-6 py-4 border-b border-cyan-500/30 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-cyan-400" />
                            Relatório de Inteligência
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">{investigationTitle}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!report && !loading && !error && (
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                            <h3 className="text-lg font-medium text-white mb-2">
                                Gerar Relatório
                            </h3>
                            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                                O relatório será gerado usando IA para analisar todas as entidades e conexões da operação.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => generateReport('summary')}
                                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white font-medium transition-colors"
                                >
                                    Relatório Executivo
                                </button>
                                <button
                                    onClick={() => generateReport('detailed')}
                                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors"
                                >
                                    Relatório Detalhado
                                </button>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-12">
                            <Loader2 className="w-12 h-12 mx-auto mb-4 text-cyan-400 animate-spin" />
                            <p className="text-slate-400">Analisando dados e gerando relatório...</p>
                            <p className="text-slate-500 text-sm mt-2">Isso pode levar alguns segundos</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-12">
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md mx-auto">
                                <p className="text-red-400 font-medium">Erro ao gerar relatório</p>
                                <p className="text-red-300/70 text-sm mt-2">{error}</p>
                                <button
                                    onClick={() => generateReport('summary')}
                                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm transition-colors"
                                >
                                    Tentar Novamente
                                </button>
                            </div>
                        </div>
                    )}

                    {report && (
                        <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-slate-300 leading-relaxed">
                            {report}
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                {report && (
                    <div className="px-6 py-4 border-t border-slate-700/50 flex justify-between items-center">
                        <div className="flex gap-2">
                            <button
                                onClick={copyToClipboard}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                        Copiado!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copiar
                                    </>
                                )}
                            </button>
                            <button
                                onClick={downloadMarkdown}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                MD
                            </button>
                            <button
                                onClick={downloadPDF}
                                disabled={exporting === 'pdf'}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                {exporting === 'pdf' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <FileDown className="w-4 h-4" />
                                )}
                                PDF
                            </button>
                            <button
                                onClick={downloadDOCX}
                                disabled={exporting === 'docx'}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                {exporting === 'docx' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <FileType className="w-4 h-4" />
                                )}
                                DOCX
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setReport(null);
                                setError(null);
                            }}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium transition-colors"
                        >
                            Gerar Novo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
