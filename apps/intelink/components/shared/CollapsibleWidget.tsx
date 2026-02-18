'use client';

import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

interface CollapsibleWidgetProps {
    /** Unique key for localStorage persistence */
    storageKey: string;
    /** Widget title */
    title: string;
    /** Optional icon component */
    icon?: React.ReactNode;
    /** Optional badge/counter to show in header */
    badge?: string | number;
    /** Badge color variant */
    badgeVariant?: 'default' | 'success' | 'warning' | 'danger';
    /** Default open state (only used if no localStorage value) */
    defaultOpen?: boolean;
    /** Summary text shown when collapsed */
    collapsedSummary?: string;
    /** Children content */
    children: React.ReactNode;
    /** Additional className for container */
    className?: string;
    /** Header className */
    headerClassName?: string;
    /** Callback when open state changes (for ResponsiveWidgetRow) */
    onOpenChange?: (isOpen: boolean) => void;
    /** Optional action element in header (e.g., "Ver tudo" link) */
    headerAction?: React.ReactNode;
    /** Enable drag handle for reordering */
    draggable?: boolean;
    /** Props passed from useSortable for drag handle */
    dragHandleProps?: {
        attributes?: Record<string, any>;
        listeners?: Record<string, any>;
        setActivatorNodeRef?: (node: HTMLElement | null) => void;
    };
    /** Visual feedback when being dragged over */
    isDropTarget?: boolean;
    /** Whether drop is valid (green) or invalid (red) */
    isDropValid?: boolean;
}

const BADGE_COLORS = {
    default: 'bg-slate-700 text-slate-300',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    danger: 'bg-red-500/20 text-red-400',
};

/**
 * CollapsibleWidget - Modular collapsible section component
 * 
 * Features:
 * - Persists open/closed state to localStorage
 * - Smooth height transition
 * - Optional badge with variants
 * - Summary text when collapsed
 * 
 * @example
 * <CollapsibleWidget
 *   storageKey="investigation_sintese"
 *   title="Síntese de Inteligência"
 *   icon={<Brain className="w-5 h-5" />}
 *   badge={39}
 *   badgeVariant="default"
 *   defaultOpen={true}
 *   collapsedSummary="39 pessoas, 534 vínculos"
 * >
 *   {content}
 * </CollapsibleWidget>
 */
export default function CollapsibleWidget({
    storageKey,
    title,
    icon,
    badge,
    badgeVariant = 'default',
    defaultOpen = true,
    collapsedSummary,
    children,
    className = '',
    headerClassName = '',
    onOpenChange,
    headerAction,
    draggable = false,
    dragHandleProps,
    isDropTarget = false,
    isDropValid = true,
}: CollapsibleWidgetProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load state from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const stored = localStorage.getItem(`widget_${storageKey}`);
        if (stored !== null) {
            setIsOpen(stored === 'true');
        }
        setIsInitialized(true);
    }, [storageKey]);

    // Save state to localStorage when it changes
    const toggle = useCallback(() => {
        setIsOpen(prev => {
            const newValue = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem(`widget_${storageKey}`, String(newValue));
            }
            // Schedule parent notification after render
            setTimeout(() => onOpenChange?.(newValue), 0);
            return newValue;
        });
    }, [storageKey, onOpenChange]);
    
    // Notify parent on initial load (after render)
    useEffect(() => {
        if (isInitialized && onOpenChange) {
            // Use timeout to avoid setState during render
            const timer = setTimeout(() => onOpenChange(isOpen), 0);
            return () => clearTimeout(timer);
        }
    }, [isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

    // Prevent hydration mismatch by not rendering until initialized
    if (!isInitialized) {
        return (
            <div className={`bg-slate-900 rounded-lg border border-slate-800 ${className}`}>
                <div className="h-14 animate-pulse bg-slate-800/50 rounded-lg" />
            </div>
        );
    }

    // Drop target visual classes
    const dropTargetClass = isDropTarget 
        ? isDropValid 
            ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-green-500/20' 
            : 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-red-500/20'
        : '';

    return (
        <div className={`bg-slate-900 rounded-lg border border-slate-800 overflow-hidden relative group/widget transition-all duration-200 ${dropTargetClass} ${className}`}>
            {/* Drag Handle - visible on hover when draggable */}
            {draggable && dragHandleProps && (
                <div
                    ref={dragHandleProps.setActivatorNodeRef}
                    {...dragHandleProps.attributes}
                    {...dragHandleProps.listeners}
                    className="absolute -top-1 -left-1 z-20 p-1.5 rounded-lg cursor-grab active:cursor-grabbing bg-slate-700/90 hover:bg-blue-600 opacity-0 group-hover/widget:opacity-100 transition-all duration-200 shadow-lg"
                    title="Arrastar widget"
                >
                    <GripVertical className="w-4 h-4 text-white" />
                </div>
            )}
            
            {/* Drop indicator badge */}
            {isDropTarget && (
                <div className={`absolute -top-1 -right-1 z-20 p-1 rounded-full ${isDropValid ? 'bg-green-500' : 'bg-red-500'} animate-pulse shadow-lg`}>
                    {isDropValid ? (
                        <ChevronDown className="w-3 h-3 text-white" />
                    ) : (
                        <ChevronUp className="w-3 h-3 text-white" />
                    )}
                </div>
            )}
            
            {/* Header - Always visible */}
            <button
                onClick={toggle}
                className={`
                    w-full flex items-center justify-between gap-3
                    px-4 py-3 
                    hover:bg-slate-800/50 transition-colors
                    text-left
                    ${headerClassName}
                `}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {/* Icon */}
                    {icon && (
                        <span className="text-slate-400 flex-shrink-0">
                            {icon}
                        </span>
                    )}
                    
                    {/* Title */}
                    <span className="font-medium text-white truncate">
                        {title}
                    </span>
                    
                    {/* Badge */}
                    {badge !== undefined && (
                        <span className={`
                            px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0
                            ${BADGE_COLORS[badgeVariant]}
                        `}>
                            {badge}
                        </span>
                    )}
                    
                    {/* Collapsed Summary */}
                    {!isOpen && collapsedSummary && (
                        <span className="text-slate-500 text-sm truncate hidden sm:block">
                            — {collapsedSummary}
                        </span>
                    )}
                </div>
                
                {/* Header Action (e.g., "Ver tudo" link) */}
                {headerAction && (
                    <span className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {headerAction}
                    </span>
                )}
                
                {/* Chevron */}
                <span className="text-slate-400 flex-shrink-0">
                    {isOpen ? (
                        <ChevronUp className="w-5 h-5" />
                    ) : (
                        <ChevronDown className="w-5 h-5" />
                    )}
                </span>
            </button>
            
            {/* Content - Collapsible */}
            <div
                className={`
                    transition-all duration-300 ease-in-out
                    ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
                    overflow-hidden
                `}
            >
                <div className="px-4 pb-4 pt-1">
                    {children}
                </div>
            </div>
        </div>
    );
}
