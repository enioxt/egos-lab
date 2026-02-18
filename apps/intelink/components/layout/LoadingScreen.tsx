'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
    message?: string;
    spinnerColor?: string;
    className?: string;
}

/**
 * LoadingScreen - Tela de loading padrão (fullscreen)
 * 
 * @example
 * if (loading) {
 *   return <LoadingScreen message="Carregando dados..." />;
 * }
 */
export function LoadingScreen({ 
    message = 'Carregando...',
    spinnerColor = 'text-blue-500',
    className
}: LoadingScreenProps) {
    return (
        <div className={cn(
            'min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
            'text-white flex items-center justify-center',
            className
        )}>
            <div className="flex flex-col items-center gap-4">
                <Loader2 className={cn('w-10 h-10 animate-spin', spinnerColor)} />
                <p className="text-slate-400">{message}</p>
            </div>
        </div>
    );
}
