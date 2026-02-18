/**
 * App.tsx — Nexus Market Mobile Entry Point
 * 
 * Wraps the HomeScreen with ThemeProvider for dark/light mode.
 */

import React from 'react';
import { HomeScreen } from './src/screens/HomeScreen';
import { useThemeProvider, ThemeContext } from './src/hooks/useTheme';

export default function App() {
  const theme = useThemeProvider();

  return (
    <ThemeContext.Provider value={theme}>
      <HomeScreen />
    </ThemeContext.Provider>
  );
}
