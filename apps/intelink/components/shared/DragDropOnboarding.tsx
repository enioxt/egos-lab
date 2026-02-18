'use client';

import React, { useState, useEffect } from 'react';
import { X, GripVertical, Move, Settings } from 'lucide-react';

interface DragDropOnboardingProps {
    onDismiss?: () => void;
}

/**
 * DragDropOnboarding - Tutorial balão para primeira visita
 * 
 * Aparece apenas:
 * - Na primeira vez que o usuário acessa no dia
 * - Se não escolheu "não mostrar novamente"
 */
export default function DragDropOnboarding({ onDismiss }: DragDropOnboardingProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check if permanently dismissed
        const permanentlyDismissed = localStorage.getItem('dnd_onboarding_never_show');
        if (permanentlyDismissed === 'true') {
            return;
        }

        // Check if already shown today
        const lastShown = localStorage.getItem('dnd_onboarding_last_shown');
        const today = new Date().toISOString().split('T')[0];
        
        if (lastShown === today) {
            return;
        }

        // Show onboarding after small delay
        const timer = setTimeout(() => {
            setIsAnimating(true);
            setIsVisible(true);
            localStorage.setItem('dnd_onboarding_last_shown', today);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsAnimating(false);
        setTimeout(() => {
            setIsVisible(false);
            onDismiss?.();
        }, 300);
    };

    const handleNeverShow = () => {
        localStorage.setItem('dnd_onboarding_never_show', 'true');
        handleDismiss();
    };

    if (!isVisible) return null;

    return (
        <div 
            className={`
                fixed top-20 left-1/2 -translate-x-1/2 z-50
                bg-gradient-to-r from-blue-600 to-indigo-600
                border border-blue-400/30
                rounded-2xl shadow-2xl
                max-w-md w-full mx-4
                transition-all duration-300 ease-out
                ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
            `}
        >
            {/* Close button */}
            <button 
                onClick={handleDismiss}
                className="absolute -top-2 -right-2 p-1.5 bg-slate-800 rounded-full border border-slate-600 hover:bg-slate-700 transition-colors"
            >
                <X className="w-4 h-4 text-white" />
            </button>

            <div className="p-5">
                {/* Header with icon */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                        <Move className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-lg">
                            Personalize seu painel
                        </h3>
                        <p className="text-blue-200 text-sm">
                            Arraste os widgets para reorganizar
                        </p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-3 text-sm text-blue-100">
                        <GripVertical className="w-4 h-4 text-blue-300" />
                        <span>Passe o mouse no widget e arraste pelo ícone</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-blue-100">
                        <Settings className="w-4 h-4 text-blue-300" />
                        <span>Suas preferências são salvas automaticamente</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={handleNeverShow}
                        className="text-xs text-blue-200 hover:text-white transition-colors"
                    >
                        Não mostrar novamente
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors"
                    >
                        Entendi!
                    </button>
                </div>
            </div>
        </div>
    );
}
