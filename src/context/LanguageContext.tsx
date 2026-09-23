'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SUPPORTED_LANGUAGES } from '../config/constants';
import { DICTIONARIES } from '../locales';

export interface LanguageContextType {
  language: string;
  setLanguage: (code: string) => void;
  languages: typeof SUPPORTED_LANGUAGES;
  t: (key: string, fallback?: string) => string;
}

const STORAGE_KEY = 'weathergpt_language';
const DEFAULT_LANGUAGE = 'en';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(DEFAULT_LANGUAGE);

  // Client-side hydration: read from localStorage and validate
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const isValid = SUPPORTED_LANGUAGES.some((l) => l.code === stored);
          if (isValid) {
            setLanguageState(stored);
            document.documentElement.lang = stored;
            return;
          }
        }
      } catch {
        // Safe handling for storage restrictions
      }
      document.documentElement.lang = DEFAULT_LANGUAGE;
    }
  }, []);

  const setLanguage = (code: string) => {
    const isValid = SUPPORTED_LANGUAGES.some((l) => l.code === code);
    const targetLang = isValid ? code : DEFAULT_LANGUAGE;

    setLanguageState(targetLang);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, targetLang);
      } catch {
        // Safe handling for storage restrictions
      }
      document.documentElement.lang = targetLang;
    }
  };

  /**
   * Safe translation lookup:
   * 1. Check selected language dictionary
   * 2. Fall back to English dictionary for the key
   * 3. Fall back to supplied fallback string (if provided)
   * 4. Return the key itself as the last resort
   * Never returns undefined or blank string.
   */
  const t = (key: string, fallback?: string): string => {
    if (!key) return fallback || '';

    // 1. Look up in active language dictionary
    if (language !== 'en') {
      const activeDict = DICTIONARIES[language];
      if (activeDict && activeDict[key]) {
        return activeDict[key];
      }
    }

    // 2. Fall back to English dictionary
    const enDict = DICTIONARIES['en'];
    if (enDict && enDict[key]) {
      return enDict[key];
    }

    // 3. Fall back to supplied fallback string
    if (fallback !== undefined && fallback !== null && fallback !== '') {
      return fallback;
    }

    // 4. Return the key itself as the last resort
    return key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        languages: SUPPORTED_LANGUAGES,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
