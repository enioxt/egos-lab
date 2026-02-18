// Shared Theme Definitions
// Supports: Light, Dark, Accessibility Modes (Protanopia, Deuteranopia, High Contrast)

export type ThemeMode = 'light' | 'dark' | 'high-contrast' | 'protanopia' | 'deuteranopia';

export interface ColorPalette {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    success: string; // Critical for "Valid" items
    warning: string; // Critical for "Expiring Soon"
    error: string;   // Critical for "Expired"
}

export const themes: Record<ThemeMode, ColorPalette> = {
    light: {
        primary: '#16A34A', // Green-600
        secondary: '#F97316', // Orange-500
        background: '#FFFFFF',
        surface: '#F3F4F6', // Gray-100
        text: '#111827', // Gray-900
        textMuted: '#6B7280', // Gray-500
        border: '#E5E7EB', // Gray-200
        success: '#22C55E',
        warning: '#FBBF24',
        error: '#EF4444',
    },
    dark: {
        primary: '#22C55E', // Green-500
        secondary: '#FB923C', // Orange-400
        background: '#0F172A', // Slate-950
        surface: '#1E293B', // Slate-800
        text: '#F9FAFB', // Gray-50
        textMuted: '#94A3B8', // Slate-400
        border: '#334155', // Slate-700
        success: '#4ADE80',
        warning: '#FCD34D',
        error: '#F87171',
    },
    'high-contrast': {
        primary: '#000000',
        secondary: '#FFFFFF',
        background: '#FFFFFF',
        surface: '#000000', // Inverted for sections
        text: '#000000',
        textMuted: '#000000',
        border: '#000000',
        success: '#006400',
        warning: '#B8860B',
        error: '#8B0000',
    },
    // Colorblind friendly palettes (Simulated/Approximate benchmarks)
    'protanopia': {
        primary: '#0072B2', // Blue (Safe)
        secondary: '#CC79A7', // Reddish-Purple (Distinguishable)
        background: '#FFFFFF',
        surface: '#F3F4F6',
        text: '#111827',
        textMuted: '#6B7280',
        border: '#E5E7EB',
        success: '#56B4E9', // Sky Blue
        warning: '#F0E442', // Yellow
        error: '#D55E00', // Vermilion
    },
    'deuteranopia': {
        primary: '#0072B2',
        secondary: '#E69F00', // Orange
        background: '#FFFFFF',
        surface: '#F3F4F6',
        text: '#111827',
        textMuted: '#6B7280',
        border: '#E5E7EB',
        success: '#009E73', // Bluish Green
        warning: '#F0E442',
        error: '#D55E00',
    }
};
