'use client';

import { LucideIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={twMerge('text-center py-12', className)}>
      <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-100 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-400 mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-amber-500 text-gray-900 font-semibold rounded-xl hover:bg-amber-400 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
