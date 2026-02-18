'use client';

import React from 'react';

interface ResponsiveWidgetRowProps {
    children: React.ReactNode;
    className?: string;
    /** First widget is open */
    firstOpen?: boolean;
    /** Second widget is open */
    secondOpen?: boolean;
}

/**
 * ResponsiveWidgetRow - Grid that adapts based on widget states
 * 
 * Rules:
 * - Both open: 50% each (grid-cols-2)
 * - One open, one closed: Open takes 100%, closed goes below
 * - Both closed: 50% each on same line
 */
export function ResponsiveWidgetRow({ 
    children, 
    className = '',
    firstOpen = true,
    secondOpen = true
}: ResponsiveWidgetRowProps) {
    // Determine if we have asymmetric state (one open, one closed)
    const oneOpenOneClosed = (firstOpen && !secondOpen) || (!firstOpen && secondOpen);
    
    return (
        <div 
            className={`
                transition-all duration-300 ease-in-out
                ${oneOpenOneClosed 
                    ? 'flex flex-col gap-4' 
                    : 'grid grid-cols-1 md:grid-cols-2 gap-4'}
                ${className}
            `}
        >
            {children}
        </div>
    );
}

interface ResponsiveWidgetProps {
    children: React.ReactNode;
    className?: string;
    /** Whether this widget is open */
    isOpen?: boolean;
    /** Whether this is the first widget (affects ordering) */
    isFirst?: boolean;
    /** Whether the other widget in the pair is open */
    otherOpen?: boolean;
}

/**
 * ResponsiveWidget - Wrapper that adjusts width based on state
 */
export function ResponsiveWidget({ 
    children, 
    className = '',
    isOpen = true,
    isFirst = true,
    otherOpen = true
}: ResponsiveWidgetProps) {
    // Determine if we should be full width
    const shouldBeFullWidth = isOpen && !otherOpen;
    // Closed widgets go below open widgets
    const shouldMoveBelow = !isOpen && otherOpen;

    return (
        <div 
            className={`
                transition-all duration-300 ease-in-out
                ${shouldBeFullWidth ? 'w-full' : ''}
                ${className}
            `}
            style={{
                order: shouldMoveBelow ? 1 : 0
            }}
        >
            {children}
        </div>
    );
}

// Hook for external use (deprecated - use props instead)
export function useResponsiveWidget() {
    return null;
}
