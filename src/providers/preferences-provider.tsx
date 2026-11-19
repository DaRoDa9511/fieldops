import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { dictionaries, type Language, type TranslationKey } from '@/i18n/translations';
import { setFormatLocale } from '@/lib/format';

export type ThemeMode = 'system' | 'light' | 'dark';

type Preferences = {
  themeMode: ThemeMode;
  language: Language;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (lang: Language) => void;
  /** Translate a key, interpolating `{placeholders}`. */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  ready: boolean;
};

const STORAGE_KEY = 'fieldops.preferences.v1';

function deviceLanguage(): Language {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? 'en';
  return locale.toLowerCase().startsWith('es') ? 'es' : 'en';
}

const PreferencesContext = createContext<Preferences | null>(null);

/**
 * User preferences (theme + language), persisted on the device.
 * Language defaults to the phone's locale; the theme defaults to the system setting.
 */
export function PreferencesProvider({ children }: PropsWithChildren) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [language, setLanguageState] = useState<Language>(deviceLanguage);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<{ themeMode: ThemeMode; language: Language }>;
        if (saved.themeMode) setThemeModeState(saved.themeMode);
        if (saved.language && saved.language in dictionaries) setLanguageState(saved.language);
      })
      .catch(() => {
        /* corrupted or unavailable storage → keep defaults */
      })
      .finally(() => setReady(true));
  }, []);

  // Keep date/number formatting in sync with the chosen language.
  setFormatLocale(language === 'es' ? 'es' : 'en-US');

  const persist = useCallback((next: { themeMode: ThemeMode; language: Language }) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      setThemeModeState(mode);
      persist({ themeMode: mode, language });
    },
    [language, persist],
  );

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      persist({ themeMode, language: lang });
    },
    [themeMode, persist],
  );

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let s: string = dictionaries[language][key] ?? dictionaries.en[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
      return s;
    },
    [language],
  );

  const value = useMemo(
    () => ({ themeMode, language, setThemeMode, setLanguage, t, ready }),
    [themeMode, language, setThemeMode, setLanguage, t, ready],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return ctx;
}

/** Shorthand for components that only need translations. */
export function useT() {
  return usePreferences().t;
}
