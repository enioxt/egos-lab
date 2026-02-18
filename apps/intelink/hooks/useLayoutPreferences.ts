'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Widget configuration for layout persistence
 */
export interface WidgetConfig {
    id: string;
    isOpen: boolean;
    order: number;
    column: 'left' | 'right' | 'full';
}

/**
 * Layout preferences with scope control
 */
export interface LayoutPreferences {
    widgets: Record<string, WidgetConfig>;
    scope: 'global' | 'investigation';
    updatedAt: string;
}

const DEFAULT_WIDGETS: Record<string, WidgetConfig> = {
    synthesis: { id: 'synthesis', isOpen: true, order: 1, column: 'left' },
    crossCase: { id: 'crossCase', isOpen: true, order: 2, column: 'right' },
    predictedLinks: { id: 'predictedLinks', isOpen: true, order: 3, column: 'left' },
    entities: { id: 'entities', isOpen: true, order: 4, column: 'right' },
    evidence: { id: 'evidence', isOpen: true, order: 5, column: 'left' },
    timeline: { id: 'timeline', isOpen: true, order: 6, column: 'right' },
    network: { id: 'network', isOpen: true, order: 7, column: 'left' },
    rho: { id: 'rho', isOpen: true, order: 8, column: 'right' },
    findings: { id: 'findings', isOpen: true, order: 9, column: 'full' },
};

const STORAGE_KEY_GLOBAL = 'intelink_layout_global';
const STORAGE_KEY_PREFIX = 'intelink_layout_';

/**
 * Hook for managing layout preferences
 * 
 * Supports two modes:
 * - 'global': Same layout for all investigations
 * - 'investigation': Layout specific to current investigation
 * 
 * @param investigationId - Current investigation ID
 */
export function useLayoutPreferences(investigationId?: string) {
    const [preferences, setPreferences] = useState<LayoutPreferences>({
        widgets: DEFAULT_WIDGETS,
        scope: 'global',
        updatedAt: new Date().toISOString(),
    });
    const [isLoaded, setIsLoaded] = useState(false);

    // Load preferences on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // First, check if there's an investigation-specific layout
        if (investigationId) {
            const invKey = `${STORAGE_KEY_PREFIX}${investigationId}`;
            const invData = localStorage.getItem(invKey);
            if (invData) {
                try {
                    const parsed = JSON.parse(invData) as LayoutPreferences;
                    setPreferences(parsed);
                    setIsLoaded(true);
                    return;
                } catch (e) {
                    console.warn('Failed to parse investigation layout:', e);
                }
            }
        }

        // Fallback to global layout
        const globalData = localStorage.getItem(STORAGE_KEY_GLOBAL);
        if (globalData) {
            try {
                const parsed = JSON.parse(globalData) as LayoutPreferences;
                // Merge with defaults to handle new widgets
                setPreferences({
                    ...parsed,
                    widgets: { ...DEFAULT_WIDGETS, ...parsed.widgets },
                });
            } catch (e) {
                console.warn('Failed to parse global layout:', e);
            }
        }
        setIsLoaded(true);
    }, [investigationId]);

    // Save preferences
    const savePreferences = useCallback((newPrefs: LayoutPreferences) => {
        if (typeof window === 'undefined') return;

        const key = newPrefs.scope === 'investigation' && investigationId
            ? `${STORAGE_KEY_PREFIX}${investigationId}`
            : STORAGE_KEY_GLOBAL;

        const toSave = {
            ...newPrefs,
            updatedAt: new Date().toISOString(),
        };

        localStorage.setItem(key, JSON.stringify(toSave));
        setPreferences(toSave);
    }, [investigationId]);

    // Toggle widget open/closed
    const toggleWidget = useCallback((widgetId: string) => {
        setPreferences(prev => {
            const newPrefs = {
                ...prev,
                widgets: {
                    ...prev.widgets,
                    [widgetId]: {
                        ...prev.widgets[widgetId],
                        isOpen: !prev.widgets[widgetId]?.isOpen,
                    },
                },
            };
            savePreferences(newPrefs);
            return newPrefs;
        });
    }, [savePreferences]);

    // Check if widget is open
    const isWidgetOpen = useCallback((widgetId: string): boolean => {
        return preferences.widgets[widgetId]?.isOpen ?? true;
    }, [preferences.widgets]);

    // Change scope (global vs investigation-specific)
    const setScope = useCallback((scope: 'global' | 'investigation') => {
        const newPrefs = { ...preferences, scope };
        savePreferences(newPrefs);
    }, [preferences, savePreferences]);

    // Clear investigation-specific layout
    const clearInvestigationLayout = useCallback(() => {
        if (!investigationId || typeof window === 'undefined') return;
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${investigationId}`);
        // Reload global preferences
        const globalData = localStorage.getItem(STORAGE_KEY_GLOBAL);
        if (globalData) {
            try {
                setPreferences(JSON.parse(globalData));
            } catch (e) {
                setPreferences({ widgets: DEFAULT_WIDGETS, scope: 'global', updatedAt: new Date().toISOString() });
            }
        }
    }, [investigationId]);

    return {
        preferences,
        isLoaded,
        toggleWidget,
        isWidgetOpen,
        setScope,
        savePreferences,
        clearInvestigationLayout,
    };
}

/**
 * Simple hook for individual widget collapse state
 * Uses localStorage directly with optional investigation scope
 */
export function useWidgetCollapse(widgetId: string, defaultOpen = true, investigationId?: string) {
    const storageKey = investigationId 
        ? `widget_${widgetId}_${investigationId}`
        : `widget_${widgetId}_global`;
    
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const stored = localStorage.getItem(storageKey);
        if (stored !== null) {
            setIsOpen(stored === 'true');
        }
        setIsInitialized(true);
    }, [storageKey]);

    const toggle = useCallback(() => {
        setIsOpen(prev => {
            const newValue = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem(storageKey, String(newValue));
            }
            return newValue;
        });
    }, [storageKey]);

    return { isOpen, toggle, isInitialized };
}
