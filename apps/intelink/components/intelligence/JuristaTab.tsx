'use client';

/**
 * JuristaTab - Análise Jurídica com IA
 * 
 * Cole um BO ou texto e receba análise de:
 * - Crimes tipificados
 * - Situação de flagrante
 * - Crimes conexos
 * - Providências recomendadas
 * 
 * Supports two modes:
 * 1. Text input - paste narrative text
 * 2. Operation selection - analyze existing operation documents
 * 
 * DISCLAIMER: Para efeito de síntese/estudo. Decisão final é do Delegado/Promotor/Juiz.
 */

import React, { useState, useEffect } from 'react';
import { 
    Scale, 
    Loader2, 
    AlertTriangle, 
    CheckCircle2, 
    FileText,
    Gavel,
    Link2,
    ClipboardList,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    FolderOpen,
    Info
} from 'lucide-react';

interface JuristaCrime {
    crime: string;
    tipificacao: string;
    qualificadoras: string[];
    pena_base: string;
    evidencias_no_texto: string;
}

interface JuristaResult {
    crimes: JuristaCrime[];
    flagrante: {
        existe: boolean;
        tipo: string;
        fundamento: string;
        justificativa: string;
    };
    conexao: {
        existe: boolean;
        tipo: string;
        crimes_conexos: string[];
    };
    providencias: Array<{
        acao: string;
        fundamento: string;
        prioridade: 'alta' | 'media' | 'baixa';
    }>;
    alertas: Array<{
        tipo: string;
        mensagem: string;
    }>;
    resumo_executivo: string;
    confianca: number;
}

interface Investigation {
    id: string;
    title: string;
    status: string;
}

type InputMode = 'text' | 'operation';

