'use client';

/**
 * SetupWizard - Wizard de configuração inicial da operação
 * 
 * Sprint 18 - Etapa 2: Alimentar Operação
 * Exibido após criar uma nova operação
 */

import React, { useState, useEffect } from 'react';
import { 
    FileUp, FileText, Users, Scale, Stethoscope, MessageSquare,
    Sparkles, CheckCircle2, ChevronRight, X, AlertTriangle,
    FileSearch, ClipboardList, Brain, Target, Loader2, Gavel,
    Shield, Route, FileWarning, User, Car, MapPin, Building2,
    ChevronDown, ChevronUp, Edit2, Trash2
} from 'lucide-react';
import { useProcessingCheckpoint } from '@/hooks/useProcessingCheckpoint';

interface AnalysisResult {
    criminal_articles: Array<{
        code: string;
        article: string;
        description: string;
        qualification?: string;
        confidence: 'high' | 'medium' | 'low';
        basis: string;
    }>;
    investigation_lines: Array<{
        title: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
        suggested_actions: string[];
    }>;
    risk_analysis: {
        flight_risk: 'high' | 'medium' | 'low';
        flight_risk_factors: string[];
        recidivism_risk: 'high' | 'medium' | 'low';
        recidivism_factors: string[];
        danger_level: 'high' | 'medium' | 'low';
        danger_factors: string[];
    };
    suggested_diligences: Array<{
        type: string;
        description: string;
        priority: 'urgent' | 'high' | 'medium' | 'low';
        target?: string;
        justification: string;
    }>;
    executive_summary: {
        overview: string;
        key_findings: string[];
        critical_gaps: string[];
        recommendations: string[];
    };
}

interface SetupWizardProps {
    investigationId: string;
    investigationTitle: string;
    onClose: () => void;
    onUploadClick: (type: string) => void;
    processedDocs: number;
    entities: any[];
    evidence: any[];
    onGenerateAnalysis: () => void;
}

// Tipos de documentos disponíveis para upload
const DOCUMENT_TYPES = [
    { 
        id: 'reds', 
        label: 'REDS / Boletim de Ocorrência', 
        icon: FileSearch, 
        color: 'blue',
        description: 'Extrai entidades, artigos, timeline e fatos',
        priority: 1
    },
    { 
        id: 'cs', 
        label: 'Comunicação de Serviço', 
        icon: ClipboardList, 
        color: 'purple',
        description: 'Extrai análises, hipóteses e insights investigativos',
        priority: 2
    },
    { 
        id: 'inquerito', 
        label: 'Inquérito Policial Completo', 
        icon: FileText, 
        color: 'amber',
        description: 'Processa IP inteiro: oitivas, perícias, diligências',
        priority: 3
    },
    { 
        id: 'depoimento', 
        label: 'Oitiva / Depoimento', 
        icon: MessageSquare, 
        color: 'green',
        description: 'Extrai declarações, contradições, testemunhos',
        priority: 4
    },
    { 
        id: 'laudo_pericial', 
        label: 'Laudo Pericial', 
        icon: Target, 
        color: 'cyan',
        description: 'Extrai conclusões periciais e metodologia',
        priority: 5
    },
    { 
        id: 'laudo_medico', 
        label: 'Exame Médico / IML', 
        icon: Stethoscope, 
        color: 'red',
        description: 'Extrai lesões, causa mortis, exame de corpo',
        priority: 6
    },
    { 
        id: 'livre', 
        label: 'Texto Livre', 
        icon: FileUp, 
        color: 'slate',
        description: 'Cole ou digite qualquer texto',
        priority: 7
    },
];

