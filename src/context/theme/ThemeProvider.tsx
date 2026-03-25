import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LocalStorageService } from '@/services/local-storage';
import { ThemeContext } from './useThemeContext';
import type { Theme } from './types';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const rootRef = useRef(document.getElementById('root'));
  const stored = LocalStorageService.instance.get('theme') as Theme | null;
  const defaultTheme = stored ?? 'system';
  const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const [checkoutTheme, setCheckoutTheme] = useState<'light' | 'dark'>(prefersDark ? 'dark' : 'light');

  const toggleTheme = (theme: Theme) => setCurrentTheme(theme);

  const persistDarkTheme = (value: boolean) => {
    LocalStorageService.instance.set('theme:isDark', value ? 'true' : 'false');
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !currentTheme) return;

    const updateTheme = () => {
      const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;

      LocalStorageService.instance.set('theme', currentTheme);

      if (currentTheme === 'dark' || (currentTheme === 'system' && prefersDark)) {
        root.style.backgroundImage = 'none';
        document.documentElement.classList.add('dark');
        setCheckoutTheme('dark');
        persistDarkTheme(true);
        return;
      }

      // fallback to light theme
      root.style.backgroundImage = 'none';
      document.documentElement.classList.remove('dark');
      setCheckoutTheme('light');
      persistDarkTheme(false);
    };

    updateTheme();

    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [currentTheme]);

  const themeContextValue = useMemo(
    () => ({
      currentTheme,
      checkoutTheme,
      toggleTheme,
    }),
    [currentTheme, checkoutTheme],
  );

  return <ThemeContext.Provider value={themeContextValue}>{children}</ThemeContext.Provider>;
};
