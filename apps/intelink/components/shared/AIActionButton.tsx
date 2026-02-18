'use client';

/**
 * AIActionButton - Universal button to invoke AI analysis from anywhere
 * 
 * Can analyze:
 * - Free text (paste a BO, document, etc)
 * - Entity (get connections, risk analysis)
 * - Investigation (full analysis)
 * 
 * @example
 * <AIActionButton 
 *   contextType="text"
 *   contextData={{ text: 'BO content...' }}
 *   variant="icon"
 * />
 */

import React, { useState } from 'react';
import { Sparkles, Scale, Network, Clock, Loader2, X, Brain } from 'lucide-react';
import { useGuardianAnalysis, GuardianResult } from '@/hooks/useGuardianAnalysis';

type ContextType = 'text' | 'entity' | 'investigation';

interface AIActionButtonProps {
    contextType: ContextType;
    contextData: {
        text?: string;
        entityId?: string;
        entityName?: string;
        investigationId?: string;
    };
    variant?: 'button' | 'icon' | 'menu';
    size?: 'sm' | 'md' | 'lg';
    onAnalysisComplete?: (result: any) => void;
}

const ANALYSIS_TYPES = [
    { id: 'guardian', label: 'Análise Jurídica', icon: Scale, color: 'amber', available: ['text'] },
    { id: 'connections', label: 'Conexões', icon: Network, color: 'purple', available: ['entity', 'investigation'] },
    { id: 'timeline', label: 'Timeline', icon: Clock, color: 'blue', available: ['investigation'] },
];

export default function AIActionButton({
    contextType,
    contextData,
    variant = 'button',
    size = 'md',
    onAnalysisComplete
}: AIActionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<GuardianResult | null>(null);
    
    const { analyze, isLoading, error } = useGuardianAnalysis();

    const availableAnalyses = ANALYSIS_TYPES.filter(a => a.available.includes(contextType));

    const handleAnalysis = async (analysisType: string) => {
        setActiveAnalysis(analysisType);
        setAnalysisResult(null);

        if (analysisType === 'guardian' && contextData.text) {
            const result = await analyze({ text: contextData.text });
            if (result) {
                setAnalysisResult(result);
                onAnalysisComplete?.(result);
            }
        }
        // TODO: Add other analysis types
    };

    const sizeClasses = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-3'
    };

    const iconSizes = {
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    if (variant === 'icon') {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`${sizeClasses[size]} bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/30 rounded-lg transition-all group`}
                    title="Análise IA"
                >
                    <Sparkles className={`${iconSizes[size]} text-purple-400 group-hover:text-purple-300`} />
                </button>

                {isOpen && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                        <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-medium text-white">Análise IA</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-700 rounded">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-2">
                            {availableAnalyses.map((analysis) => {
                                const Icon = analysis.icon;
                                const isActive = activeAnalysis === analysis.id;
                                return (
                                    <button
                                        key={analysis.id}
                                        onClick={() => handleAnalysis(analysis.id)}
                                        disabled={isLoading}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                            isActive 
                                                ? `bg-${analysis.color}-500/20 border border-${analysis.color}-500/30` 
                                                : 'hover:bg-slate-700'
                                        }`}
                                    >
                                        <div className={`p-2 bg-${analysis.color}-500/20 rounded-lg`}>
                                            {isLoading && isActive ? (
                                                <Loader2 className={`w-4 h-4 text-${analysis.color}-400 animate-spin`} />
                                            ) : (
                                                <Icon className={`w-4 h-4 text-${analysis.color}-400`} />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-white">{analysis.label}</p>
                                            <p className="text-xs text-slate-400">
                                                {analysis.id === 'guardian' && 'Crimes, artigos, flagrância'}
                                                {analysis.id === 'connections' && 'Rede de vínculos'}
                                                {analysis.id === 'timeline' && 'Linha do tempo'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Result Preview */}
                        {analysisResult && (
                            <div className="p-3 border-t border-slate-700 bg-slate-900/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Scale className="w-4 h-4 text-amber-400" />
                                    <span className="text-xs font-medium text-amber-400">Resultado</span>
                                </div>
                                {analysisResult.crimes.length > 0 ? (
                                    <div className="space-y-1">
                                        {analysisResult.crimes.slice(0, 3).map((crime, idx) => (
                                            <div key={idx} className="text-xs text-slate-300">
                                                • {crime.name} ({crime.article})
                                            </div>
                                        ))}
                                        {analysisResult.crimes.length > 3 && (
                                            <div className="text-xs text-slate-500">
                                                +{analysisResult.crimes.length - 3} mais...
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">Nenhum crime identificado</p>
                                )}
                                {analysisResult.flagrancy.detected && (
                                    <div className="mt-2 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400">
                                        ⚠️ Flagrância detectada: {analysisResult.flagrancy.type}
                                    </div>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="p-3 border-t border-slate-700 bg-red-900/20">
                                <p className="text-xs text-red-400">{error}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Default button variant
    return (
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all"
        >
            <Sparkles className="w-4 h-4" />
            Análise IA
        </button>
    );
}
