import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Theme = 'kotor' | 'swjs' | 'professional';

interface ThemeOption {
  value: Theme;
  label: string;
  description: string;
  icon?: string;
}

const themes: ThemeOption[] = [
  {
    value: 'kotor',
    label: 'KOTOR',
    description: 'Star Wars: Knights of the Old Republic inspired theme',
    icon: '🌟'
  },
  {
    value: 'swjs',
    label: 'Jedi Survivor',
    description: 'Star Wars: Jedi Survivor inspired theme',
    icon: '⚔️'
  },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Clean, modern professional theme',
    icon: '💼'
  }
];

const THEME_STORAGE_KEY = 'pdt-ai-theme';

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('professional');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (savedTheme && themes.some(theme => theme.value === savedTheme)) {
      setCurrentTheme(savedTheme);
    }
    setIsLoaded(true);
  }, []);

  // Apply theme changes and save to localStorage
  useEffect(() => {
    if (!isLoaded) return;

    // Remove previous theme classes
    document.body.classList.remove('kotor-theme', 'swjs-theme', 'professional-theme');
    
    // Add transition class before changing theme
    document.body.classList.add('theme-transition');
    
    // Add new theme class
    document.body.classList.add(`${currentTheme}-theme`);
    
    // Save theme preference
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);

    // Optional: Remove transition class after theme change is complete
    const transitionTimeout = setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 300); // Match this with your CSS transition duration

    return () => clearTimeout(transitionTimeout);
  }, [currentTheme, isLoaded]);

  if (!isLoaded) return null;

  return (
    <div className="flex items-center space-x-4">
      <Select
        value={currentTheme}
        onValueChange={(value: Theme) => setCurrentTheme(value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue>
            <span className="flex items-center space-x-2">
              <span>{themes.find(t => t.value === currentTheme)?.icon}</span>
              <span>{themes.find(t => t.value === currentTheme)?.label}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {themes.map((theme) => (
            <SelectItem
              key={theme.value}
              value={theme.value}
              className="flex flex-col items-start py-2"
            >
              <div className="flex items-center space-x-2">
                <span>{theme.icon}</span>
                <span className="font-medium">{theme.label}</span>
              </div>
              <span className="text-sm text-muted-foreground mt-1">{theme.description}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 