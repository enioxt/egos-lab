'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para gerenciar estado de colapso com persistência em localStorage
 * 
 * @param id - Identificador único para a seção (usado como chave no localStorage)
 * @param defaultOpen - Estado inicial (padrão: true = aberto)
 * @returns [isOpen, toggle, setIsOpen]
 */
export function useCollapsible(id: string, defaultOpen: boolean = true) {
    const storageKey = `intelink_collapse_${id}`;
    
    const [isOpen, setIsOpen] = useState<boolean>(() => {
        if (typeof window === 'undefined') return defaultOpen;
        const saved = localStorage.getItem(storageKey);
        if (saved !== null) {
            return saved === 'true';
        }
        return defaultOpen;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, isOpen.toString());
        }
    }, [isOpen, storageKey]);

    const toggle = () => setIsOpen(prev => !prev);

    return { isOpen, toggle, setIsOpen };
}
