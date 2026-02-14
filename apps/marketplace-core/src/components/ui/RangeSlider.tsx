'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  valueLabel?: string;
  valueSuffix?: string;
  valuePrefix?: string;
  showMinMax?: boolean;
  marks?: { value: number; label?: string }[];
  showMarkLabels?: boolean;
  color?: 'purple' | 'amber' | 'emerald' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  formatValue?: (value: number) => string;
  editable?: boolean; // Allow manual input
  compact?: boolean; // Compact mode with inline label
}

const colorClasses = {
  purple: {
    track: 'bg-purple-500',
    thumb: 'bg-purple-500 border-purple-400',
    text: 'text-purple-400',
  },
  amber: {
    track: 'bg-amber-500',
    thumb: 'bg-amber-500 border-amber-400',
    text: 'text-amber-400',
  },
  emerald: {
    track: 'bg-emerald-500',
    thumb: 'bg-emerald-500 border-emerald-400',
    text: 'text-emerald-400',
  },
  blue: {
    track: 'bg-blue-500',
    thumb: 'bg-blue-500 border-blue-400',
    text: 'text-blue-400',
  },
};

const sizeClasses = {
  sm: { track: 'h-1.5', thumb: 'w-4 h-4', label: 'text-sm', value: 'text-lg' },
  md: { track: 'h-2', thumb: 'w-5 h-5', label: 'text-sm', value: 'text-xl' },
  lg: { track: 'h-2.5', thumb: 'w-6 h-6', label: 'text-base', value: 'text-2xl' },
};

