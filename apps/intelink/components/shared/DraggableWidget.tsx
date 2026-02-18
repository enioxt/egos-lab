'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Move } from 'lucide-react';

interface DraggableWidgetProps {
    id: string;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
}

/**
 * DraggableWidget - Wrapper para tornar qualquer widget arrastável
 * 
 * Visual Feedback:
 * - Hover: Handle aparece à esquerda
 * - Dragging: Widget fica com borda azul + escala
 * - Over: Destino fica verde com efeito "magnético"
 * - Drop: Animação suave de encaixe
 */
export default function DraggableWidget({ 
    id, 
    children, 
    disabled = false,
    className = '',
}: DraggableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
        active,
    } = useSortable({ 
        id, 
        disabled,
        transition: {
            duration: 250,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)',
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    // Classes dinâmicas baseadas no estado
    const stateClasses = [
        // Base
        'relative group/drag transition-all duration-200',
        className,
        // Dragging - sendo arrastado
        isDragging && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 rounded-xl scale-[0.98] shadow-2xl',
        // Over - destino válido (efeito magnético)
        isOver && !isDragging && 'ring-2 ring-emerald-400 rounded-xl bg-emerald-500/10 scale-[1.02] shadow-lg shadow-emerald-500/20',
        // Active (outro widget sendo arrastado)
        active && !isDragging && !isOver && 'opacity-80',
    ].filter(Boolean).join(' ');

    return (
        <div 
            ref={setNodeRef} 
            style={style}
            className={stateClasses}
        >
            {/* Drag Handle - LEFT side */}
            {!disabled && (
                <div
                    {...attributes}
                    {...listeners}
                    className={`
                        absolute -left-4 top-1/2 -translate-y-1/2 z-30 
                        transition-all duration-200 
                        cursor-grab active:cursor-grabbing 
                        p-2 rounded-lg shadow-xl border
                        ${isDragging 
                            ? 'opacity-100 bg-blue-600 border-blue-400 scale-110' 
                            : 'opacity-0 group-hover/drag:opacity-100 bg-slate-700 hover:bg-blue-600 border-slate-600 hover:border-blue-400'
                        }
                    `}
                    title="Arraste para reorganizar"
                >
                    <GripVertical className="w-5 h-5 text-white" />
                </div>
            )}
            
            {/* Magnetic effect indicator when dragging over */}
            {isOver && !isDragging && (
                <div className="absolute inset-0 rounded-xl border-2 border-dashed border-emerald-400 pointer-events-none animate-pulse" />
            )}
            
            {children}
        </div>
    );
}
