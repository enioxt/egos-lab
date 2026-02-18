'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    iconColor?: string;
    backHref?: string;
    actions?: ReactNode;
    className?: string;
}

/**
 * PageHeader - Header sticky padrão para todas as páginas
 * 
 * @example
 * <PageHeader
 *   title="Analytics"
 *   subtitle="Estatísticas gerais"
 *   icon={TrendingUp}
 *   iconColor="text-cyan-400"
 *   backHref="/"
 *   actions={<Button>Exportar</Button>}
 * />
 */
export function PageHeader({ 
    title,
    subtitle,
    icon: Icon,
    iconColor = 'text-blue-400',
    backHref = '/',
    actions,
    className
}: PageHeaderProps) {
    return (
        <header className={cn(
            'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900',
            'backdrop-blur-xl border-b border-slate-600/50',
            'sticky top-0 z-50',
            'px-4 sm:px-6 lg:px-[4%] xl:px-[5%] 2xl:px-[6%] py-4',
            className
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {backHref && (
                        <Link 
                            href={backHref} 
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                    )}
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            {Icon && <Icon className={cn('w-6 h-6', iconColor)} />}
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-sm text-slate-400">{subtitle}</p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </header>
    );
}
