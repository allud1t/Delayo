import { ThemePreference } from '@types';
import {
  getSystemThemePreference,
  getThemePreference,
  setThemePreference,
  subscribeToStorageKey,
} from '@utils/extensionStorage';
import { useEffect, useState } from 'react';

function applyTheme(theme: ThemePreference): void {
  document.documentElement.setAttribute('data-theme', theme);
}

const useTheme = (): {
  theme: ThemePreference;
  toggleTheme: () => void;
} => {
  const [theme, setTheme] = useState<ThemePreference>('light');
  const [usesSystemTheme, setUsesSystemTheme] = useState(false);

  useEffect(() => {
    const loadTheme = async (): Promise<void> => {
      const savedTheme = await getThemePreference();
      const nextTheme = savedTheme ?? getSystemThemePreference();

      setUsesSystemTheme(!savedTheme);
      setTheme(nextTheme);
      applyTheme(nextTheme);
    };

    void loadTheme();
  }, []);

  useEffect(() => {
    return subscribeToStorageKey('theme', (value) => {
      const nextTheme =
        value === 'light' || value === 'dark'
          ? value
          : getSystemThemePreference();

      setUsesSystemTheme(!(value === 'light' || value === 'dark'));
      setTheme(nextTheme);
      applyTheme(nextTheme);
    });
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (event: MediaQueryListEvent): void => {
      if (!usesSystemTheme) {
        return;
      }

      const nextTheme = event.matches ? 'dark' : 'light';
      setTheme(nextTheme);
      applyTheme(nextTheme);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [usesSystemTheme]);

  const toggleTheme = (): void => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';

    setUsesSystemTheme(false);
    setTheme(nextTheme);
    applyTheme(nextTheme);
    void setThemePreference(nextTheme);
  };

  return { theme, toggleTheme };
};

export default useTheme;
