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

            {/* Install App Banner is removed by user request */}
        </>
    );
}
