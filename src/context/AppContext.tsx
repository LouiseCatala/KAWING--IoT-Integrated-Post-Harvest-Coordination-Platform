import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../lib/translations';

type Theme = 'light' | 'dark';

interface AppContextType {
  lang: Language;
  theme: Theme;
  grainyScreen: string;
  setGrainyScreen: React.Dispatch<React.SetStateAction<string>>;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  t: (key: keyof typeof translations['en']) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Load saved preferences; new visitors start in dark mode.
  const [lang, setLang] = useState<Language>(() => {
    const stored = localStorage.getItem('kawing_lang');
    return (stored === 'en' || stored === 'tl') ? stored : 'en';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem('kawing_theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [grainyScreen, setGrainyScreen] = useState('');

  // Sync the selected theme to the document and persist it when storage is available.
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('kawing_theme', theme);
    } catch {
      // Theme switching still works when browser storage is unavailable.
    }
  }, [theme]);

  // Sync language changes to localStorage
  useEffect(() => {
    localStorage.setItem('kawing_lang', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'tl' : 'en'));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Safe translation helper
  const t = (key: keyof typeof translations['en']): string => {
    const dict = translations[lang] || translations['en'];
    const value = dict[key];
    if (value !== undefined) {
      return value;
    }
    // Fallback to English translation
    return translations['en'][key] || String(key);
  };

  return (
    <AppContext.Provider value={{ lang, theme, toggleLanguage, toggleTheme, t, grainyScreen, setGrainyScreen }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
