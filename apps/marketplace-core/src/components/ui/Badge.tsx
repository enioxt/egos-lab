'use client';

import { twMerge } from 'tailwind-merge';
import { LucideIcon } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'premium';
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  className?: string;
}

const variants = {
  default: 'bg-gray-700 text-gray-300',
  success: 'bg-green-500/20 text-green-400 border border-green-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  error: 'bg-red-500/20 text-red-400 border border-red-500/30',
  info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  premium: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  icon: Icon,
  className,
}: BadgeProps) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}

// Pre-configured badges for common use cases
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="info" className={className}>
      Verificado
    </Badge>
  );
}

export function OrientadorBadge({ className }: { className?: string }) {
  return (
    <Badge variant="success" className={className}>
      Orientador
    </Badge>
  );
}

export function DiscountBadge({ percent, className }: { percent: number; className?: string }) {
  return (
    <Badge variant="warning" className={className}>
      {percent}% DESC
    </Badge>
  );
}

export function CategoryBadge({ category, className }: { category: string; className?: string }) {
  return (
    <Badge variant="default" className={className}>
      Cat. {category}
    </Badge>
  );
}

export function StatusBadge({ 
  status, 
  className 
}: { 
  status: 'pending' | 'confirmed' | 'completed' | 'canceled' | 'paid';
  className?: string;
}) {
  const statusConfig = {
    pending: { variant: 'warning' as const, label: 'Pendente' },
    confirmed: { variant: 'info' as const, label: 'Confirmada' },
    completed: { variant: 'success' as const, label: 'Concluída' },
    canceled: { variant: 'error' as const, label: 'Cancelada' },
    paid: { variant: 'success' as const, label: 'Pago' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
