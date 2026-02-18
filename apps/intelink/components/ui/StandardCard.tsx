'use client';

import React, { ReactNode } from 'react';

/**
 * StandardCard - Card padronizado para consistência visual
 * 
 * Garante que todos os cards tenham:
 * - Mesma altura (h-full)
 * - Mesmo estilo de borda e fundo
 * - Header consistente
 * - Footer alinhado na base
 * 
 * @see .guarani/INTELINK_DESIGN_SYSTEM.md
 */

interface StandardCardProps {
    title?: string;
    subtitle?: string;
    icon?: ReactNode;
    badge?: ReactNode;
    headerAction?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
    className?: string;
    padding?: 'sm' | 'md' | 'lg' | 'none';
    variant?: 'default' | 'elevated' | 'bordered';
    onClick?: () => void;
}

const PADDING_STYLES = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
};

const VARIANT_STYLES = {
    default: 'bg-slate-900/50 border border-slate-800',
    elevated: 'bg-slate-900 border border-slate-700 shadow-lg',
    bordered: 'bg-transparent border-2 border-slate-700',
};

export function StandardCard({
    title,
    subtitle,
    icon,
    badge,
    headerAction,
    footer,
    children,
    className = '',
    padding = 'md',
    variant = 'default',
    onClick,
}: StandardCardProps) {
    const paddingStyles = PADDING_STYLES[padding];
    const variantStyles = VARIANT_STYLES[variant];
    const clickableStyles = onClick ? 'cursor-pointer hover:border-slate-700 transition-colors' : '';

    return (
        <div 
            className={`rounded-xl overflow-hidden h-full flex flex-col ${variantStyles} ${clickableStyles} ${className}`}
            onClick={onClick}
        >
            {/* Header - if title provided */}
            {(title || icon || headerAction) && (
                <div className={`flex items-center justify-between border-b border-slate-800 ${padding === 'none' ? 'px-4 py-3' : paddingStyles}`}>
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="flex-shrink-0">
                                {icon}
                            </div>
                        )}
                        <div>
                            {title && (
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    {title}
                                    {badge}
                                </h3>
                            )}
                            {subtitle && (
                                <p className="text-xs text-slate-400">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    {headerAction && (
                        <div className="flex-shrink-0">
                            {headerAction}
                        </div>
                    )}
                </div>
            )}

            {/* Content - grows to fill */}
            <div className={`flex-1 ${paddingStyles}`}>
                {children}
            </div>

            {/* Footer - sticks to bottom */}
            {footer && (
                <div className={`border-t border-slate-800 mt-auto ${paddingStyles}`}>
                    {footer}
                </div>
            )}
        </div>
    );
}

/**
 * StandardCardGrid - Grid wrapper for equal-height cards
 */
interface StandardCardGridProps {
    children: ReactNode;
    columns?: 1 | 2 | 3 | 4;
    gap?: 'sm' | 'md' | 'lg';
}

const COLUMNS_STYLES = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

const GAP_STYLES = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
};

export function StandardCardGrid({
    children,
    columns = 3,
    gap = 'md',
}: StandardCardGridProps) {
    return (
        <div className={`grid ${COLUMNS_STYLES[columns]} ${GAP_STYLES[gap]} auto-rows-fr`}>
            {children}
        </div>
    );
}

export default StandardCard;