export default function SetupWizard({
    investigationId,
    investigationTitle,
    onClose,
    onUploadClick,
    processedDocs,
    entities,
    evidence,
    onGenerateAnalysis
}: SetupWizardProps) {
    const [step, setStep] = useState<'upload' | 'review' | 'analysis' | 'results'>('upload');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    
    // Expandable sections in review
    const [expandedSection, setExpandedSection] = useState<'entities' | 'evidence' | null>('entities');
    
    // Checkpoint for persistence
    const { 
        checkpoint, 
        saveCheckpoint, 
        clearCheckpoint, 
        hasUnfinishedWork 
    } = useProcessingCheckpoint<{
        step: string;
        analysisResult: AnalysisResult | null;
    }>('setup-wizard', investigationId);
    
    // Restore from checkpoint on mount
    useEffect(() => {
        if (checkpoint && hasUnfinishedWork) {
            setStep(checkpoint.step as any);
            if (checkpoint.data.analysisResult) {
                setAnalysisResult(checkpoint.data.analysisResult);
            }
        }
    }, [checkpoint, hasUnfinishedWork]);
    
    // Save checkpoint on step change
    useEffect(() => {
        if (step !== 'upload') {
            saveCheckpoint(
                step,
                { step, analysisResult },
                step === 'results' ? 1 : 0,
                1
            );
        }
    }, [step, analysisResult]);

    const totalEntities = entities.length;
    const totalEvidence = evidence.length;
    const hasContent = processedDocs > 0 || totalEntities > 0 || totalEvidence > 0;

    // Handler para gerar análise com IA
    const handleGenerateAnalysis = async () => {
        setIsAnalyzing(true);
        setAnalysisError(null);

        try {
            const response = await fetch('/api/investigation/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ investigation_id: investigationId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao gerar análise');
            }

            setAnalysisResult(data.analysis);
            setStep('results');
            onGenerateAnalysis(); // Notify parent
        } catch (error: any) {
            setAnalysisError(error.message || 'Erro desconhecido');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Helper para cor de prioridade/risco
    const getRiskColor = (level: string) => {
        switch (level) {
            case 'high': case 'urgent': return 'text-red-400 bg-red-500/20';
            case 'medium': return 'text-amber-400 bg-amber-500/20';
            case 'low': return 'text-green-400 bg-green-500/20';
            default: return 'text-slate-400 bg-slate-500/20';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-blue-400" />
                                Configurar Operação
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {investigationTitle}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                            step === 'upload' ? 'bg-blue-500 text-white' : 'bg-green-600 text-white'
                        }`}>
                            <FileUp className="w-4 h-4" />
                            Documentos
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                            step === 'review' ? 'bg-blue-500 text-white' : (step === 'analysis' || step === 'results' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300')
                        }`}>
                            <CheckCircle2 className="w-4 h-4" />
                            Revisar
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                            step === 'analysis' ? 'bg-blue-500 text-white' : (step === 'results' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300')
                        }`}>
                            <Brain className="w-4 h-4" />
                            Análise IA
                        </div>
                        {step === 'results' && (
                            <>
                                <ChevronRight className="w-4 h-4 text-slate-500" />
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-500 text-white">
                                    <Sparkles className="w-4 h-4" />
                                    Resultados
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-semibold text-white">
                                    Adicione documentos à operação
                                </h3>
                                <p className="text-slate-400 mt-1">
                                    A IA irá extrair automaticamente entidades, evidências e insights
                                </p>
                            </div>

                            {/* Document Types Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {DOCUMENT_TYPES.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => onUploadClick(type.id)}
                                            className={`flex items-start gap-4 p-4 rounded-xl border border-slate-700 hover:border-${type.color}-500/50 hover:bg-${type.color}-500/10 transition-all text-left group`}
                                        >
                                            <div className={`p-3 rounded-xl bg-${type.color}-500/20`}>
                                                <Icon className={`w-6 h-6 text-${type.color}-400`} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`font-semibold text-white group-hover:text-${type.color}-400 transition-colors`}>
                                                    {type.label}
                                                </h4>
                                                <p className="text-sm text-slate-400 mt-1">
                                                    {type.description}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Current Status */}
                            {hasContent && (
                                <div className="mt-6 p-4 bg-green-900/20 border border-green-700/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                                        <div>
                                            <p className="font-medium text-green-300">
                                                {processedDocs} documento(s) processado(s)
                                            </p>
                                            <p className="text-sm text-green-400/70">
                                                {totalEntities} entidades • {totalEvidence} evidências extraídas
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-semibold text-white">
                                    Revise o que foi extraído
                                </h3>
                                <p className="text-slate-400 mt-1">
                                    Confira as entidades e evidências antes de gerar a análise
                                </p>
                            </div>

                            {/* Summary Cards - Clickable */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-blue-400">{processedDocs}</p>
                                    <p className="text-xs text-slate-400">Documentos</p>
                                </div>
                                <button 
                                    onClick={() => setExpandedSection(expandedSection === 'entities' ? null : 'entities')}
                                    className={`p-3 rounded-xl text-center transition-all ${
                                        expandedSection === 'entities' 
                                            ? 'bg-purple-600/30 border-2 border-purple-500' 
                                            : 'bg-purple-900/20 border border-purple-700/50 hover:border-purple-500'
                                    }`}
                                >
                                    <p className="text-2xl font-bold text-purple-400">{totalEntities}</p>
                                    <p className="text-xs text-slate-400">Entidades</p>
                                </button>
                                <button 
                                    onClick={() => setExpandedSection(expandedSection === 'evidence' ? null : 'evidence')}
                                    className={`p-3 rounded-xl text-center transition-all ${
                                        expandedSection === 'evidence' 
                                            ? 'bg-amber-600/30 border-2 border-amber-500' 
                                            : 'bg-amber-900/20 border border-amber-700/50 hover:border-amber-500'
                                    }`}
                                >
                                    <p className="text-2xl font-bold text-amber-400">{totalEvidence}</p>
                                    <p className="text-xs text-slate-400">Evidências</p>
                                </button>
                            </div>

                            {/* Entities Detail */}
                            {expandedSection === 'entities' && entities.length > 0 && (
                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 max-h-64 overflow-y-auto">
                                    <h4 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Entidades Extraídas
                                    </h4>
                                    <div className="space-y-2">
                                        {entities.map((entity: any, i: number) => {
                                            const TypeIcon = entity.type === 'PERSON' ? User 
                                                : entity.type === 'VEHICLE' ? Car 
                                                : entity.type === 'LOCATION' ? MapPin 
                                                : entity.type === 'ORGANIZATION' ? Building2 
                                                : FileText;
                                            return (
                                                <div key={entity.id || i} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg group">
                                                    <div className="flex items-center gap-3">
                                                        <TypeIcon className="w-4 h-4 text-slate-400" />
                                                        <div>
                                                            <p className="text-sm text-white font-medium">{entity.name}</p>
                                                            <p className="text-xs text-slate-500">
                                                                {entity.type} {entity.role && `• ${entity.role}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                                        <button className="p-1 hover:bg-slate-700 rounded" title="Editar">
                                                            <Edit2 className="w-3 h-3 text-slate-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Evidence Detail */}
                            {expandedSection === 'evidence' && evidence.length > 0 && (
                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 max-h-64 overflow-y-auto">
                                    <h4 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                                        <FileWarning className="w-4 h-4" />
                                        Evidências Extraídas
                                    </h4>
                                    <div className="space-y-2">
                                        {evidence.map((ev: any, i: number) => (
                                            <div key={ev.id || i} className="p-2 bg-slate-900/50 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                                                        {ev.type}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-300 mt-1 line-clamp-2">
                                                    {ev.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!hasContent && (
                                <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                                        <p className="text-amber-300">
                                            Nenhum documento foi processado ainda. Volte e adicione documentos.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'analysis' && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-semibold text-white">
                                    Análise com Inteligência Artificial
                                </h3>
                                <p className="text-slate-400 mt-1">
                                    A IA irá analisar todos os dados e gerar insights investigativos
                                </p>
                            </div>

                            {/* AI Features */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Scale className="w-5 h-5 text-blue-400" />
                                        <h4 className="font-semibold text-white">Artigos Criminais</h4>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        Detecta automaticamente CP, CPP, leis especiais aplicáveis
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Target className="w-5 h-5 text-purple-400" />
                                        <h4 className="font-semibold text-white">Linhas de Operação</h4>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        Sugere caminhos investigativos baseados nos fatos
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                                        <h4 className="font-semibold text-white">Análise de Risco</h4>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        Avalia risco de fuga, reincidência e periculosidade
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ClipboardList className="w-5 h-5 text-green-400" />
                                        <h4 className="font-semibold text-white">Diligências Sugeridas</h4>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        Recomenda próximos passos investigativos
                                    </p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {analysisError && (
                                <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-400" />
                                        <p className="text-red-300">{analysisError}</p>
                                    </div>
                                </div>
                            )}

                            {/* Generate Button */}
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={handleGenerateAnalysis}
                                    disabled={!hasContent || isAnalyzing}
                                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:shadow-none disabled:cursor-not-allowed"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            Analisando...
                                        </>
                                    ) : (
                                        <>
                                            <Brain className="w-6 h-6" />
                                            Gerar Análise com IA
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Results Step */}
                    {step === 'results' && analysisResult && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full mb-3">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Análise Concluída
                                </div>
                                <h3 className="text-lg font-semibold text-white">
                                    Resultados da Análise
                                </h3>
                            </div>

                            {/* Executive Summary */}
                            {analysisResult.executive_summary && (
                                <div className="p-5 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-xl">
                                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-400" />
                                        Resumo Executivo
                                    </h4>
                                    <p className="text-slate-300 mb-4">{analysisResult.executive_summary.overview}</p>
                                    
                                    {analysisResult.executive_summary.key_findings.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-sm font-medium text-blue-300 mb-2">Principais Descobertas:</p>
                                            <ul className="space-y-1">
                                                {analysisResult.executive_summary.key_findings.map((finding, i) => (
                                                    <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                                        {finding}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Criminal Articles */}
                            {analysisResult.criminal_articles.length > 0 && (
                                <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl">
                                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                                        <Gavel className="w-5 h-5 text-amber-400" />
                                        Artigos Criminais Identificados
                                    </h4>
                                    <div className="space-y-3">
                                        {analysisResult.criminal_articles.map((article, i) => (
                                            <div key={i} className="p-3 bg-slate-900/50 rounded-lg">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-amber-300">{article.code}</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(article.confidence)}`}>
                                                        {article.confidence === 'high' ? 'Alta' : article.confidence === 'medium' ? 'Média' : 'Baixa'} confiança
                                                    </span>
                                                </div>
                                                <p className="text-white text-sm">{article.article}</p>
                                                <p className="text-slate-400 text-xs mt-1">{article.basis}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Risk Analysis */}
                            {analysisResult.risk_analysis && (
                                <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl">
                                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-red-400" />
                                        Análise de Risco
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                                            <p className="text-xs text-slate-400 mb-1">Risco de Fuga</p>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysisResult.risk_analysis.flight_risk)}`}>
                                                {analysisResult.risk_analysis.flight_risk.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                                            <p className="text-xs text-slate-400 mb-1">Reincidência</p>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysisResult.risk_analysis.recidivism_risk)}`}>
                                                {analysisResult.risk_analysis.recidivism_risk.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                                            <p className="text-xs text-slate-400 mb-1">Periculosidade</p>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysisResult.risk_analysis.danger_level)}`}>
                                                {analysisResult.risk_analysis.danger_level.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Investigation Lines */}
                            {analysisResult.investigation_lines.length > 0 && (
                                <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl">
                                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                                        <Route className="w-5 h-5 text-purple-400" />
                                        Linhas de Operação
                                    </h4>
                                    <div className="space-y-3">
                                        {analysisResult.investigation_lines.map((line, i) => (
                                            <div key={i} className="p-3 bg-slate-900/50 rounded-lg">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-purple-300">{line.title}</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(line.priority)}`}>
                                                        {line.priority === 'high' ? 'Alta' : line.priority === 'medium' ? 'Média' : 'Baixa'}
                                                    </span>
                                                </div>
                                                <p className="text-slate-400 text-sm">{line.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Suggested Diligences */}
                            {analysisResult.suggested_diligences.length > 0 && (
                                <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl">
                                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                                        <ClipboardList className="w-5 h-5 text-green-400" />
                                        Diligências Sugeridas
                                    </h4>
                                    <div className="space-y-2">
                                        {analysisResult.suggested_diligences.map((diligence, i) => (
                                            <div key={i} className="flex items-start gap-3 p-2 bg-slate-900/50 rounded-lg">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${getRiskColor(diligence.priority)}`}>
                                                    {diligence.type}
                                                </span>
                                                <p className="text-slate-300 text-sm">{diligence.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (step === 'review') setStep('upload');
                            else if (step === 'analysis') setStep('review');
                            else if (step === 'results') setStep('analysis');
                        }}
                        disabled={step === 'upload'}
                        className="px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Voltar
                    </button>

                    <div className="flex items-center gap-3">
                        {step === 'results' ? (
                            <button
                                onClick={() => {
                                    clearCheckpoint(); // Clear checkpoint on completion
                                    onGenerateAnalysis(); // Notify parent
                                    onClose();
                                }}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-green-500/25"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Concluir e Ver Operação
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                >
                                    Salvar e Sair
                                </button>
                                
                                {step !== 'analysis' && (
                                    <button
                                        onClick={() => {
                                            if (step === 'upload') setStep('review');
                                            else if (step === 'review') setStep('analysis');
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                    >
                                        Próximo
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