export default function JuristaTab() {
    const [inputMode, setInputMode] = useState<InputMode>('text');
    const [text, setText] = useState('');
    const [investigations, setInvestigations] = useState<Investigation[]>([]);
    const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
    const [loadingInvestigations, setLoadingInvestigations] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<JuristaResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedCrime, setExpandedCrime] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);

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

    const handleAnalyze = async () => {
        // Validate input based on mode
        if (inputMode === 'text' && text.length < 100) {
            setError('Texto muito curto. Forneça pelo menos 100 caracteres.');
            return;
        }
        if (inputMode === 'operation' && !selectedInvestigation) {
            setError('Selecione uma operação para analisar.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setResult(null);

        try {
            let analysisText = text;
            
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
                    setError('A operação não possui documentos com narrativas para analisar.');
                    setIsAnalyzing(false);
                    return;
                }
                analysisText = narratives;
            }

            const response = await fetch('/api/intelligence/jurista', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: analysisText })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro na análise');
            }

            setResult(data.analysis);
        } catch (err: any) {
            setError(err.message || 'Erro desconhecido');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCopyReport = () => {
        if (!result) return;
        
        const report = `
ANÁLISE JURÍDICA - INTELINK
============================

RESUMO EXECUTIVO:
${result.resumo_executivo}

CRIMES IDENTIFICADOS:
${result.crimes.map((c, i) => `
${i + 1}. ${c.crime}
   Tipificação: ${c.tipificacao}
   Pena base: ${c.pena_base}
   ${c.qualificadoras.length > 0 ? `Qualificadoras: ${c.qualificadoras.join(', ')}` : ''}
`).join('\n')}

FLAGRANTE:
${result.flagrante.existe ? `SIM - ${result.flagrante.tipo.toUpperCase()}` : 'NÃO'}
${result.flagrante.fundamento}
${result.flagrante.justificativa}

${result.conexao.existe ? `CONEXÃO:
Tipo: ${result.conexao.tipo}
Crimes conexos: ${result.conexao.crimes_conexos.join(', ')}
` : ''}

PROVIDÊNCIAS RECOMENDADAS:
${result.providencias.map(p => `- [${p.prioridade.toUpperCase()}] ${p.acao}`).join('\n')}

Confiança da análise: ${Math.round(result.confianca * 100)}%
        `.trim();
        
        navigator.clipboard.writeText(report);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'alta': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'media': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'baixa': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Scale className="w-6 h-6 text-amber-400" />
                    <div>
                        <h2 className="text-lg font-semibold text-white">Jurista IA</h2>
                        <p className="text-sm text-slate-400">Análise jurídica de textos policiais</p>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="flex items-start gap-3 p-3 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-200 text-sm">
                        <strong>Aviso:</strong> Esta análise é para efeito de síntese e estudo. 
                        A decisão final compete ao Delegado de Polícia, Promotor de Justiça e Juiz durante a fase processual.
                    </p>
                </div>

                {/* Mode Selector */}
                <div className="flex gap-2 p-1 mb-4 bg-slate-800/50 rounded-lg">
                    <button
                        onClick={() => setInputMode('text')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            inputMode === 'text' 
                                ? 'bg-amber-600 text-white' 
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
                                ? 'bg-amber-600 text-white' 
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <FolderOpen className="w-4 h-4" />
                        Selecionar Operação
                    </button>
                </div>

                {/* Text Input Mode */}
                {inputMode === 'text' && (
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Cole aqui o texto do BO, depoimento ou narrativa para análise jurídica...

Exemplo: O autor, usando de arma de fogo, abordou a vítima no centro da cidade às 22h, subtraindo seu celular e carteira. A vítima conseguiu acionar a PM que localizou o autor ainda na posse dos bens..."
                        className="w-full h-48 p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    />
                )}

                {/* Operation Selection Mode */}
                {inputMode === 'operation' && (
                    <div className="space-y-3">
                        {loadingInvestigations ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                            </div>
                        ) : (
                            <div className="relative">
                                <select
                                    value={selectedInvestigation?.id || ''}
                                    onChange={(e) => {
                                        const inv = investigations.find(i => i.id === e.target.value);
                                        setSelectedInvestigation(inv || null);
                                    }}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent [&>option]:bg-slate-800 [&>option]:text-white"
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
                                A análise jurídica será feita sobre todos os documentos da operação "{selectedInvestigation.title}"
                            </p>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-slate-500">
                        {inputMode === 'text' && (
                            <>{text.length} caracteres {text.length < 100 && text.length > 0 && '(mínimo 100)'}</>
                        )}
                        {inputMode === 'operation' && selectedInvestigation && (
                            <>Operação selecionada: {selectedInvestigation.title}</>
                        )}
                    </span>
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || (inputMode === 'text' && text.length < 100) || (inputMode === 'operation' && !selectedInvestigation)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-medium transition-colors"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analisando...
                            </>
                        ) : (
                            <>
                                <Gavel className="w-4 h-4" />
                                Analisar Juridicamente
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                        <p className="text-red-300">{error}</p>
                    </div>
                )}
            </div>

            {/* Results Section */}
            {result && (
                <div className="space-y-4">
                    {/* Executive Summary */}
                    <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 mb-3">
                                <FileText className="w-5 h-5 text-amber-400" />
                                <h3 className="font-semibold text-amber-300">Resumo Executivo</h3>
                            </div>
                            <button
                                onClick={handleCopyReport}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 text-green-400" />
                                        Copiado!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copiar Relatório
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-white leading-relaxed">{result.resumo_executivo}</p>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-sm text-slate-400">Confiança:</span>
                            <div className="flex-1 max-w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-amber-500 transition-all"
                                    style={{ width: `${result.confianca * 100}%` }}
                                />
                            </div>
                            <span className="text-sm text-amber-400">{Math.round(result.confianca * 100)}%</span>
                        </div>
                    </div>

                    {/* Crimes Grid */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Scale className="w-5 h-5 text-red-400" />
                            <h3 className="font-semibold text-white">
                                Crimes Identificados ({result.crimes.length})
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {result.crimes.map((crime, idx) => (
                                <div 
                                    key={idx}
                                    className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedCrime(expandedCrime === idx ? null : idx)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                                                <span className="text-red-400 font-bold">{idx + 1}</span>
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-white">{crime.crime}</p>
                                                <p className="text-sm text-slate-400">{crime.tipificacao}</p>
                                            </div>
                                        </div>
                                        {expandedCrime === idx ? (
                                            <ChevronUp className="w-5 h-5 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                        )}
                                    </button>

                                    {expandedCrime === idx && (
                                        <div className="px-4 pb-4 space-y-3 border-t border-slate-700">
                                            <div className="pt-3">
                                                <span className="text-sm text-slate-400">Pena base:</span>
                                                <span className="ml-2 text-white">{crime.pena_base}</span>
                                            </div>
                                            {crime.qualificadoras.length > 0 && (
                                                <div>
                                                    <span className="text-sm text-slate-400">Qualificadoras:</span>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {crime.qualificadoras.map((q, i) => (
                                                            <span key={i} className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">
                                                                {q}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-sm text-slate-400">Evidência no texto:</span>
                                                <p className="mt-1 text-sm text-slate-300 italic bg-slate-800 p-2 rounded">
                                                    "{crime.evidencias_no_texto}"
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Flagrante & Conexão Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Flagrante */}
                        <div className={`border rounded-xl p-5 ${
                            result.flagrante.existe 
                                ? 'bg-red-900/20 border-red-500/30' 
                                : 'bg-slate-900/50 border-slate-800'
                        }`}>
                            <div className="flex items-center gap-3 mb-3">
                                <AlertCircle className={`w-5 h-5 ${result.flagrante.existe ? 'text-red-400' : 'text-slate-400'}`} />
                                <h3 className="font-semibold text-white">Situação de Flagrante</h3>
                            </div>
                            {result.flagrante.existe ? (
                                <>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm mb-3">
                                        <CheckCircle2 className="w-4 h-4" />
                                        FLAGRANTE {result.flagrante.tipo.toUpperCase()}
                                    </div>
                                    <p className="text-sm text-slate-300 mb-2">{result.flagrante.fundamento}</p>
                                    <p className="text-sm text-slate-400">{result.flagrante.justificativa}</p>
                                </>
                            ) : (
                                <p className="text-slate-400">Não há situação de flagrante identificada.</p>
                            )}
                        </div>

                        {/* Conexão */}
                        <div className={`border rounded-xl p-5 ${
                            result.conexao.existe 
                                ? 'bg-purple-900/20 border-purple-500/30' 
                                : 'bg-slate-900/50 border-slate-800'
                        }`}>
                            <div className="flex items-center gap-3 mb-3">
                                <Link2 className={`w-5 h-5 ${result.conexao.existe ? 'text-purple-400' : 'text-slate-400'}`} />
                                <h3 className="font-semibold text-white">Crimes Conexos</h3>
                            </div>
                            {result.conexao.existe ? (
                                <>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm mb-3">
                                        Conexão {result.conexao.tipo}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {result.conexao.crimes_conexos.map((c, i) => (
                                            <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 text-sm rounded">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-slate-400">Não há conexão entre os crimes identificados.</p>
                            )}
                        </div>
                    </div>

                    {/* Providências */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <ClipboardList className="w-5 h-5 text-cyan-400" />
                            <h3 className="font-semibold text-white">Providências Recomendadas</h3>
                        </div>
                        <div className="space-y-2">
                            {result.providencias.map((prov, idx) => (
                                <div 
                                    key={idx}
                                    className={`flex items-start gap-3 p-3 border rounded-lg ${getPriorityColor(prov.prioridade)}`}
                                >
                                    <span className="text-xs font-medium uppercase shrink-0 mt-0.5">
                                        {prov.prioridade}
                                    </span>
                                    <div>
                                        <p className="text-white">{prov.acao}</p>
                                        <p className="text-sm opacity-80 mt-1">{prov.fundamento}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Alertas */}
                    {result.alertas.length > 0 && (
                        <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                                <h3 className="font-semibold text-amber-300">Alertas</h3>
                            </div>
                            <div className="space-y-2">
                                {result.alertas.map((alerta, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg">
                                        <span className="px-2 py-0.5 bg-amber-500/30 text-amber-300 text-xs rounded uppercase">
                                            {alerta.tipo}
                                        </span>
                                        <p className="text-amber-100">{alerta.mensagem}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
