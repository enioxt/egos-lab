'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  variant?: 'light' | 'dark';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className, type, variant = 'dark', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    const isDark = variant === 'dark';

    return (
      <div className="w-full">
        {label && (
          <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={twMerge(
              // Base styles with mobile-optimized sizing (16px prevents zoom on iOS)
              'w-full px-4 py-3 min-h-[48px] border rounded-xl',
              'text-base focus:outline-none focus:ring-2 transition-all touch-manipulation',
              // Dark/Light variants
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:ring-amber-500/50 focus:border-amber-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-amber-500/50 focus:border-amber-500',
              leftIcon && 'pl-11',
              isPassword && 'pr-11',
              error && (isDark 
                ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
                : 'border-red-500 focus:ring-red-500/50 focus:border-red-500'),
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
        {helperText && !error && <p className={`mt-1.5 text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
