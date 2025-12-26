import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createLightTheme } from '../themes/lightTheme';
import { createDarkTheme } from '../themes/darkTheme';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'app-theme-mode';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return 'light'; // Default to light theme
  });

  // Create theme based on mode
  const theme = useMemo(() => {
    return mode === 'light' ? createLightTheme() : createDarkTheme();
  }, [mode]);

  // Save theme preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  // Set CSS custom properties based on theme mode
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      // Dark theme CSS variables
      root.style.setProperty('--bg-primary', '#121212');
      root.style.setProperty('--bg-paper', '#1e1e1e');
      root.style.setProperty('--bg-secondary', '#2a2a2a');
      root.style.setProperty('--text-primary', '#e0e0e0');
      root.style.setProperty('--text-secondary', '#a0a0a0');
      root.style.setProperty('--text-tertiary', '#666666');
      root.style.setProperty('--border-color', '#333333');
      root.style.setProperty('--border-light', '#444444');
      root.style.setProperty('--divider', '#333333');
      root.style.setProperty('--hover-bg', '#2a2a2a');
      root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.5)');
      root.style.setProperty('--shadow-light', 'rgba(0, 0, 0, 0.25)');
      root.style.setProperty('--primary-color', '#6b21a8');
      root.style.setProperty('--primary-hover', '#a855f7');
      root.style.setProperty('--gradient-start', '#0f172a');
      root.style.setProperty('--gradient-end', '#1e293b');
      root.style.setProperty('--color-purple-800', '#9333ea');
      root.style.setProperty('--color-status-awaiting', '#9333ea');
      root.style.setProperty('--color-status-open', '#10b981');
      root.style.setProperty('--color-status-completed', '#9ca3af');
    } else {
      // Light theme CSS variables
      root.style.setProperty('--bg-primary', '#f9fafb');
      root.style.setProperty('--bg-paper', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f3f4f6');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--text-secondary', '#6b7280');
      root.style.setProperty('--text-tertiary', '#9ca3af');
      root.style.setProperty('--border-color', '#e5e7eb');
      root.style.setProperty('--border-light', '#d1d5db');
      root.style.setProperty('--divider', '#e5e7eb');
      root.style.setProperty('--hover-bg', '#f3f4f6');
      root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--shadow-light', 'rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--primary-color', '#6b21a8');
      root.style.setProperty('--primary-hover', '#581c87');
      root.style.setProperty('--gradient-start', '#ffffff');
      root.style.setProperty('--gradient-end', '#f9fafb');
      root.style.setProperty('--color-purple-800', '#6b21a8');
      root.style.setProperty('--color-status-awaiting', '#6b21a8');
      root.style.setProperty('--color-status-open', '#10b981');
      root.style.setProperty('--color-status-completed', '#6b7280');
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const value = useMemo(
    () => ({
      mode,
      toggleTheme,
      theme,
    }),
    [mode, theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};




