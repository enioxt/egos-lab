'use client';

/**
 * Service Worker Registration Component
 * Registers SW on mount and handles updates
 */

import { useEffect, useState } from 'react';
import { RefreshCw, X, Download } from 'lucide-react';

export default function ServiceWorkerRegistration() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined') return;
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('[PWA] Service Worker registered:', registration.scope);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    setUpdateAvailable(true);
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.error('[PWA] Service Worker registration failed:', error);
                });
        }
        
        // Handle install prompt
        const handleInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
            
            // Show banner after 30 seconds if not installed
            setTimeout(() => {
                if (!window.matchMedia('(display-mode: standalone)').matches) {
                    setShowInstallBanner(true);
                }
            }, 30000);
        };
        
        window.addEventListener('beforeinstallprompt', handleInstallPrompt);
        
        return () => {
            window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
        };
    }, []);

    const handleUpdate = () => {
        window.location.reload();
    };

    const handleInstall = async () => {
        if (!installPrompt) return;
        
        installPrompt.prompt();
        const result = await installPrompt.userChoice;
        
        if (result.outcome === 'accepted') {
            console.log('[PWA] App installed');
        }
        
        setInstallPrompt(null);
        setShowInstallBanner(false);
    };

    return (
        <>
            {/* Update Available Banner */}
            {updateAvailable && (
                <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-cyan-600 text-white p-4 rounded-xl shadow-lg z-50 animate-in slide-in-from-bottom">
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium text-sm">Nova versão disponível</p>
                            <p className="text-xs text-cyan-100">Atualize para obter melhorias</p>
                        </div>
                        <button
                            onClick={handleUpdate}
                            className="px-3 py-1.5 bg-white text-cyan-600 text-sm font-medium rounded-lg hover:bg-cyan-50 transition-colors"
                        >
                            Atualizar
                        </button>
                    </div>
                </div>
            )}
            
            {/* Install App Banner */}
            {showInstallBanner && installPrompt && (
                <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-slate-800 border border-slate-700 text-white p-4 rounded-xl shadow-lg z-50 animate-in slide-in-from-bottom">
                    <button
                        onClick={() => setShowInstallBanner(false)}
                        className="absolute top-2 right-2 p-1 hover:bg-slate-700 rounded"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <Download className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm">Instalar Intelink</p>
                            <p className="text-xs text-slate-400">Acesse offline e mais rápido</p>
                        </div>
                        <button
                            onClick={handleInstall}
                            className="px-3 py-1.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-500 transition-colors"
                        >
                            Instalar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
