'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'dark' | 'centered';
}

/**
 * PageContainer - Wrapper padrão para todas as páginas
 * 
 * @example
 * <PageContainer>
 *   <PageHeader ... />
 *   <main>...</main>
 * </PageContainer>
 * 
 * @example White-label customization via CSS variables
 * :root {
 *   --page-bg-from: 2 6 23;
 *   --page-bg-via: 15 23 42;
 *   --page-bg-to: 2 6 23;
 * }
 */
export function PageContainer({ 
    children, 
    className,
    variant = 'default'
}: PageContainerProps) {
    const variants = {
        default: 'min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white',
        dark: 'min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white',
        centered: 'min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center',
    };

    return (
        <div className={cn(variants[variant], className)}>
            {children}
        </div>
    );
}
