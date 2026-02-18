'use client';

import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Toast colors and icons
const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: React.ReactNode; title: string }> = {
    success: {
        bg: 'bg-emerald-900/90',
        border: 'border-emerald-500/50',
        icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
        title: 'text-emerald-200'
    },
    error: {
        bg: 'bg-red-900/90',
        border: 'border-red-500/50',
        icon: <AlertCircle className="w-5 h-5 text-red-400" />,
        title: 'text-red-200'
    },
    warning: {
        bg: 'bg-amber-900/90',
        border: 'border-amber-500/50',
        icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        title: 'text-amber-200'
    },
    info: {
        bg: 'bg-blue-900/90',
        border: 'border-blue-500/50',
        icon: <Info className="w-5 h-5 text-blue-400" />,
        title: 'text-blue-200'
    }
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const style = TOAST_STYLES[toast.type];

    useEffect(() => {
        if (toast.duration && toast.duration > 0) {
            const timer = setTimeout(onDismiss, toast.duration);
            return () => clearTimeout(timer);
        }
    }, [toast.duration, onDismiss]);

    return (
        <div 
            className={`${style.bg} ${style.border} border backdrop-blur-xl rounded-xl p-4 shadow-2xl min-w-[320px] max-w-md animate-slide-in-right`}
            role="alert"
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold ${style.title}`}>
                        {toast.title}
                    </h4>
                    {toast.message && (
                        <p className="text-slate-300 text-sm mt-1">
                            {toast.message}
                        </p>
                    )}
                </div>
                <button
                    onClick={onDismiss}
                    className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4 text-slate-400" />
                </button>
            </div>
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, title: string, message?: string, duration: number = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, type, title, message, duration }]);
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
                {toasts.map(toast => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onDismiss={() => hideToast(toast.id)}
                    />
                ))}
            </div>

            {/* Animation styles */}
            <style jsx global>{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </ToastContext.Provider>
    );
}

// Export a simple toast function for use outside React context
let globalShowToast: ((type: ToastType, title: string, message?: string, duration?: number) => void) | null = null;

export function setGlobalToast(fn: typeof globalShowToast) {
    globalShowToast = fn;
}

export function toast(type: ToastType, title: string, message?: string, duration?: number) {
    if (globalShowToast) {
        globalShowToast(type, title, message, duration);
    } else {
        // Fallback - should not happen if provider is set up
        console.warn('[Toast] Provider not found, using console');
        console.log(`[${type.toUpperCase()}] ${title}${message ? ': ' + message : ''}`);
    }
}

export default ToastProvider;
