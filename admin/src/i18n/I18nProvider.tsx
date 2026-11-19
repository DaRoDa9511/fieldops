import { createContext, use, useCallback, useMemo, useState, type PropsWithChildren } from 'react'

import { dictionaries, type Language, type TranslationKey } from '@/i18n/translations'
import { setFormatLocale } from '@/lib/format'

type I18n = {
  language: Language
  setLanguage: (l: Language) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const STORAGE_KEY = 'fieldops-lang'

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'es') return saved
  } catch {
    /* storage blocked → fall back to browser language */
  }
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en'
}

const I18nContext = createContext<I18n | null>(null)

/** Tiny i18n layer (no dependency): typed keys, `{var}` interpolation, persisted choice. */
export function I18nProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>(initialLanguage)
  setFormatLocale(language === 'es' ? 'es' : 'en-US')

  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l)
    document.documentElement.lang = l
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* not persisted in private mode */
    }
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let s: string = dictionaries[language][key] ?? dictionaries.en[key] ?? key
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
      return s
    },
    [language],
  )

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])
  return <I18nContext value={value}>{children}</I18nContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const ctx = use(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

// eslint-disable-next-line react-refresh/only-export-components
export const useT = () => useI18n().t
