'use client';

import React, { ReactNode } from 'react';

/**
 * StatusBadge - Badge semântico com cores padronizadas
 * 
 * REGRA DE OURO: Vermelho é APENAS para crimes, alertas e erros.
 * NUNCA use vermelho para botões admin.
 * 
 * @see .guarani/INTELINK_DESIGN_SYSTEM.md
 */

export type StatusType = 'critical' | 'high' | 'medium' | 'success' | 'info' | 'admin' | 'pending';

interface StatusBadgeProps {
    status: StatusType;
    children: ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    animate?: boolean;
}

const STATUS_STYLES: Record<StatusType, string> = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    admin: 'bg-slate-700 text-slate-300 border-slate-600',
    pending: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const SIZE_STYLES: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
};

export function StatusBadge({ 
    status, 
    children, 
    className = '',
    size = 'md',
    animate = false
}: StatusBadgeProps) {
    const baseStyles = STATUS_STYLES[status] || STATUS_STYLES.pending;
    const sizeStyles = SIZE_STYLES[size];
    const animateStyles = animate ? 'animate-pulse' : '';

    return (
        <span className={`inline-flex items-center gap-1 rounded border font-medium ${baseStyles} ${sizeStyles} ${animateStyles} ${className}`}>
            {children}
        </span>
    );
}

/**
 * Helpers for common status mappings
 */
export const mapRhoStatus = (status: string): StatusType => {
    switch (status) {
        case 'extreme': return 'critical';
        case 'critical': return 'high';
        case 'warning': return 'medium';
        case 'healthy': return 'success';
        default: return 'pending';
    }
};

export const mapPriority = (priority: string): StatusType => {
    switch (priority?.toLowerCase()) {
        case 'critical':
        case 'immediate': return 'critical';
        case 'high': return 'high';
        case 'medium': return 'medium';
        case 'low': return 'success';
        default: return 'pending';
    }
};

export default StatusBadge;
