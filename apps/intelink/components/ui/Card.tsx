'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'subtle' | 'nested';
    padding?: 'sm' | 'md' | 'lg';
}

/**
 * Card - Container card padrão
 * 
 * @example
 * <Card variant="default" padding="lg">
 *   <h2>Título</h2>
 *   <p>Conteúdo</p>
 * </Card>
 */
export function Card({ 
    children, 
    className,
    variant = 'default',
    padding = 'md'
}: CardProps) {
    const variants = {
        default: 'bg-slate-800/50 border-slate-700/50',
        subtle: 'bg-slate-800/30 border-slate-700/30',
        nested: 'bg-slate-700/30 border-slate-600/30',
    };

    const paddings = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div className={cn(
            'rounded-xl border',
            variants[variant],
            paddings[padding],
            className
        )}>
            {children}
        </div>
    );
}

interface CardHeaderProps {
    children: ReactNode;
    className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
    return (
        <div className={cn('mb-4', className)}>
            {children}
        </div>
    );
}

interface CardTitleProps {
    children: ReactNode;
    className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
    return (
        <h2 className={cn('text-lg font-semibold', className)}>
            {children}
        </h2>
    );
}

interface CardDescriptionProps {
    children: ReactNode;
    className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
    return (
        <p className={cn('text-sm text-slate-400 mt-1', className)}>
            {children}
        </p>
    );
}

interface CardContentProps {
    children: ReactNode;
    className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
    return (
        <div className={cn('', className)}>
            {children}
        </div>
    );
}
