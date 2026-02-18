'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    rectIntersection,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check, X } from 'lucide-react';

// Types
interface GridWidget {
    id: string;
    column: number; // 0 or 1
    row: number; // 0-3
}

interface DraggableGridLayoutProps {
    children: React.ReactNode[];
    widgetIds: string[];
    investigationId: string;
    columns?: number;
}

interface SortableWidgetProps {
    id: string;
    children: React.ReactNode;
    isOver?: boolean;
    isValid?: boolean;
}

// Sortable Widget with drag handle
function SortableWidget({ id, children, isOver, isValid }: SortableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    // Visual indicator classes
    const indicatorClass = isOver 
        ? isValid 
            ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-green-500/30' 
            : 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-red-500/30'
        : '';

    return (
        <div 
            ref={setNodeRef} 
            style={style as React.CSSProperties}
            className={`relative group transition-all duration-200 ${indicatorClass}`}
        >
            {/* Drag Handle - sempre visível no topo esquerdo */}
            <div
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                className={`
                    absolute -top-2 -left-2 z-20
                    p-1.5 rounded-lg
                    cursor-grab active:cursor-grabbing
                    transition-all duration-200
                    ${isDragging 
                        ? 'bg-blue-600 scale-110' 
                        : 'bg-slate-700/90 hover:bg-blue-600 opacity-0 group-hover:opacity-100'
                    }
                `}
                title="Arrastar widget"
            >
                <GripVertical className="w-4 h-4 text-white" />
            </div>
            
            {/* Drop indicator badge */}
            {isOver && (
                <div className={`
                    absolute -top-2 -right-2 z-20
                    p-1 rounded-full
                    ${isValid ? 'bg-green-500' : 'bg-red-500'}
                    animate-pulse
                `}>
                    {isValid ? (
                        <Check className="w-3 h-3 text-white" />
                    ) : (
                        <X className="w-3 h-3 text-white" />
                    )}
                </div>
            )}
            
            {children}
        </div>
    );
}

// Drag Overlay - visual do item sendo arrastado
function DragOverlayContent({ children }: { children: React.ReactNode }) {
    return (
        <div className="opacity-90 scale-105 rotate-1 shadow-2xl shadow-blue-500/30">
            {children}
        </div>
    );
}

/**
 * DraggableGridLayout - Grid with individual widget drag & drop
 * 
 * Features:
 * - Each widget has its own drag handle
 * - Visual feedback (green = valid, red = invalid)
 * - Snap to grid positions
 * - Persists order to localStorage
 */
export default function DraggableGridLayout({ 
    children, 
    widgetIds,
    investigationId,
    columns = 2 
}: DraggableGridLayoutProps) {
    const [items, setItems] = useState<string[]>(widgetIds);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved order from localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const storageKey = `widget_order_${investigationId}`;
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
            try {
                const savedOrder = JSON.parse(saved);
                // Validate that all IDs exist
                if (Array.isArray(savedOrder) && savedOrder.length === widgetIds.length) {
                    const allExist = savedOrder.every((id: string) => widgetIds.includes(id));
                    if (allExist) {
                        setItems(savedOrder);
                    }
                }
            } catch (e) {
                console.warn('Failed to parse saved widget order');
            }
        }
        setIsLoaded(true);
    }, [investigationId, widgetIds]);

    // Save order to localStorage
    const saveOrder = useCallback((order: string[]) => {
        if (typeof window === 'undefined') return;
        const storageKey = `widget_order_${investigationId}`;
        localStorage.setItem(storageKey, JSON.stringify(order));
    }, [investigationId]);

    // Sensors for drag detection
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Minimum drag distance before activation
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handler for drag start
    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    // Handler for drag over (visual feedback)
    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { over } = event;
        setOverId(over?.id as string || null);
    }, []);

    // Handler for drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        
        if (over && active.id !== over.id) {
            setItems((currentItems) => {
                const oldIndex = currentItems.indexOf(active.id as string);
                const newIndex = currentItems.indexOf(over.id as string);
                const newOrder = arrayMove(currentItems, oldIndex, newIndex);
                saveOrder(newOrder);
                return newOrder;
            });
        }
        
        setActiveId(null);
        setOverId(null);
    }, [saveOrder]);

    // Map children to items order
    const orderedChildren = items.map(id => {
        const index = widgetIds.indexOf(id);
        return children[index];
    });

    // Get active child for overlay
    const activeChild = activeId 
        ? children[widgetIds.indexOf(activeId)]
        : null;

    if (!isLoaded) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {widgetIds.map(id => (
                    <div key={id} className="h-[350px] bg-slate-800/50 rounded-lg" />
                ))}
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={items} strategy={rectSortingStrategy}>
                <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4`}>
                    {items.map((id, index) => (
                        <SortableWidget 
                            key={id} 
                            id={id}
                            isOver={overId === id && activeId !== id}
                            isValid={overId === id && activeId !== id}
                        >
                            {orderedChildren[index]}
                        </SortableWidget>
                    ))}
                </div>
            </SortableContext>

            {/* Drag Overlay - preview while dragging */}
            <DragOverlay dropAnimation={{
                duration: 250,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
                {activeId && activeChild ? (
                    <DragOverlayContent>
                        {activeChild}
                    </DragOverlayContent>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

// Hook for external use
export function useGridLayout(investigationId: string, defaultOrder: string[]) {
    const [order, setOrder] = useState(defaultOrder);
    
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem(`widget_order_${investigationId}`);
        if (saved) {
            try {
                setOrder(JSON.parse(saved));
            } catch {}
        }
    }, [investigationId]);

    return { order, setOrder };
}
