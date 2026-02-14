'use client';

import Link from 'next/link';
import { ChevronLeft, LucideIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  icon?: LucideIcon;
  iconColor?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  backHref,
  icon: Icon,
  iconColor = 'text-amber-400',
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={twMerge('bg-gray-800 border-b border-gray-700 sticky top-0 z-40', className)}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {backHref && (
            <Link
              href={backHref}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          )}
          
          {Icon && (
            <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
              <Icon className={twMerge('w-5 h-5', iconColor)} />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-400 truncate">{subtitle}</p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Standardized action buttons for headers
export function HeaderButton({
  children,
  onClick,
  variant = 'primary',
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}) {
  const variants = {
    primary: 'bg-amber-500 text-gray-900 hover:bg-amber-400',
    secondary: 'bg-gray-700 text-gray-200 hover:bg-gray-600',
    ghost: 'text-gray-400 hover:text-white hover:bg-gray-700',
  };

  return (
    <button
      onClick={onClick}
      className={twMerge(
        'flex items-center gap-2 px-4 py-2 font-semibold rounded-xl transition-colors',
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
