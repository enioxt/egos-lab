'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-purple-400',
  trend,
  subtitle,
  className,
  onClick,
}: StatsCardProps) {
  const Wrapper = onClick ? 'button' : 'div';
  
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'bg-gray-800 border border-gray-700 rounded-xl p-4 text-left',
        onClick && 'hover:bg-gray-700/50 hover:border-gray-600 transition-colors cursor-pointer',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={cn('w-4 h-4', iconColor)} />}
        <span className="text-sm text-gray-400">{title}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {trend && (
        <p className={cn(
          'text-xs mt-1',
          trend.isPositive ? 'text-green-400' : 'text-red-400'
        )}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          {trend.label && ` ${trend.label}`}
        </p>
      )}
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </Wrapper>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  const colsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };
  
  return (
    <div className={cn('grid gap-4', colsClass[columns], className)}>
      {children}
    </div>
  );
}
