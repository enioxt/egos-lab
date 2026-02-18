'use client';

/**
 * Offline Page
 * Shown when user is offline and page isn't cached
 */

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center">
                    <WifiOff className="w-12 h-12 text-slate-400" />
                </div>
                
                {/* Title */}
                <h1 className="text-2xl font-bold text-white mb-4">
                    Você está offline
                </h1>
                
                {/* Description */}
                <p className="text-slate-400 mb-8 leading-relaxed">
                    Não foi possível conectar ao servidor. Verifique sua conexão com a internet.
                    Algumas páginas podem estar disponíveis em cache.
                </p>
                
                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={handleRetry}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Tentar novamente
                    </button>
                    
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors border border-slate-700"
                    >
                        <Home className="w-4 h-4" />
                        Ir para início
                    </Link>
                </div>
                
                {/* Cached content hint */}
                <p className="mt-8 text-xs text-slate-500">
                    💡 Dica: Páginas visitadas recentemente podem estar disponíveis offline
                </p>
            </div>
        </div>
    );
}