export default function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  valueLabel,
  valueSuffix = '',
  valuePrefix = '',
  showMinMax = true,
  marks,
  showMarkLabels = false,
  color = 'purple',
  size = 'md',
  formatValue,
  editable = false,
  compact = false,
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const [isEditing, setIsEditing] = useState(false);

  // Sync input value when value prop changes externally
  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toString());
    }
  }, [value, isEditing]);

  const colors = colorClasses[color];
  const sizes = sizeClasses[size];

  const percentage = ((value - min) / (max - min)) * 100;

  const normalizedMarks = (marks || [])
    .filter((m) => m.value >= min && m.value <= max)
    .sort((a, b) => a.value - b.value);

  const displayValue = formatValue
    ? formatValue(value)
    : `${valuePrefix}${value.toLocaleString('pt-BR')}${valueSuffix}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setInputValue(raw);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const numValue = parseInt(inputValue) || min;
    const clampedValue = Math.max(min, Math.min(max, numValue));
    const steppedValue = Math.round(clampedValue / step) * step;
    onChange(steppedValue);
    setInputValue(steppedValue.toString());
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  const calculateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return value;

    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + percentage * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  }, [min, max, step, value]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const newValue = calculateValue(e.clientX);
    if (newValue !== value) onChange(newValue);
  }, [calculateValue, onChange, value]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const newValue = calculateValue(e.clientX);
    if (newValue !== value) onChange(newValue);
  }, [isDragging, calculateValue, onChange, value]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  // Keyboard support
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let newValue = value;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = Math.max(min, value - step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = Math.min(max, value + step);
        break;
      case 'Home':
        newValue = min;
        break;
      case 'End':
        newValue = max;
        break;
      default:
        return;
    }
    e.preventDefault();
    onChange(newValue);
  }, [value, min, max, step, onChange]);

  // Compact mode: inline label with slider
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {label && (
          <span className="text-sm text-gray-400 whitespace-nowrap min-w-[100px]">
            {label}
          </span>
        )}
        <div className="flex-1 relative">
          <div
            ref={trackRef}
            className={`relative h-2 bg-gray-700 rounded-full cursor-pointer touch-none select-none`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            role="slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <div
              className={`absolute top-0 left-0 h-2 ${colors.track} rounded-full transition-all duration-75`}
              style={{ width: `${percentage}%` }}
            />
            {normalizedMarks.length > 0 && (
              <>
                {normalizedMarks.map((mark) => {
                  const markPercentage = ((mark.value - min) / (max - min)) * 100;
                  return (
                    <div
                      key={mark.value}
                      className="absolute top-0 w-px h-full bg-gray-400/40 pointer-events-none"
                      style={{ left: `${markPercentage}%` }}
                    />
                  );
                })}
              </>
            )}
            <div
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 ${colors.thumb} rounded-full border-2 shadow-lg transition-transform duration-75 ${isDragging ? 'scale-110' : 'hover:scale-105'
                }`}
              style={{ left: `${percentage}%` }}
            />
          </div>
        </div>
        {editable ? (
          <div className="flex items-center gap-1">
            {valuePrefix && <span className={`text-sm ${colors.text}`}>{valuePrefix}</span>}
            <input
              type="text"
              inputMode="numeric"
              value={isEditing ? inputValue : value}
              onChange={handleInputChange}
              onFocus={() => setIsEditing(true)}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className={`w-16 px-2 py-1 text-center text-lg font-bold ${colors.text} bg-gray-800 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none`}
            />
            {valueSuffix && <span className={`text-sm ${colors.text}`}>{valueSuffix}</span>}
          </div>
        ) : (
          <span className={`text-lg font-bold ${colors.text} min-w-[60px] text-right`}>
            {displayValue}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Label and Value */}
      {(label || valueLabel) && (
        <div className="flex items-center justify-between mb-3">
          {label && (
            <span className={`${sizes.label} text-gray-300 font-medium`}>
              {label}
            </span>
          )}
          {editable ? (
            <div className="flex items-center gap-1">
              {valuePrefix && <span className={`${sizes.value} ${colors.text}`}>{valuePrefix}</span>}
              <input
                type="text"
                inputMode="numeric"
                value={isEditing ? inputValue : value}
                onChange={handleInputChange}
                onFocus={() => setIsEditing(true)}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                className={`w-20 px-2 py-1 text-center ${sizes.value} font-bold ${colors.text} bg-gray-800 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none`}
              />
              {valueSuffix && <span className={`${sizes.value} ${colors.text}`}>{valueSuffix}</span>}
            </div>
          ) : (
            <span className={`${sizes.value} font-bold ${colors.text}`}>
              {valueLabel || displayValue}
            </span>
          )}
        </div>
      )}

      {/* Slider Track */}
      <div
        ref={trackRef}
        className={`relative ${sizes.track} bg-gray-700 rounded-full cursor-pointer touch-none select-none`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Filled Track */}
        <div
          className={`absolute top-0 left-0 ${sizes.track} ${colors.track} rounded-full transition-all duration-75`}
          style={{ width: `${percentage}%` }}
        />

        {/* Dynamic Ticks based on toggle */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: Math.floor((max - min) / step) + 1 }).map((_, i) => {
            const tickVal = min + i * step;
            const tickPerc = ((tickVal - min) / (max - min)) * 100;
            // Only show main ticks if too many
            if (step < (max - min) / 20 && i % 5 !== 0) return null;

            return (
              <div
                key={i}
                className={`absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full ${tickVal <= value ? 'bg-white/50' : 'bg-gray-500/50'}`}
                style={{ left: `calc(${tickPerc}% - 2px)` }}
              />
            );
          })}
        </div>


        {normalizedMarks.length > 0 && (
          <>
            {normalizedMarks.map((mark) => {
              const markPercentage = ((mark.value - min) / (max - min)) * 100;
              return (
                <div
                  key={mark.value}
                  className="absolute top-0 w-px h-full bg-gray-400/40 pointer-events-none"
                  style={{ left: `${markPercentage}%` }}
                />
              );
            })}
          </>
        )}

        {/* Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${sizes.thumb} ${colors.thumb} rounded-full border-2 shadow-lg transition-transform duration-75 ${isDragging ? 'scale-110' : 'hover:scale-105'
            }`}
          style={{ left: `${percentage}%` }}
        />
      </div>

      {showMarkLabels && normalizedMarks.length > 0 && (
        <div className="relative mt-2 h-4">
          {normalizedMarks.map((mark) => {
            const markPercentage = ((mark.value - min) / (max - min)) * 100;
            const markLabel =
              mark.label ??
              (formatValue
                ? formatValue(mark.value)
                : `${valuePrefix}${mark.value.toLocaleString('pt-BR')}${valueSuffix}`);

            const positionClass =
              markPercentage <= 0
                ? 'translate-x-0 text-left'
                : markPercentage >= 100
                  ? '-translate-x-full text-right'
                  : '-translate-x-1/2 text-center';

            return (
              <span
                key={mark.value}
                className={`absolute top-0 ${positionClass} text-xs text-gray-500 whitespace-nowrap`}
                style={{ left: `${markPercentage}%` }}
              >
                {markLabel}
              </span>
            );
          })}
        </div>
      )}

      {/* Min/Max Labels */}
      {showMinMax && (
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">
            {valuePrefix}{min.toLocaleString('pt-BR')}{valueSuffix}
          </span>
          <span className="text-xs text-gray-500">
            {valuePrefix}{max.toLocaleString('pt-BR')}{valueSuffix}
          </span>
        </div>
      )}
    </div>
  );
}
