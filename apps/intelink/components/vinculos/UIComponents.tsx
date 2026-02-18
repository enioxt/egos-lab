'use client';

/**
 * Vinculos UI Components
 * Extracted from central/vinculos/page.tsx
 */

import React from 'react';
import { LucideIcon, AlertCircle } from 'lucide-react';

// ============================================
// STAT CARD
// ============================================

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    color: 'orange' | 'yellow' | 'emerald' | 'blue' | 'red';
}

const STAT_COLORS = {
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
};

export function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
    return (
        <div className={`${STAT_COLORS[color]} border rounded-xl p-4`}>
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-xs text-slate-400">{label}</p>
                </div>
            </div>
        </div>
    );
}

// ============================================
// TAB BUTTON
// ============================================

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    label: string;
    count?: number;
    color?: 'yellow' | 'emerald' | 'blue' | 'red';
    icon?: React.ReactNode;
}

export function TabButton({ active, onClick, label, count, color, icon }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                active 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
            {icon}
            {label}
            {count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                    color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                    color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                    color === 'red' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-700 text-slate-300'
                }`}>
                    {count}
                </span>
            )}
        </button>
    );
}

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
}

export function EmptyState({ icon: Icon = AlertCircle, title, description }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400 font-medium">{title}</p>
            {description && (
                <p className="text-sm text-slate-500 mt-1">{description}</p>
            )}
        </div>
    );
}

// ============================================
// CONFIDENCE BADGE
// ============================================

interface ConfidenceBadgeProps {
    confidence: number;
    showLabel?: boolean;
}

export function ConfidenceBadge({ confidence, showLabel = true }: ConfidenceBadgeProps) {
    const percentage = Math.round(confidence * 100);
    
    const getColor = () => {
        if (confidence >= 0.9) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (confidence >= 0.7) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    };
    
    const getLabel = () => {
        if (confidence >= 0.9) return 'Alta';
        if (confidence >= 0.7) return 'Média';
        return 'Baixa';
    };
    
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getColor()}`}>
            {percentage}%
            {showLabel && <span className="text-[10px] opacity-75">({getLabel()})</span>}
        </span>
    );
}

// ============================================
// STATUS BADGE
// ============================================

interface StatusBadgeProps {
    status: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pendente', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    in_progress: { label: 'Em Análise', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    confirmed: { label: 'Confirmado', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    rejected: { label: 'Rejeitado', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${config.className}`}>
            {config.label}
        </span>
    );
}
