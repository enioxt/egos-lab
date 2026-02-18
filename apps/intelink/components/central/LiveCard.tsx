'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';

interface LiveCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
    href: string;
    /** Live count to display prominently */
    liveCount?: number;
    /** Label for the count */
    countLabel?: string;
    /** Count variant affects color */
    countVariant?: 'default' | 'warning' | 'danger' | 'success';
    /** Action button label (defaults to "Acessar") */
    actionLabel?: string;
    /** Secondary action button */
    secondaryAction?: {
        label: string;
        href: string;
    };
    /** Card color theme */
    color?: 'purple' | 'cyan' | 'blue' | 'green' | 'orange' | 'red';
    /** Features list */
    features?: string[];
    /** Badge text */
    badge?: string;
}

const COLORS = {
    purple: {
        border: 'border-purple-500/30 hover:border-purple-500/50',
        bg: 'bg-purple-500/5',
        icon: 'text-purple-400',
        count: 'text-purple-400',
    },
    cyan: {
        border: 'border-cyan-500/30 hover:border-cyan-500/50',
        bg: 'bg-cyan-500/5',
        icon: 'text-cyan-400',
        count: 'text-cyan-400',
    },
    blue: {
        border: 'border-blue-500/30 hover:border-blue-500/50',
        bg: 'bg-blue-500/5',
        icon: 'text-blue-400',
        count: 'text-blue-400',
    },
    green: {
        border: 'border-green-500/30 hover:border-green-500/50',
        bg: 'bg-green-500/5',
        icon: 'text-green-400',
        count: 'text-green-400',
    },
    orange: {
        border: 'border-orange-500/30 hover:border-orange-500/50',
        bg: 'bg-orange-500/5',
        icon: 'text-orange-400',
        count: 'text-orange-400',
    },
    red: {
        border: 'border-red-500/30 hover:border-red-500/50',
        bg: 'bg-red-500/5',
        icon: 'text-red-400',
        count: 'text-red-400',
    },
};

const COUNT_VARIANTS = {
    default: 'text-slate-300',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
    success: 'text-green-400',
};

/**
 * LiveCard - Dashboard card with live data display
 * 
 * Shows a prominent count with optional variant styling,
 * useful for showing pending items, alerts, etc.
 */
export default function LiveCard({
    icon: Icon,
    title,
    description,
    href,
    liveCount,
    countLabel,
    countVariant = 'default',
    actionLabel = 'Acessar',
    secondaryAction,
    color = 'blue',
    features,
    badge,
}: LiveCardProps) {
    const colorTheme = COLORS[color];
    const countColor = countVariant === 'default' ? colorTheme.count : COUNT_VARIANTS[countVariant];

    return (
        <div className={`
            border rounded-xl p-5 transition-all
            ${colorTheme.border} ${colorTheme.bg}
        `}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800">
                        <Icon className={`w-5 h-5 ${colorTheme.icon}`} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">{title}</h3>
                        {badge && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 ml-2">
                                {badge}
                            </span>
                        )}
                    </div>
                </div>
                
                {/* Live Count */}
                {liveCount !== undefined && (
                    <div className="text-right">
                        <p className={`text-3xl font-bold ${countColor}`}>
                            {liveCount}
                        </p>
                        {countLabel && (
                            <p className="text-xs text-slate-500">{countLabel}</p>
                        )}
                    </div>
                )}
            </div>
            
            {/* Description */}
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">{description}</p>
            
            {/* Features */}
            {features && features.length > 0 && (
                <ul className="space-y-1 mb-4">
                    {features.map((feature, i) => (
                        <li key={i} className="text-xs text-slate-500 flex items-center gap-2">
                            <span className="w-1 h-1 bg-slate-600 rounded-full" />
                            {feature}
                        </li>
                    ))}
                </ul>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-3">
                <Link
                    href={href}
                    className={`
                        flex items-center gap-1 px-4 py-2 rounded-lg
                        text-sm font-medium transition-all
                        ${liveCount && liveCount > 0 && countVariant !== 'success'
                            ? 'bg-white text-slate-900 hover:bg-slate-100'
                            : 'bg-slate-800 text-white hover:bg-slate-700'
                        }
                    `}
                >
                    {liveCount && liveCount > 0 && countVariant !== 'success' ? (
                        <>
                            <AlertTriangle className="w-4 h-4" />
                            Resolver Agora
                        </>
                    ) : liveCount === 0 ? (
                        <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Tudo Limpo
                        </>
                    ) : (
                        <>
                            {actionLabel}
                            <ChevronRight className="w-4 h-4" />
                        </>
                    )}
                </Link>
                
                {secondaryAction && (
                    <Link
                        href={secondaryAction.href}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        {secondaryAction.label}
                    </Link>
                )}
            </div>
        </div>
    );
}
