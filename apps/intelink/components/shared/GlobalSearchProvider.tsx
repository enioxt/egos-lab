'use client';

/**
 * GlobalSearchProvider
 * 
 * UNIFICADO: Escuta Ctrl+K e dispara evento para abrir o GlobalSearch.
 * O GlobalSearch do header já suporta variant="modal" e todos os recursos avançados.
 */

import { useEffect } from 'react';

// Custom event to trigger GlobalSearch open
export const GLOBAL_SEARCH_OPEN_EVENT = 'global-search-open';

export function triggerGlobalSearch() {
    window.dispatchEvent(new CustomEvent(GLOBAL_SEARCH_OPEN_EVENT));
}

export default function GlobalSearchProvider() {
    // Global CMD+K handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                triggerGlobalSearch();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // This component doesn't render anything - just listens for shortcuts
    return null;
}
