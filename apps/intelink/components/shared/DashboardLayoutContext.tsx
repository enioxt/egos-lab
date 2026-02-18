'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';

interface LayoutSettings {
    widgetOrder: string[];
    scope: 'global' | 'investigation';
}

interface DashboardLayoutContextType {
    widgetOrder: string[];
    setWidgetOrder: (order: string[]) => void;
    scope: 'global' | 'investigation';
    setScope: (scope: 'global' | 'investigation') => void;
    resetToDefault: () => void;
    isCustomized: boolean;
}

// Individual widget IDs for granular drag and drop
const DEFAULT_WIDGET_ORDER = [
    'widget-synthesis',
    'widget-crosscase',
    'widget-links',
    'widget-envolvidos',
    'widget-evidence',
    'widget-timeline',
    'widget-graph',
    'widget-rho',
];

const DashboardLayoutContext = createContext<DashboardLayoutContextType | null>(null);

interface DashboardLayoutProviderProps {
    children: React.ReactNode;
    investigationId?: string;
    defaultOrder?: string[];
}

export function DashboardLayoutProvider({
    children,
    investigationId,
    defaultOrder = DEFAULT_WIDGET_ORDER,
}: DashboardLayoutProviderProps) {
    const [widgetOrder, setWidgetOrderState] = useState<string[]>(defaultOrder);
    const [scope, setScopeState] = useState<'global' | 'investigation'>('global');
    const [isLoaded, setIsLoaded] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Load saved layout on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Try investigation-specific first
        if (investigationId) {
            const invKey = `dashboard_layout_${investigationId}`;
            const invData = localStorage.getItem(invKey);
            if (invData) {
                try {
                    const parsed = JSON.parse(invData) as LayoutSettings;
                    setWidgetOrderState(parsed.widgetOrder);
                    setScopeState('investigation');
                    setIsLoaded(true);
                    return;
                } catch (e) {
                    console.warn('Failed to parse investigation layout:', e);
                }
            }
        }

        // Fallback to global
        const globalData = localStorage.getItem('dashboard_layout_global');
        if (globalData) {
            try {
                const parsed = JSON.parse(globalData) as LayoutSettings;
                setWidgetOrderState(parsed.widgetOrder);
                setScopeState('global');
            } catch (e) {
                console.warn('Failed to parse global layout:', e);
            }
        }
        setIsLoaded(true);
    }, [investigationId]);

    // Save layout
    const saveLayout = useCallback((order: string[], currentScope: 'global' | 'investigation') => {
        if (typeof window === 'undefined') return;

        const settings: LayoutSettings = {
            widgetOrder: order,
            scope: currentScope,
        };

        if (currentScope === 'investigation' && investigationId) {
            localStorage.setItem(`dashboard_layout_${investigationId}`, JSON.stringify(settings));
        } else {
            localStorage.setItem('dashboard_layout_global', JSON.stringify(settings));
        }
    }, [investigationId]);

    const setWidgetOrder = useCallback((order: string[]) => {
        setWidgetOrderState(order);
        saveLayout(order, scope);
    }, [scope, saveLayout]);

    const setScope = useCallback((newScope: 'global' | 'investigation') => {
        setScopeState(newScope);
        saveLayout(widgetOrder, newScope);
    }, [widgetOrder, saveLayout]);

    const resetToDefault = useCallback(() => {
        setWidgetOrderState(defaultOrder);
        if (typeof window !== 'undefined') {
            if (investigationId) {
                localStorage.removeItem(`dashboard_layout_${investigationId}`);
            }
            localStorage.removeItem('dashboard_layout_global');
        }
    }, [defaultOrder, investigationId]);

    const [activeId, setActiveId] = useState<string | null>(null);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = widgetOrder.indexOf(active.id as string);
            const newIndex = widgetOrder.indexOf(over.id as string);
            
            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(widgetOrder, oldIndex, newIndex);
                setWidgetOrder(newOrder);
                console.log('🔄 Widget reordered:', active.id, '→', over.id, newOrder);
            }
        }
    }, [widgetOrder, setWidgetOrder]);

    // Custom drop animation with "snap" effect
    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
        duration: 250,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)', // Bounce effect
    };

    const isCustomized = JSON.stringify(widgetOrder) !== JSON.stringify(defaultOrder);

    if (!isLoaded) {
        return null;
    }

    return (
        <DashboardLayoutContext.Provider
            value={{
                widgetOrder,
                setWidgetOrder,
                scope,
                setScope,
                resetToDefault,
                isCustomized,
            }}
        >
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
                    {children}
                </SortableContext>
                
                {/* DragOverlay - Shows floating widget while dragging */}
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeId ? (
                        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl border-2 border-blue-500 shadow-2xl shadow-blue-500/20 p-4 max-w-md">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 rounded-lg">
                                    <GripVertical className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Movendo widget...</p>
                                    <p className="text-slate-400 text-sm">Solte em uma posição válida</p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </DashboardLayoutContext.Provider>
    );
}

export function useDashboardLayout() {
    const context = useContext(DashboardLayoutContext);
    if (!context) {
        throw new Error('useDashboardLayout must be used within DashboardLayoutProvider');
    }
    return context;
}

// Helper component for layout settings UI
export function LayoutSettingsButton() {
    const { scope, setScope, resetToDefault, isCustomized } = useDashboardLayout();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Configurar layout"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 p-4">
                    <h4 className="text-sm font-medium text-white mb-3">Configurar Layout</h4>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Salvar para:</label>
                            <select
                                value={scope}
                                onChange={(e) => setScope(e.target.value as 'global' | 'investigation')}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white [&>option]:bg-slate-800 [&>option]:text-white"
                            >
                                <option value="global">Todas as operações</option>
                                <option value="investigation">Apenas esta operação</option>
                            </select>
                        </div>

                        {isCustomized && (
                            <button
                                onClick={resetToDefault}
                                className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-white transition-colors"
                            >
                                Restaurar layout padrão
                            </button>
                        )}

                        <p className="text-xs text-slate-500">
                            Arraste os widgets para reordenar
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
