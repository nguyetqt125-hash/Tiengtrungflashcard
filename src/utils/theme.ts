import { STORAGE_KEYS } from '../constants';

export type ThemeMode = 'light' | 'dark';

export const getStoredTheme = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch (e) {
    console.error('Error reading theme from localStorage:', e);
  }
  return 'light';
};

export const applyTheme = (theme: ThemeMode) => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {
    console.error('Error saving theme:', e);
  }

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};
