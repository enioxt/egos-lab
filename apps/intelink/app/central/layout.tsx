/**
 * Central Layout
 * 
 * Layout compartilhado para todas as páginas dentro de /central
 * Mantém o header persistente e evita recarregamento ao navegar entre abas
 * 
 * NOTE: JourneyFAB is now global in app/layout.tsx
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import CentralNav from '@/components/central/CentralNav';

export default function CentralLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    
    // Show CentralNav on ALL /central pages including main page
    const isMainPage = pathname === '/central';
    
    return (
        <div className="min-h-screen bg-slate-950">
            <CentralNav isMainPage={isMainPage} />
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </div>
    );
}
