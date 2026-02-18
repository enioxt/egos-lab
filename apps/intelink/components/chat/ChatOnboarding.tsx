'use client';

/**
 * Chat Onboarding Component
 * 
 * Guia visual para novos usuários do chat IA.
 * Indica onde clicar e o que fazer primeiro.
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, Sparkles, ChevronRight, X, Lightbulb, ArrowDown } from 'lucide-react';

interface ChatOnboardingProps {
    onDismiss?: () => void;
    showOnFirstVisit?: boolean;
}

const ONBOARDING_TIPS = [
    {
        id: 'select-investigation',
        title: 'Selecione uma Operação',
        description: 'Escolha um caso para que a IA tenha contexto completo.',
        icon: '📂',
        highlight: '[data-onboard="investigation-select"]',
    },
    {
        id: 'ask-question',
        title: 'Faça uma Pergunta',
        description: 'Digite sua dúvida sobre o caso ou clique em uma sugestão.',
        icon: '💬',
        highlight: '[data-onboard="chat-input"]',
    },
    {
        id: 'use-suggestions',
        title: 'Use as Sugestões',
        description: 'Clique em perguntas prontas para começar rapidamente.',
        icon: '✨',
        highlight: '[data-onboard="suggestions"]',
    },
];

export default function ChatOnboarding({ 
    onDismiss,
    showOnFirstVisit = true 
}: ChatOnboardingProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [currentTip, setCurrentTip] = useState(0);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if user has seen onboarding
        if (showOnFirstVisit) {
            const hasSeen = localStorage.getItem('intelink_chat_onboarding');
            if (!hasSeen) {
                setIsVisible(true);
            }
        }
    }, [showOnFirstVisit]);

    const handleDismiss = () => {
        setIsVisible(false);
        setDismissed(true);
        localStorage.setItem('intelink_chat_onboarding', 'true');
        onDismiss?.();
    };

    const handleNext = () => {
        if (currentTip < ONBOARDING_TIPS.length - 1) {
            setCurrentTip(prev => prev + 1);
        } else {
            handleDismiss();
        }
    };

    // Highlight current element
    useEffect(() => {
        if (!isVisible) return;
        
        const tip = ONBOARDING_TIPS[currentTip];
        const element = document.querySelector(tip.highlight);
        
        if (element) {
            element.classList.add('onboarding-highlight');
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            return () => element.classList.remove('onboarding-highlight');
        }
    }, [isVisible, currentTip]);

    if (!isVisible || dismissed) return null;

    const tip = ONBOARDING_TIPS[currentTip];

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 z-40"
                onClick={handleDismiss}
            />

            {/* Tooltip */}
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
                <div className="bg-gradient-to-br from-blue-900 to-slate-900 border border-blue-500/30 rounded-2xl shadow-2xl shadow-blue-500/20 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-300 text-sm font-medium">
                            <Lightbulb className="w-4 h-4" />
                            <span>Dica {currentTip + 1}/{ONBOARDING_TIPS.length}</span>
                        </div>
                        <button 
                            onClick={handleDismiss}
                            className="p-1 hover:bg-blue-500/20 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-blue-300" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                        <div className="flex items-start gap-4">
                            <span className="text-3xl">{tip.icon}</span>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">
                                    {tip.title}
                                </h3>
                                <p className="text-blue-200/80 text-sm">
                                    {tip.description}
                                </p>
                            </div>
                        </div>

                        {/* Arrow pointing down */}
                        <div className="flex justify-center mt-4">
                            <ArrowDown className="w-6 h-6 text-blue-400 animate-bounce" />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-slate-900/50 flex items-center justify-between">
                        <button 
                            onClick={handleDismiss}
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Pular tutorial
                        </button>
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {currentTip < ONBOARDING_TIPS.length - 1 ? 'Próximo' : 'Começar!'}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Global styles */}
            <style jsx global>{`
                .onboarding-highlight {
                    position: relative;
                    z-index: 45;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4);
                    border-radius: 12px;
                    animation: onboard-pulse 1.5s ease-in-out infinite;
                }
                
                @keyframes onboard-pulse {
                    0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4); }
                    50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.4), 0 0 50px rgba(59, 130, 246, 0.3); }
                }
            `}</style>
        </>
    );
}

// Hook to reset onboarding (for testing)
export function useResetOnboarding() {
    return () => {
        localStorage.removeItem('intelink_chat_onboarding');
        window.location.reload();
    };
}
