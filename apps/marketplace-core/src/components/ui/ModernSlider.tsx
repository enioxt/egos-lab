'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ModernSliderProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (val: number) => void;
    label?: string;
    formatValue?: (val: number) => string;
    className?: string;
    color?: 'amber' | 'blue' | 'purple' | 'green';
}

export default function ModernSlider({
    value,
    min,
    max,
    step = 1,
    onChange,
    label,
    formatValue,
    className = '',
    color = 'amber'
}: ModernSliderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

    const colors = {
        amber: { track: 'bg-amber-500', shadow: 'shadow-amber-500/50', text: 'text-amber-500' },
        blue: { track: 'bg-blue-500', shadow: 'shadow-blue-500/50', text: 'text-blue-500' },
        purple: { track: 'bg-purple-500', shadow: 'shadow-purple-500/50', text: 'text-purple-500' },
        green: { track: 'bg-emerald-500', shadow: 'shadow-emerald-500/50', text: 'text-emerald-500' },
    }[color];

    const updateValue = useCallback((clientX: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = x / rect.width;
        const rawValue = min + percent * (max - min);
        const steppedValue = Math.round(rawValue / step) * step;
        const finalValue = Math.max(min, Math.min(max, steppedValue));
        onChange(finalValue);
    }, [min, max, step, onChange]);

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        updateValue(e.clientX);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isDragging) updateValue(e.clientX);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <div className="flex justify-between mb-3 text-sm font-medium">
                    <span className="text-gray-400">{label}</span>
                    <span className={`${colors.text} font-bold`}>
                        {formatValue ? formatValue(value) : value}
                    </span>
                </div>
            )}

            <div
                ref={trackRef}
                className="relative h-6 flex items-center cursor-pointer touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                {/* Track Background */}
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    {/* Active Track */}
                    <div
                        className={`h-full ${colors.track} transition-all duration-75 ease-out`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {/* Thumb */}
                <div
                    className={`absolute h-5 w-5 bg-white rounded-full shadow-lg border-2 border-gray-900 transform -translate-x-1/2 transition-transform duration-75 ${isDragging ? 'scale-125' : 'hover:scale-110'} ${colors.shadow}`}
                    style={{ left: `${percentage}%` }}
                />
            </div>

            {/* Ticks */}
            <div className="flex justify-between px-1 mt-1">
                <span className="text-[10px] text-gray-500">{min}</span>
                <span className="text-[10px] text-gray-500">{max}</span>
            </div>
        </div>
    );
}
