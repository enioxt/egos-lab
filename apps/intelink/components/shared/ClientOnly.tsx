'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface ClientOnlyProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Wrapper component that ensures children are only rendered on the client side.
 * Automatically wraps in Suspense for useSearchParams compatibility.
 */
export default function ClientOnly({ children, fallback }: ClientOnlyProps) {
    const defaultFallback = (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    return (
        <Suspense fallback={fallback || defaultFallback}>
            {children}
        </Suspense>
    );
}
