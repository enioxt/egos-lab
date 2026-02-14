'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, className, children, disabled, ...props }, ref) => {
    // Base styles with touch optimization
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98]';

    const variants = {
      primary: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white focus:ring-amber-500',
      secondary: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 focus:ring-slate-500',
      outline: 'border-2 border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 focus:ring-slate-500',
      ghost: 'hover:bg-slate-100 active:bg-slate-200 text-slate-600 focus:ring-slate-500',
      danger: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white focus:ring-red-500',
    };

    // Sizes with minimum 44px touch target
    const sizes = {
      sm: 'text-sm px-4 py-2 min-h-[40px] gap-1.5',
      md: 'text-base px-5 py-3 min-h-[48px] gap-2',
      lg: 'text-lg px-6 py-3.5 min-h-[56px] gap-2',
    };

    return (
      <button
        ref={ref}
        className={twMerge(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
