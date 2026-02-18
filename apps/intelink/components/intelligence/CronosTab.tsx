'use client';

/**
 * CronosTab - Timeline Extraction from Narrative Text
 * 
 * Extracts chronological events from BO/narrative text.
 * Unlike InvestigationTimeline (which shows system events),
 * this extracts STORY events from the document content.
 * 
 * Supports two modes:
 * 1. Text input - paste narrative text
 * 2. Operation selection - extract from existing operation documents
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
    Clock, Loader2, Calendar, AlertTriangle, 
    ArrowUpDown, Play, FileText, Sparkles, FolderOpen, ChevronDown,
    Save, CheckCircle2
} from 'lucide-react';
import { useToast } from '@/components/intelink/Toast';

interface TimelineEvent {
    date?: string;
    time?: string;
    event: string;
    location?: string;
    actors?: string[];
    confidence: number;
}

interface ExtractedTimeline {
    events: TimelineEvent[];
    summary?: string;
    date_range?: {
        start?: string;
        end?: string;
    };
}

interface Investigation {
    id: string;
    title: string;
    status: string;
}

type InputMode = 'text' | 'operation';

export default function CronosTab() {
    const [inputMode, setInputMode] = useState<InputMode>('text');
    const [text, setText] = useState('');
    const [investigations, setInvestigations] = useState<Investigation[]>([]);
    const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
    const [loadingInvestigations, setLoadingInvestigations] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedReportId, setSavedReportId] = useState<string | null>(null);
    const [timeline, setTimeline] = useState<ExtractedTimeline | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sortAsc, setSortAsc] = useState(true);
    const { showToast } = useToast();

    // Load investigations when operation mode is selected
    useEffect(() => {
        if (inputMode === 'operation' && investigations.length === 0) {
            loadInvestigations();
        }
    }, [inputMode]);

    const loadInvestigations = async () => {
        setLoadingInvestigations(true);
        try {
            const response = await fetch('/api/central');
            if (response.ok) {
                const data = await response.json();
                const allInvs: Investigation[] = [];
                if (data.investigationsByUnit) {
                    Object.values(data.investigationsByUnit).forEach((unitInvs: any) => {
                        if (Array.isArray(unitInvs)) {
                            unitInvs.forEach((inv: any) => {
                                if (!allInvs.some(i => i.id === inv.id)) {
                                    allInvs.push({ id: inv.id, title: inv.title, status: inv.status });
                                }
                            });
                        }
                    });
                }
                setInvestigations(allInvs);
            }
        } catch (err) {
            console.error('Error loading investigations:', err);
        } finally {
            setLoadingInvestigations(false);
        }
    };

    const extractTimeline = useCallback(async () => {
        // Clear previous state
        setError(null);
        
        // Validate input based on mode
        if (inputMode === 'text') {
            if (!text.trim() || text.length < 100) {
                setError('Texto muito curto. Cole um histórico de ocorrência completo.');
                return;
            }
        } else if (inputMode === 'operation') {
            if (!selectedInvestigation) {
                setError('Selecione uma operação para extrair a timeline.');
                return;
            }
        }

        setIsExtracting(true);
        setError(null);
        setTimeline(null);

        try {
            let extractedText = text;
            
            // If operation mode, fetch documents from the investigation
            if (inputMode === 'operation' && selectedInvestigation) {
                const invResponse = await fetch(`/api/investigation/${selectedInvestigation.id}`);
                if (!invResponse.ok) throw new Error('Erro ao carregar operação');
                const invData = await invResponse.json();
                
                // Combine all document narratives
                const narratives = invData.documents
                    ?.filter((d: any) => d.content || d.narrative)
                    .map((d: any) => d.content || d.narrative)
                    .join('\n\n---\n\n');
                
                if (!narratives || narratives.length < 50) {
                    setError('A operação não possui documentos com narrativas para extrair timeline.');
                    setIsExtracting(false);
                    return;
                }
                extractedText = narratives;
            }

            // Use the extract API which already extracts timeline
            const response = await fetch('/api/documents/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: extractedText,
                    document_type: 'REDS',
                    extract_timeline: true
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao extrair timeline');
            }

            const data = await response.json();
            const events = data.result?.timeline || [];
            
            // If no timeline extracted, try to parse from narrative
            if (events.length === 0) {
                setError('Nenhum evento com data/hora encontrado no texto. Tente um texto mais detalhado.');
                return;
            }

            setTimeline({
                events: events.map((e: any, idx: number) => ({
                    date: e.date || e.data,
                    time: e.time || e.hora,
                    event: e.event || e.evento || e.description,
                    location: e.location || e.local,
                    actors: e.actors || e.envolvidos,
                    confidence: e.confidence || 0.8
                })),
                summary: data.result?.summary,
                date_range: {
                    start: events[0]?.date,
                    end: events[events.length - 1]?.date
                }
            });
        } catch (err: any) {
            setError(err.message || 'Erro ao processar texto');
        } finally {
            setIsExtracting(false);
        }
    }, [text, inputMode, selectedInvestigation]);

    const sortedEvents = timeline?.events ? 
        [...timeline.events].sort((a, b) => {
            const dateA = new Date(`${a.date || '2000-01-01'} ${a.time || '00:00'}`);
            const dateB = new Date(`${b.date || '2000-01-01'} ${b.time || '00:00'}`);
            return sortAsc ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        }) : [];

    // Save timeline to intelink_reports
    const saveTimeline = async () => {
        if (!timeline || !selectedInvestigation) {
            showToast('warning', 'Selecione uma operação', 'Selecione uma operação para salvar a timeline');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_type: 'cronologia',
                    investigation_id: selectedInvestigation.id,
                    title: `Timeline - ${selectedInvestigation.title}`,
                    content: JSON.stringify(timeline),
                    summary: timeline.summary || `${timeline.events.length} eventos extraídos`
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao salvar timeline');
            }

            const data = await response.json();
            setSavedReportId(data.id);
            showToast('success', 'Timeline Salva', `${timeline.events.length} eventos salvos na operação`);
        } catch (err: any) {
            showToast('error', 'Erro', err.message || 'Erro ao salvar');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    Cronos - Extrator de Timeline
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Extraia a linha do tempo dos eventos de um texto ou operação existente
                </p>
            </div>

            {/* Mode Selector */}
            <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg">
                <button
                    onClick={() => setInputMode('text')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        inputMode === 'text' 
                            ? 'bg-indigo-600 text-white' 
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    Texto Livre
                </button>
                <button
                    onClick={() => setInputMode('operation')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        inputMode === 'operation' 
                            ? 'bg-indigo-600 text-white' 
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <FolderOpen className="w-4 h-4" />
                    Selecionar Operação
                </button>
            </div>

            {/* Input Area - Text Mode */}
            {inputMode === 'text' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-300">
                            <FileText className="w-4 h-4 inline mr-2" />
                            Texto da Ocorrência
                        </label>
                        <span className="text-xs text-slate-500">
                            {text.length} caracteres
                        </span>
                    </div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Cole aqui o histórico completo da ocorrência (REDS, BO, relatório)...

Exemplo:
'No dia 15/12/2024, por volta das 14h30, a equipe policial foi acionada via COPOM para atender uma ocorrência de roubo na Rua das Flores, 123. Ao chegar no local às 14h45, a vítima MARIA DAS DORES relatou que às 14h15 foi abordada por dois indivíduos em uma motocicleta Honda CG vermelha...'"
                        className="w-full h-64 p-4 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-600"
                    />
                </div>
            )}

            {/* Input Area - Operation Mode */}
            {inputMode === 'operation' && (
                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">
                        <FolderOpen className="w-4 h-4 inline mr-2" />
                        Selecione uma Operação
                    </label>
                    {loadingInvestigations ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                        </div>
                    ) : (
                        <div className="relative">
                            <select
                                value={selectedInvestigation?.id || ''}
                                onChange={(e) => {
                                    const inv = investigations.find(i => i.id === e.target.value);
                                    setSelectedInvestigation(inv || null);
                                }}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent [&>option]:bg-slate-800 [&>option]:text-white"
                            >
                                <option value="" className="bg-slate-800 text-slate-400">Selecione uma operação...</option>
                                {investigations.map(inv => (
                                    <option key={inv.id} value={inv.id} className="bg-slate-800 text-white">
                                        {inv.title} ({inv.status === 'active' ? 'Em andamento' : inv.status})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                    )}
                    {selectedInvestigation && (
                        <p className="text-xs text-slate-500">
                            A timeline será extraída de todos os documentos da operação "{selectedInvestigation.title}"
                        </p>
                    )}
                </div>
            )}

            {/* Extract Button */}
            <button
                onClick={extractTimeline}
                disabled={isExtracting || (inputMode === 'text' && text.length < 100) || (inputMode === 'operation' && !selectedInvestigation)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium transition-colors"
            >
                {isExtracting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Extraindo eventos...
                    </>
                ) : (
                    <>
                        <Play className="w-5 h-5" />
                        Extrair Timeline
                    </>
                )}
            </button>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Results */}
            {timeline && timeline.events.length > 0 && (
                <div className="space-y-4">
                    {/* Summary */}
                    {timeline.summary && (
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm font-medium text-indigo-400">Resumo</span>
                            </div>
                            <p className="text-slate-300 text-sm">{timeline.summary}</p>
                        </div>
                    )}

                    {/* Stats + Actions */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-400">
                                <strong className="text-white">{timeline.events.length}</strong> eventos encontrados
                            </span>
                            {timeline.date_range?.start && timeline.date_range?.end && (
                                <span className="text-xs text-slate-500">
                                    {timeline.date_range.start} → {timeline.date_range.end}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Save Button */}
                            {inputMode === 'operation' && selectedInvestigation && (
                                <button
                                    onClick={saveTimeline}
                                    disabled={isSaving || !!savedReportId}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        savedReportId 
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                    }`}
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : savedReportId ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {savedReportId ? 'Salvo' : 'Salvar na Operação'}
                                </button>
                            )}
                            {/* Sort Button */}
                            <button
                                onClick={() => setSortAsc(!sortAsc)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                            >
                                <ArrowUpDown className="w-4 h-4" />
                                {sortAsc ? 'Mais antigo primeiro' : 'Mais recente primeiro'}
                            </button>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700" />

                        <div className="space-y-4">
                            {sortedEvents.map((event, idx) => (
                                <div key={idx} className="relative flex gap-4">
                                    {/* Node */}
                                    <div className="relative z-10 w-12 flex items-center justify-center">
                                        <div className="w-4 h-4 bg-indigo-500 border-4 border-slate-900 rounded-full" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pb-4">
                                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-indigo-500/30 transition-colors">
                                            {/* Date/Time */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className="w-4 h-4 text-indigo-400" />
                                                <span className="text-sm font-medium text-indigo-400">
                                                    {event.date || 'Data não especificada'}
                                                    {event.time && ` às ${event.time}`}
                                                </span>
                                            </div>

                                            {/* Event description */}
                                            <p className="text-slate-300 text-sm leading-relaxed">
                                                {event.event}
                                            </p>

                                            {/* Metadata */}
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {event.location && (
                                                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-400">
                                                        📍 {event.location}
                                                    </span>
                                                )}
                                                {event.actors && event.actors.length > 0 && (
                                                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-400">
                                                        👥 {event.actors.join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state after extraction */}
            {timeline && timeline.events.length === 0 && (
                <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Nenhum evento com data/hora encontrado</p>
                    <p className="text-slate-500 text-sm mt-1">
                        O texto pode não conter referências temporais suficientes
                    </p>
                </div>
            )}
        </div>
    );
}
