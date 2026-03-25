import { createContext, useContext } from 'react';
import type { Theme } from './types';

interface ThemeContextProps {
  currentTheme: Theme | undefined;
  checkoutTheme: 'light' | 'dark' | undefined;
  toggleTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  currentTheme: undefined,
  checkoutTheme: undefined,
  toggleTheme: () => {},
});

export const useThemeContext = (): ThemeContextProps => useContext(ThemeContext);
