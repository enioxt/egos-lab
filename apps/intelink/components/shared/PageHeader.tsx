'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    /** Título da página */
    title: string;
    /** Subtítulo opcional */
    subtitle?: string;
    /** Ícone do título (componente Lucide) */
    icon?: LucideIcon;
    /** Cor do ícone (classe Tailwind) */
    iconColor?: string;
    /** Link de voltar (default: /) */
    backHref?: string;
    /** Texto do link de voltar (default: Voltar ao Início) */
    backText?: string;
    /** Mostrar ícone de home junto com voltar */
    showHomeIcon?: boolean;
    /** Ações à direita do header */
    actions?: React.ReactNode;
    /** Classes adicionais */
    className?: string;
}

/**
 * Componente padronizado de header de página
 * 
 * Uso:
 * <PageHeader 
 *   title="Qualidade de Dados"
 *   subtitle="Tarefas de correção e validação"
 *   icon={Zap}
 *   iconColor="text-amber-400"
 *   backHref="/"
 *   actions={<Button>Escanear</Button>}
 * />
 */
export default function PageHeader({
    title,
    subtitle,
    icon: Icon,
    iconColor = 'text-blue-400',
    backHref = '/',
    backText = 'Voltar ao Início',
    showHomeIcon = true,
    actions,
    className = ''
}: PageHeaderProps) {
    return (
        <div className={`mb-6 ${className}`}>
            {/* Link de voltar */}
            <Link 
                href={backHref}
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group text-sm"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                {showHomeIcon && <Home className="w-4 h-4" />}
                <span>{backText}</span>
            </Link>
            
            {/* Header principal */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        {Icon && <Icon className={`w-7 h-7 ${iconColor}`} />}
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
                    )}
                </div>
                
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Versão compacta do header (sem link de voltar)
 */
export function PageHeaderCompact({
    title,
    subtitle,
    icon: Icon,
    iconColor = 'text-blue-400',
    actions,
    className = ''
}: Omit<PageHeaderProps, 'backHref' | 'backText' | 'showHomeIcon'>) {
    return (
        <div className={`flex items-center justify-between mb-6 ${className}`}>
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    {Icon && <Icon className={`w-7 h-7 ${iconColor}`} />}
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
                )}
            </div>
            
            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
