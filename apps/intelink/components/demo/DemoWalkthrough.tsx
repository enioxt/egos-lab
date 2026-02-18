'use client';

/**
 * Demo Walkthrough Component
 * 
 * Guia interativo que mostra as funcionalidades do Intelink em 5 minutos.
 * Substitui 50 horas de trabalho manual por demonstração visual automatizada.
 * 
 * Uso: Adicionar <DemoWalkthrough /> em qualquer página
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
    X, ChevronRight, ChevronLeft, Play, Pause, SkipForward,
    Network, Search, FileText, Users, Shield, Sparkles,
    CheckCircle, Clock, Target, Zap
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface DemoStep {
    id: string;
    title: string;
    description: string;
    icon: typeof Network;
    highlight?: string; // CSS selector to highlight
    duration: number; // seconds
    action?: () => void;
}

interface DemoWalkthroughProps {
    isOpen?: boolean;
    onClose?: () => void;
    autoPlay?: boolean;
    startStep?: number;
}

// ============================================================================
// DEMO STEPS
// ============================================================================

const DEMO_STEPS: DemoStep[] = [
    {
        id: 'welcome',
        title: 'Bem-vindo ao Intelink',
        description: 'Sistema de Inteligência Policial que transforma 50 horas de análise manual em 5 minutos de insights automatizados.',
        icon: Sparkles,
        duration: 5,
    },
    {
        id: 'integration-notice',
        title: '⚠️ Potencial Máximo',
        description: 'O Intelink alcança seu potencial máximo quando integrado aos sistemas governamentais como SINESP INFOSEG e REDS. Com essa integração, consultas são instantâneas e cruzamentos automáticos.',
        icon: Shield,
        duration: 8,
    },
    {
        id: 'ingestion',
        title: '1. Ingestão de Documentos',
        description: 'Envie BOs, depoimentos e relatórios diretamente pelo sistema. A IA extrai automaticamente entidades (pessoas, veículos, locais) e relacionamentos.',
        icon: FileText,
        highlight: '[data-demo="upload"]',
        duration: 8,
    },
    {
        id: 'entities',
        title: '2. Extração de Entidades',
        description: 'Pessoas, veículos, locais e organizações são identificados automaticamente. CPFs, placas e telefones são cruzados entre operações para detectar vínculos ocultos.',
        icon: Users,
        highlight: '[data-demo="entities"]',
        duration: 8,
    },
    {
        id: 'graph',
        title: '3. Grafo de Conexões',
        description: 'Visualize a rede de vínculos em tempo real. Clique em qualquer nó para ver detalhes e conexões ocultas.',
        icon: Network,
        highlight: '[data-demo="graph"]',
        duration: 10,
    },
    {
        id: 'cross-case',
        title: '4. Análise Cross-Case',
        description: 'O sistema detecta automaticamente quando uma pessoa ou veículo aparece em MÚLTIPLAS operações. Ghost Nodes mostram conexões externas.',
        icon: Target,
        highlight: '[data-demo="cross-case"]',
        duration: 10,
    },
    {
        id: 'ai-analyst',
        title: '5. Analista IA',
        description: 'Converse com o caso! Pergunte "Quem é o principal suspeito?" ou "Qual a conexão entre A e B?" e receba análises instantâneas.',
        icon: Zap,
        highlight: '[data-demo="chat"]',
        duration: 8,
    },
    {
        id: 'security',
        title: '6. Segurança LGPD',
        description: 'Dados sensíveis (CPF, RG) são mascarados por padrão. Controle de acesso por unidade policial. Logs de auditoria completos.',
        icon: Shield,
        highlight: '[data-demo="security"]',
        duration: 6,
    },
    {
        id: 'conclusion',
        title: 'Pronto para Começar!',
        description: 'Acesse o sistema pelo navegador em intelink.ia.br. Em minutos, você terá uma visão completa de suas operações.',
        icon: CheckCircle,
        duration: 5,
    },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function DemoWalkthrough({ 
    isOpen: externalIsOpen, 
    onClose: externalOnClose,
    autoPlay = false,
    startStep = 0
}: DemoWalkthroughProps) {
    const [isOpen, setIsOpen] = useState(externalIsOpen ?? false);
    const [currentStep, setCurrentStep] = useState(startStep);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [progress, setProgress] = useState(0);

    const step = DEMO_STEPS[currentStep];
    const totalSteps = DEMO_STEPS.length;
    const Icon = step.icon;

    // Handle external control
    useEffect(() => {
        if (externalIsOpen !== undefined) {
            setIsOpen(externalIsOpen);
        }
    }, [externalIsOpen]);

    // Auto-advance when playing
    useEffect(() => {
        if (!isPlaying || !isOpen) return;

        const interval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + (100 / (step.duration * 10));
                if (newProgress >= 100) {
                    // Move to next step
                    if (currentStep < totalSteps - 1) {
                        setCurrentStep(prev => prev + 1);
                        return 0;
                    } else {
                        setIsPlaying(false);
                        return 100;
                    }
                }
                return newProgress;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isPlaying, isOpen, currentStep, step.duration, totalSteps]);

    // Reset progress when step changes
    useEffect(() => {
        setProgress(0);
    }, [currentStep]);

    // Highlight element
    useEffect(() => {
        if (!isOpen || !step.highlight) return;

        const element = document.querySelector(step.highlight);
        if (element) {
            element.classList.add('demo-highlight');
            return () => element.classList.remove('demo-highlight');
        }
    }, [isOpen, step.highlight]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setIsPlaying(false);
        setCurrentStep(0);
        setProgress(0);
        externalOnClose?.();
    }, [externalOnClose]);

    const handleNext = useCallback(() => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
            setProgress(0);
        } else {
            handleClose();
        }
    }, [currentStep, totalSteps, handleClose]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            setProgress(0);
        }
    }, [currentStep]);

    const handleTogglePlay = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/80 z-50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-x-4 bottom-4 md:inset-auto md:bottom-8 md:right-8 md:w-[420px] z-50">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Progress bar */}
                    <div className="h-1 bg-slate-800">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-100"
                            style={{ width: `${((currentStep + progress / 100) / totalSteps) * 100}%` }}
                        />
                    </div>

                    {/* Header */}
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>Demo: {currentStep + 1}/{totalSteps}</span>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-xl flex-shrink-0">
                                <Icon className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>

                        {/* Step indicator dots */}
                        <div className="flex items-center justify-center gap-1.5 mt-6">
                            {DEMO_STEPS.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setCurrentStep(index);
                                        setProgress(0);
                                    }}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        index === currentStep 
                                            ? 'bg-blue-500 w-6' 
                                            : index < currentStep
                                                ? 'bg-blue-500/50'
                                                : 'bg-slate-600'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                        <button
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Anterior
                        </button>

                        <button
                            onClick={handleTogglePlay}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 text-blue-400" />
                            ) : (
                                <Play className="w-5 h-5 text-blue-400" />
                            )}
                        </button>

                        <button
                            onClick={handleNext}
                            className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                            {currentStep === totalSteps - 1 ? 'Finalizar' : 'Próximo'}
                            {currentStep < totalSteps - 1 && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Global styles for highlighting */}
            <style jsx global>{`
                .demo-highlight {
                    position: relative;
                    z-index: 45;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
                    border-radius: 8px;
                    animation: demo-pulse 2s ease-in-out infinite;
                }
                
                @keyframes demo-pulse {
                    0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3); }
                    50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.2); }
                }
            `}</style>
        </>
    );
}

// ============================================================================
// HOOK FOR TRIGGERING DEMO
// ============================================================================

export function useDemoWalkthrough() {
    const [isOpen, setIsOpen] = useState(false);

    const openDemo = useCallback(() => setIsOpen(true), []);
    const closeDemo = useCallback(() => setIsOpen(false), []);

    return {
        isOpen,
        openDemo,
        closeDemo,
        DemoComponent: () => (
            <DemoWalkthrough 
                isOpen={isOpen} 
                onClose={closeDemo}
                autoPlay={true}
            />
        )
    };
}
