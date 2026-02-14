'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ className, showLabel = false, size = 'md' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn(
        "flex items-center gap-2 rounded-lg bg-surface-elevated p-1",
        size === 'sm' && 'p-0.5',
        size === 'lg' && 'p-1.5',
        className
      )}>
        <div className={cn(
          "rounded-md bg-surface-card animate-pulse",
          size === 'sm' && 'w-6 h-6',
          size === 'md' && 'w-8 h-8',
          size === 'lg' && 'w-10 h-10'
        )} />
      </div>
    );
  }

  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 20;
  const buttonSize = size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10';

  const themes = [
    { value: 'light', icon: Sun, label: 'Claro' },
    { value: 'dark', icon: Moon, label: 'Escuro' },
    { value: 'system', icon: Monitor, label: 'Sistema' },
  ];

  return (
    <div className={cn(
      "flex items-center gap-1 rounded-lg bg-surface-elevated p-1",
      size === 'sm' && 'p-0.5 gap-0.5',
      size === 'lg' && 'p-1.5 gap-1.5',
      className
    )}>
      {themes.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              "flex items-center justify-center rounded-md transition-all touch-manipulation",
              buttonSize,
              isActive
                ? "bg-surface-card text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary hover:bg-surface-card/50"
            )}
            title={label}
            aria-label={`Tema ${label}`}
          >
            <Icon size={iconSize} />
          </button>
        );
      })}
      {showLabel && (
        <span className="text-xs text-text-secondary ml-2 hidden sm:inline">
          {themes.find((t: any) => t.value === theme)?.label}
        </span>
      )}
    </div>
  );
}

export function ThemeToggleSimple({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("w-8 h-8 rounded-lg bg-surface-elevated animate-pulse", className)} />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-lg",
        "bg-surface-elevated hover:bg-surface-highlight",
        "text-text-secondary hover:text-text-primary",
        "transition-all touch-manipulation active:scale-95",
        className
      )}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
