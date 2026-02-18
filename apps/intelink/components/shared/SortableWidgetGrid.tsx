'use client';

import React, { ReactNode, useMemo } from 'react';
import { useDashboardLayout } from './DashboardLayoutContext';
import DraggableWidget from './DraggableWidget';

interface WidgetConfig {
    id: string;
    component: ReactNode;
}

interface SortableWidgetGridProps {
    widgets: WidgetConfig[];
    className?: string;
}

/**
 * SortableWidgetGrid - Renders widgets in the order defined by DashboardLayoutContext
 * 
 * This component takes an array of widget configs and renders them
 * in the order stored in the context (which is persisted to localStorage).
 * 
 * Usage:
 * <SortableWidgetGrid widgets={[
 *   { id: 'widget-1', component: <Widget1 /> },
 *   { id: 'widget-2', component: <Widget2 /> },
 * ]} />
 */
export default function SortableWidgetGrid({ widgets, className = '' }: SortableWidgetGridProps) {
    const { widgetOrder } = useDashboardLayout();
    
    // Create a map for quick lookup
    const widgetMap = useMemo(() => {
        const map = new Map<string, ReactNode>();
        widgets.forEach(w => map.set(w.id, w.component));
        return map;
    }, [widgets]);
    
    // Sort widgets according to the saved order
    const sortedWidgets = useMemo(() => {
        // First, render widgets in the saved order
        const ordered: WidgetConfig[] = [];
        
        widgetOrder.forEach(id => {
            const component = widgetMap.get(id);
            if (component) {
                ordered.push({ id, component });
            }
        });
        
        // Add any widgets that aren't in the saved order (new widgets)
        widgets.forEach(w => {
            if (!widgetOrder.includes(w.id)) {
                ordered.push(w);
            }
        });
        
        return ordered;
    }, [widgetOrder, widgetMap, widgets]);
    
    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
            {sortedWidgets.map(({ id, component }) => (
                <DraggableWidget key={id} id={id}>
                    {component}
                </DraggableWidget>
            ))}
        </div>
    );
}
