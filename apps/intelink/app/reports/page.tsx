'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
    FileText, Download, ArrowLeft, Search, Loader2, Eye, X, Copy,
    FileCheck, Users, Shield, CalendarClock, Share2, Target,
    AlertTriangle, Clock, History, ChevronRight, ChevronDown, Car, User, MapPin, Check
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
// jsPDF loaded dynamically to reduce initial bundle size (~300KB)
import { getSupabaseClient } from '@/lib/supabase-client';
import EntityDetailModal from '@/components/shared/EntityDetailModal';
import { Investigation, Entity, GeneratedReport } from '@/components/reports';

const supabase = getSupabaseClient();

// Loading fallback
function ReportsLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="text-slate-400">Carregando...</p>
            </div>
        </div>
    );
}

export default function ReportsPage() {
    return (
        <Suspense fallback={<ReportsLoading />}>
            <ReportsContent />
        </Suspense>
    );
}

function ReportsContent() {
    const searchParams = useSearchParams();
    const preSelectedInvId = searchParams.get('investigation');
    
    const [investigations, setInvestigations] = useState<Investigation[]>([]);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [recentReports, setRecentReports] = useState<GeneratedReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);
    
    // Selected states
    const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
    const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]); // Multi-entity selection
    const [entitySearch, setEntitySearch] = useState('');
    const [includeDrafts, setIncludeDrafts] = useState(false);
    
    // Preview modal
    const [preview, setPreview] = useState<{ content: string; title: string } | null>(null);
    
    // Entity preview modal (for confirmation before selection)
    const [entityPreview, setEntityPreview] = useState<Entity | null>(null);
    
    // Multi-entity dossiê state
    const [multiDossieResults, setMultiDossieResults] = useState<{ entityId: string; entityName: string; report: string; selected: boolean }[]>([]);
    const [unifiedDossie, setUnifiedDossie] = useState<string | null>(null);
    
    // Report sections configuration
    const [showSectionsConfig, setShowSectionsConfig] = useState(false);
    const [reportSections, setReportSections] = useState({
        summary: true,           // Resumo Executivo
        entities: true,          // Entidades Envolvidas
        timeline: true,          // Cronologia dos Fatos
        relationships: true,     // Vínculos e Conexões
        documents: true,         // Documentos Analisados
        legalAnalysis: true,     // Análise Jurídica
        insights: true,          // Insights da IA
        recommendations: true,   // Recomendações
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (preSelectedInvId && investigations.length > 0) {
            const inv = investigations.find(i => i.id === preSelectedInvId);
            if (inv) setSelectedInvestigation(inv);
        }
    }, [preSelectedInvId, investigations]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load investigations via API (bypasses RLS)
            const invResponse = await fetch('/api/central');
            if (invResponse.ok) {
                const invJson = await invResponse.json();
                // Flatten investigationsByUnit into a single array
                const allInvestigations: Investigation[] = [];
                if (invJson.investigationsByUnit) {
                    Object.values(invJson.investigationsByUnit).forEach((unitInvs: any) => {
                        if (Array.isArray(unitInvs)) {
                            unitInvs.forEach((inv: any) => {
                                if (!allInvestigations.some(i => i.id === inv.id)) {
                                    allInvestigations.push(inv);
                                }
                            });
                        }
                    });
                }
                // Sort by updated_at descending
                allInvestigations.sort((a, b) => 
                    new Date(b.updated_at || b.created_at || 0).getTime() - 
                    new Date(a.updated_at || a.created_at || 0).getTime()
                );
                setInvestigations(allInvestigations);
            }

            // Load entities via Supabase if available, otherwise skip
            if (supabase) {
                const { data: entData } = await supabase
                    .from('intelink_entities')
                    .select('id, name, type, investigation_id, investigation:intelink_investigations(title)')
                    .in('type', ['PERSON', 'VEHICLE'])
                    .order('name')
                    .limit(100);
                
                setEntities(entData || []);
            }

            // Load recent reports from Supabase (with localStorage fallback)
            if (supabase) {
                const { data: reportsData } = await supabase
                    .from('intelink_reports')
                    .select('id, report_type, title, content, created_at')
                    .order('created_at', { ascending: false })
                    .limit(10);
                
                if (reportsData && reportsData.length > 0) {
                    setRecentReports(reportsData.map(r => ({
                        id: r.id,
                        type: r.report_type,
                        title: r.title,
                        content: r.content,
                        created_at: r.created_at,
                    })));
                } else {
                    // Fallback to localStorage
                    const stored = localStorage.getItem('intelink_recent_reports');
                    if (stored) {
                        setRecentReports(JSON.parse(stored).slice(0, 10));
                    }
                }
            } else {
                const stored = localStorage.getItem('intelink_recent_reports');
                if (stored) {
                    setRecentReports(JSON.parse(stored).slice(0, 10));
                }
            }

        } catch (e) {
            console.error('Error loading data:', e);
        } finally {
            setLoading(false);
        }
    };

    // Search entities via API (same as global search)
    const [searchResults, setSearchResults] = useState<Entity[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    useEffect(() => {
        const searchEntities = async () => {
            if (entitySearch.length < 2) {
                setSearchResults([]);
                return;
            }
            
            setIsSearching(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(entitySearch)}`);
                if (res.ok) {
                    const data = await res.json();
                    // Filter to only PERSON and VEHICLE
                    const filtered = (data.results || [])
                        .filter((r: any) => r.type === 'person' || r.type === 'vehicle')
                        .slice(0, 10)
                        .map((r: any) => ({
                            id: r.id,
                            name: r.title || r.name,
                            type: r.type.toUpperCase(),
                            investigation_id: r.investigation_id,
                        }));
                    setSearchResults(filtered);
                }
            } catch (e) {
                console.error('Search error:', e);
            } finally {
                setIsSearching(false);
            }
        };
        
        const debounce = setTimeout(searchEntities, 300);
        return () => clearTimeout(debounce);
    }, [entitySearch]);
    
    // Fallback to local filter if API search returns nothing
    const filteredEntities = searchResults.length > 0 
        ? searchResults 
        : entitySearch.length >= 2 
            ? entities.filter(e => 
                e.name.toLowerCase().includes(entitySearch.toLowerCase())
              ).slice(0, 10)
            : [];

    // Generate operation report
    const generateOperationReport = async (type: string) => {
        if (!selectedInvestigation) return;
        
        setGenerating(type);
        try {
            const res = await fetch('/api/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    investigation_id: selectedInvestigation.id,
                    type,
                    include_drafts: includeDrafts,
                    sections: reportSections, // Pass selected sections
                }),
            });

            const data = await res.json();
            
            if (data.report) {
                setPreview({ content: data.report, title: `${type.toUpperCase()} - ${selectedInvestigation.title}` });
                
                // Save to recent reports
                saveToRecentReports({
                    id: Date.now().toString(),
                    type,
                    title: selectedInvestigation.title,
                    created_at: new Date().toISOString(),
                    content: data.report,
                });
            }
        } catch (e) {
            console.error('Error generating report:', e);
        } finally {
            setGenerating(null);
        }
    };

    // Generate dossiê for single or multiple entities
    const generateDossie = async () => {
        if (selectedEntities.length === 0) return;
        
        setGenerating('dossie');
        setMultiDossieResults([]);
        setUnifiedDossie(null);
        
        try {
            // Generate individual dossiers for each entity
            const individualResults: { entityId: string; entityName: string; report: string; selected: boolean }[] = [];
            
            for (const entity of selectedEntities) {
                const res = await fetch('/api/reports/entity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        entity_id: entity.id,
                        type: 'dossie',
                    }),
                });
                
                const data = await res.json();
                if (data.report) {
                    individualResults.push({
                        entityId: entity.id,
                        entityName: entity.name,
                        report: data.report,
                        selected: true,
                    });
                }
            }
            
            setMultiDossieResults(individualResults);
            
            // If multiple entities, generate unified analysis
            if (selectedEntities.length > 1 && individualResults.length > 1) {
                const unifiedRes = await fetch('/api/reports/entity/unified', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        entity_ids: selectedEntities.map(e => e.id),
                        individual_reports: individualResults.map(r => ({ name: r.entityName, report: r.report })),
                    }),
                });
                
                const unifiedData = await unifiedRes.json();
                if (unifiedData.report) {
                    setUnifiedDossie(unifiedData.report);
                }
            }
            
            // Show first result as preview (or unified if available)
            if (individualResults.length === 1) {
                setPreview({ content: individualResults[0].report, title: `DOSSIÊ - ${individualResults[0].entityName}` });
            } else if (individualResults.length > 1) {
                // Show multi-dossie results modal instead of single preview
                // The UI will handle showing the results grid
            }
            
            // Save to recent reports
            if (individualResults.length === 1) {
                saveToRecentReports({
                    id: Date.now().toString(),
                    type: 'dossie',
                    title: selectedEntities[0].name,
                    target_name: selectedEntities[0].name,
                    created_at: new Date().toISOString(),
                    content: individualResults[0].report,
                });
            } else if (individualResults.length > 1) {
                saveToRecentReports({
                    id: Date.now().toString(),
                    type: 'dossie_integrado',
                    title: `Dossiê Integrado (${selectedEntities.length} alvos)`,
                    target_name: selectedEntities.map(e => e.name).join(', '),
                    created_at: new Date().toISOString(),
                    content: unifiedDossie || individualResults.map(r => r.report).join('\n\n---\n\n'),
                });
            }
        } catch (e) {
            console.error('Error generating dossie:', e);
        } finally {
            setGenerating(null);
        }
    };

    // Generate risk analysis for selected entities
    const generateRiskAnalysis = async () => {
        if (selectedEntities.length === 0) return;
        
        setGenerating('risco');
        try {
            // For risk, just use first selected entity for now
            const res = await fetch('/api/reports/entity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entity_id: selectedEntities[0].id,
                    type: 'risco',
                }),
            });

            const data = await res.json();
            
            if (data.report) {
                setPreview({ content: data.report, title: `ANÁLISE DE RISCO - ${selectedEntities[0].name}` });
                
                saveToRecentReports({
                    id: Date.now().toString(),
                    type: 'risco',
                    title: selectedEntities[0].name,
                    target_name: selectedEntities[0].name,
                    created_at: new Date().toISOString(),
                    content: data.report,
                });
            }
        } catch (e) {
            console.error('Error generating risk analysis:', e);
        } finally {
            setGenerating(null);
        }
    };

    const saveToRecentReports = async (report: GeneratedReport) => {
        // Update local state immediately
        const updated = [report, ...recentReports.filter(r => r.id !== report.id)].slice(0, 10);
        setRecentReports(updated);
        
        // Save to Supabase
        if (supabase) {
            const memberId = localStorage.getItem('intelink_member_id');
            try {
                await supabase.from('intelink_reports').insert({
                    report_type: report.type,
                    investigation_id: selectedInvestigation?.id || null,
                    entity_id: selectedEntities[0]?.id || null,
                    title: report.title,
                    content: report.content || '',
                    summary: report.content?.substring(0, 500) || '',
                    created_by: memberId && memberId !== 'anonymous' ? memberId : null,
                    status: 'final',
                });
            } catch (e) {
                console.warn('Failed to save report to DB, using localStorage fallback');
                localStorage.setItem('intelink_recent_reports', JSON.stringify(updated));
            }
        } else {
            localStorage.setItem('intelink_recent_reports', JSON.stringify(updated));
        }
    };

    const downloadReport = async (content: string, title: string, format: 'txt' | 'md' | 'pdf' | 'docx') => {
        const filename = title.replace(/\s+/g, '_');
        
        if (format === 'pdf') {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            const lines = doc.splitTextToSize(content, 180);
            doc.setFontSize(10);
            doc.text(lines, 15, 15);
            doc.save(`${filename}.pdf`);
        } else if (format === 'docx') {
            const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
            
            // Parse content into paragraphs
            const paragraphs = content.split('\n').map(line => {
                // Check if it's a header line
                if (line.startsWith('═') || line.startsWith('─')) {
                    return new Paragraph({ text: '' });
                }
                if (line.includes('DOSSIÊ') || line.includes('ANÁLISE')) {
                    return new Paragraph({
                        text: line.trim(),
                        heading: HeadingLevel.HEADING_1,
                        spacing: { after: 200 },
                    });
                }
                if (line.match(/^\d+\.\s+/)) {
                    return new Paragraph({
                        text: line.trim(),
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 100 },
                    });
                }
                return new Paragraph({
                    children: [new TextRun({ text: line })],
                    spacing: { after: 100 },
                });
            });
            
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: paragraphs,
                }],
            });
            
            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.docx`;
            a.click();
        } else {
            const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.${format}`;
            a.click();
        }
    };
    
    const copyToClipboard = async (content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            // Could add a toast notification here
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    };

    const getEntityIcon = (type: string) => {
        switch (type) {
            case 'PERSON': return User;
            case 'VEHICLE': return Car;
            case 'LOCATION': return MapPin;
            default: return User;
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {/* Header - Limpo e Direto */}
                <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
                    <div className="w-full px-4 md:px-6 py-3">
                        <div className="flex items-center gap-3">
                            <Link 
                                href="/" 
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-400" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                </div>
                                <h1 className="text-xl font-bold text-white">Relatórios</h1>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="w-full px-4 md:px-6 py-6">
                    {/* Grid Principal - 2 Colunas em Desktop */}
                    <div className="grid lg:grid-cols-2 gap-6 mb-6">
                        
                        {/* ÁREA 1: Documentação do Caso (Contexto Macro) */}
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-700/50">
                                <h2 className="font-semibold text-white flex items-center gap-2">
                                    <FileCheck className="w-5 h-5 text-blue-400" />
                                    Documentação do Caso
                                </h2>
                                <p className="text-sm text-slate-400 mt-1">Relatórios que analisam a operação como um todo</p>
                            </div>
                            
                            {/* Seletor de Operação */}
                            <div className="px-5 py-4 border-b border-slate-700/30 bg-slate-800/30">
                                <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">Operação</label>
                                <select
                                    value={selectedInvestigation?.id || ''}
                                    onChange={(e) => {
                                        const inv = investigations.find(i => i.id === e.target.value);
                                        setSelectedInvestigation(inv || null);
                                    }}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">Selecione uma operação...</option>
                                    {investigations.map(inv => (
                                        <option key={inv.id} value={inv.id}>{inv.title}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Relatório Completo com Seções Configuráveis */}
                            <div className="p-4 space-y-3">
                                {/* Botão principal */}
                                <button
                                    onClick={() => generateOperationReport('full_investigation')}
                                    disabled={!selectedInvestigation || generating === 'full_investigation'}
                                    className="w-full h-24 flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-left transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        {generating === 'full_investigation' ? (
                                            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                                        ) : (
                                            <FileText className="w-6 h-6 text-blue-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-white">Relatório Completo</span>
                                            <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">RELINT</span>
                                        </div>
                                        <p className="text-sm text-slate-400 truncate">
                                            {Object.values(reportSections).filter(Boolean).length} de 8 seções selecionadas
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                </button>
                                
                                {/* Botão para configurar seções */}
                                <button
                                    onClick={() => setShowSectionsConfig(!showSectionsConfig)}
                                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    <span>⚙️ Personalizar seções do relatório</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showSectionsConfig ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {/* Painel de Configuração de Seções */}
                                {showSectionsConfig && (
                                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide">Seções incluídas</p>
                                            <button
                                                onClick={() => {
                                                    const allSelected = Object.values(reportSections).every(Boolean);
                                                    setReportSections({
                                                        summary: !allSelected,
                                                        entities: !allSelected,
                                                        timeline: !allSelected,
                                                        relationships: !allSelected,
                                                        documents: !allSelected,
                                                        legalAnalysis: !allSelected,
                                                        insights: !allSelected,
                                                        recommendations: !allSelected,
                                                    });
                                                }}
                                                className="text-xs text-blue-400 hover:text-blue-300"
                                            >
                                                {Object.values(reportSections).every(Boolean) ? 'Desmarcar todas' : 'Marcar todas'}
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { key: 'summary', label: 'Resumo Executivo', desc: 'Visão geral do caso' },
                                                { key: 'entities', label: 'Entidades', desc: 'Pessoas, veículos, locais' },
                                                { key: 'timeline', label: 'Cronologia', desc: 'Linha do tempo dos fatos' },
                                                { key: 'relationships', label: 'Vínculos', desc: 'Conexões entre entidades' },
                                                { key: 'documents', label: 'Documentos', desc: 'BOs e relatórios analisados' },
                                                { key: 'legalAnalysis', label: 'Análise Jurídica', desc: 'Tipificação penal' },
                                                { key: 'insights', label: 'Insights IA', desc: 'Padrões identificados' },
                                                { key: 'recommendations', label: 'Recomendações', desc: 'Próximos passos' },
                                            ].map(({ key, label, desc }) => (
                                                <label
                                                    key={key}
                                                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                                        reportSections[key as keyof typeof reportSections]
                                                            ? 'bg-blue-500/10 border border-blue-500/30'
                                                            : 'bg-slate-800/50 border border-slate-700/30 hover:border-slate-600'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={reportSections[key as keyof typeof reportSections]}
                                                        onChange={(e) => setReportSections(prev => ({
                                                            ...prev,
                                                            [key]: e.target.checked
                                                        }))}
                                                        className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{label}</p>
                                                        <p className="text-xs text-slate-500">{desc}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ÁREA 2: Dossiês (Individual ou Integrado) */}
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-700/50">
                                <h2 className="font-semibold text-white flex items-center gap-2">
                                    <Target className="w-5 h-5 text-amber-400" />
                                    Dossiês
                                </h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    Selecione uma ou mais entidades (pessoas, veículos, locais). 
                                    <span className="text-amber-400/80"> Para múltiplas, gera dossiês individuais + análise de vínculos integrada.</span>
                                </p>
                            </div>
                            
                            {/* Busca de Alvo - Using Global Search API */}
                            <div className="px-5 py-4 border-b border-slate-700/30 bg-slate-800/30">
                                <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">Buscar Alvo</label>
                                <div className="relative">
                                    {isSearching ? (
                                        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 animate-spin" />
                                    ) : (
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    )}
                                    <input
                                        type="text"
                                        value={entitySearch}
                                        onChange={(e) => setEntitySearch(e.target.value)}
                                        placeholder="Buscar e adicionar entidades..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                                    />
                                    
                                    {/* Autocomplete Dropdown */}
                                    {filteredEntities.length > 0 && entitySearch.length >= 2 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                                            {filteredEntities
                                                .filter(e => !selectedEntities.some(s => s.id === e.id))
                                                .map(entity => {
                                                const Icon = getEntityIcon(entity.type);
                                                return (
                                                    <div
                                                        key={entity.id}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800"
                                                    >
                                                        <Icon className="w-4 h-4 text-slate-400" />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-white">{entity.name}</span>
                                                            <span className="text-xs text-slate-500 ml-2">
                                                                {entity.type === 'PERSON' ? 'Pessoa' : entity.type === 'VEHICLE' ? 'Veículo' : 'Local'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => setEntityPreview(entity)}
                                                                className="p-1.5 hover:bg-slate-700 rounded text-blue-400 hover:text-blue-300"
                                                                title="Ver detalhes"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedEntities([...selectedEntities, entity]);
                                                                    setEntitySearch('');
                                                                }}
                                                                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs rounded font-medium"
                                                            >
                                                                + Adicionar
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Selected Entities Chips */}
                                {selectedEntities.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedEntities.map(entity => {
                                            const Icon = getEntityIcon(entity.type);
                                            return (
                                                <div 
                                                    key={entity.id}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg"
                                                >
                                                    <Icon className="w-4 h-4 text-amber-400" />
                                                    <span className="text-amber-300 text-sm font-medium">{entity.name}</span>
                                                    <button 
                                                        onClick={() => setSelectedEntities(selectedEntities.filter(e => e.id !== entity.id))}
                                                        className="p-0.5 hover:bg-slate-700 rounded"
                                                    >
                                                        <X className="w-3 h-3 text-slate-400" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {selectedEntities.length > 1 && (
                                            <button 
                                                onClick={() => setSelectedEntities([])}
                                                className="text-xs text-slate-500 hover:text-slate-400 ml-2"
                                            >
                                                Limpar todos
                                            </button>
                                        )}
                                    </div>
                                )}
                                
                                {selectedEntities.length > 1 && (
                                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                                        <span>✓</span>
                                        Dossiê Integrado: {selectedEntities.length} alvos selecionados - incluirá análise de vínculos entre todos
                                    </p>
                                )}
                            </div>

                            {/* Cards de Relatório de Alvo */}
                            <div className="p-4 space-y-3">
                                {/* Dossiê Button */}
                                <button
                                    onClick={generateDossie}
                                    disabled={selectedEntities.length === 0 || generating === 'dossie'}
                                    className="w-full h-24 flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        {generating === 'dossie' ? (
                                            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                                        ) : (
                                            <User className="w-6 h-6 text-amber-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-white">
                                                {selectedEntities.length > 1 ? 'Dossiê Integrado' : 'Dossiê Completo'}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded">
                                                {selectedEntities.length > 1 ? `${selectedEntities.length} Alvos` : 'Ficha do Alvo'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 truncate">
                                            {selectedEntities.length > 1 
                                                ? 'Dossiês individuais + análise de vínculos cruzados'
                                                : 'Dados cadastrais, vínculos e antecedentes'}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                </button>
                                
                                {/* Análise de Risco Button */}
                                <button
                                    onClick={generateRiskAnalysis}
                                    disabled={selectedEntities.length === 0 || generating === 'risco'}
                                    className="w-full h-24 flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-left transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        {generating === 'risco' ? (
                                            <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
                                        ) : (
                                            <AlertTriangle className="w-6 h-6 text-red-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-white">Análise de Risco</span>
                                            <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 rounded">Periculosidade</span>
                                        </div>
                                        <p className="text-sm text-slate-400 truncate">Score de risco, fatores e recomendações</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ÁREA 3: Histórico Recente */}
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <History className="w-5 h-5 text-slate-400" />
                                Histórico Recente
                            </h2>
                            {recentReports.length > 0 && (
                                <button 
                                    onClick={() => {
                                        localStorage.removeItem('intelink_recent_reports');
                                        setRecentReports([]);
                                    }}
                                    className="text-xs text-slate-500 hover:text-slate-300"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>
                        
                        <div className="divide-y divide-slate-700/30">
                            {recentReports.length === 0 ? (
                                <div className="px-5 py-8 text-center text-slate-500 text-sm">
                                    Nenhum relatório gerado recentemente
                                </div>
                            ) : (
                                recentReports.map(report => (
                                    <div key={report.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/30">
                                        <div className="p-2 bg-slate-700/50 rounded-lg">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {report.type.toUpperCase()}: {report.title}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(report.created_at).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                        {report.content && (
                                            <button
                                                onClick={() => setPreview({ content: report.content!, title: report.title })}
                                                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300"
                                            >
                                                <Eye className="w-3 h-3 inline mr-1" />
                                                Ver
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Preview Modal */}
            {preview && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="font-semibold text-white">{preview.title}</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => copyToClipboard(preview.content)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm text-white flex items-center gap-1"
                                    title="Copiar texto"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copiar
                                </button>
                                <button
                                    onClick={() => downloadReport(preview.content, preview.title, 'txt')}
                                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white flex items-center gap-1"
                                >
                                    <Download className="w-4 h-4" />
                                    TXT
                                </button>
                                <button
                                    onClick={() => downloadReport(preview.content, preview.title, 'md')}
                                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white flex items-center gap-1"
                                >
                                    <Download className="w-4 h-4" />
                                    MD
                                </button>
                                <button
                                    onClick={() => downloadReport(preview.content, preview.title, 'docx')}
                                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm text-white flex items-center gap-1"
                                >
                                    <Download className="w-4 h-4" />
                                    DOCX
                                </button>
                                <button
                                    onClick={() => downloadReport(preview.content, preview.title, 'pdf')}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white flex items-center gap-1"
                                >
                                    <Download className="w-4 h-4" />
                                    PDF
                                </button>
                                <button
                                    onClick={() => setPreview(null)}
                                    className="p-2 hover:bg-slate-700 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono">
                                {preview.content}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Entity Preview Modal */}
            {entityPreview && (
                <EntityDetailModal
                    isOpen={!!entityPreview}
                    onClose={() => setEntityPreview(null)}
                    entityId={entityPreview.id}
                    entityName={entityPreview.name}
                    entityType={entityPreview.type}
                    investigationId={entityPreview.investigation_id}
                />
            )}
        </div>
    );
}
