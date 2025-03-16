import { useState, useEffect } from 'react';

export type Theme = 'kotor' | 'swjs' | 'professional';

const THEME_STORAGE_KEY = 'pdt-ai-theme';

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('professional');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (savedTheme && ['kotor', 'swjs', 'professional'].includes(savedTheme)) {
      setCurrentTheme(savedTheme);
    }
    setIsLoaded(true);
  }, []);

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  };

  return {
    currentTheme,
    setTheme,
    isLoaded
  };
} 