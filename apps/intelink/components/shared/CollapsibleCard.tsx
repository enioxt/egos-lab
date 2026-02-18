'use client';

import { useState, useEffect, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleCardProps {
    id: string; // Unique key for localStorage
    title: string;
    icon?: ReactNode;
    badge?: ReactNode;
    headerAction?: ReactNode;
    children: ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

/**
 * CollapsibleCard - Card com memória de estado (localStorage)
 * 
 * Permite que o usuário "limpe" a tela escondendo cards que não usa.
 * O estado persiste entre sessões via localStorage.
 */
export default function CollapsibleCard({
    id,
    title,
    icon,
    badge,
    headerAction,
    children,
    defaultOpen = true,
    className = ''
}: CollapsibleCardProps) {
    const storageKey = `intelink_layout_${id}_collapsed`;
    
    // Initialize from localStorage or default
    const [isOpen, setIsOpen] = useState<boolean>(() => {
        if (typeof window === 'undefined') return defaultOpen;
        const saved = localStorage.getItem(storageKey);
        if (saved !== null) {
            return saved !== 'true'; // stored as 'true' means collapsed
        }
        return defaultOpen;
    });

    // Sync to localStorage on change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, (!isOpen).toString());
        }
    }, [isOpen, storageKey]);

    const toggle = () => setIsOpen(prev => !prev);

    return (
        <div className={`bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden ${className}`}>
            {/* Header - Always visible */}
            <div 
                className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between cursor-pointer hover:bg-slate-700/20 transition-colors"
                onClick={toggle}
            >
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="font-semibold text-sm text-white">{title}</h3>
                    {badge}
                </div>
                
                <div className="flex items-center gap-2">
                    {headerAction && (
                        <div onClick={e => e.stopPropagation()}>
                            {headerAction}
                        </div>
                    )}
                    <button 
                        className="text-slate-400 hover:text-white transition-colors p-1"
                        aria-label={isOpen ? 'Recolher' : 'Expandir'}
                    >
                        {isOpen ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content - Collapsible */}
            {isOpen && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}
