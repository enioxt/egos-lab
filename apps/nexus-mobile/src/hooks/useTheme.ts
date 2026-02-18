/**
 * useTheme — React Native theme hook with persistence
 * 
 * Uses the shared ColorPalette from @nexus/shared.
 * Persists theme preference to AsyncStorage.
 */

import { useState, useCallback, useMemo, createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { themes, type ThemeMode, type ColorPalette } from '@nexus/shared';

interface ThemeContextType {
    mode: ThemeMode;
    colors: ColorPalette;
    isDark: boolean;
    toggle: () => void;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme(): ThemeContextType {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}

export function useThemeProvider(): ThemeContextType {
    const systemScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>(
        systemScheme === 'dark' ? 'dark' : 'light'
    );

    const colors = useMemo(() => themes[mode], [mode]);
    const isDark = mode === 'dark';

    const toggle = useCallback(() => {
        setModeState(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    const setMode = useCallback((newMode: ThemeMode) => {
        setModeState(newMode);
    }, []);

    return { mode, colors, isDark, toggle, setMode };
}

export { ThemeContext };
export type { ThemeMode, ColorPalette };
