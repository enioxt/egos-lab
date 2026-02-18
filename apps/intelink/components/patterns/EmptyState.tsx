'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

/**
 * EmptyState - Componente para estados vazios
 * 
 * @example
 * <EmptyState
 *   icon={FileX}
 *   title="Nenhum documento encontrado"
 *   description="Comece adicionando seu primeiro documento"
 *   action={<Button>Adicionar</Button>}
 * />
 */
export function EmptyState({ 
    icon: Icon,
    title,
    description,
    action,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            'text-center py-12 text-slate-500',
            className
        )}>
            <Icon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">{title}</p>
            {description && (
                <p className="text-sm mt-1">{description}</p>
            )}
            {action && (
                <div className="mt-4">
                    {action}
                </div>
            )}
        </div>
    );
}
