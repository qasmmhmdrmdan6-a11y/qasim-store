import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dictionary, type Locale } from './dictionary';

type Dictionary = (typeof dictionary)[Locale];

interface LanguageContextValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  t: Dictionary;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'qasim_locale';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ar';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'en' ? 'en' : 'ar';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, dir]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      dir,
      t: dictionary[locale],
      setLocale: setLocaleState,
      toggleLocale: () => setLocaleState((prev) => (prev === 'ar' ? 'en' : 'ar')),
    }),
    [locale, dir],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

/** Helper for reading bilingual DB columns, e.g. pickLocalized(product, 'name') */
export function pickLocalized<T>(entity: T, field: string, locale: Locale): string {
  const record = entity as unknown as Record<string, string | undefined>;
  const key = `${field}_${locale}`;
  const fallbackKey = `${field}_ar`;
  return record[key] || record[fallbackKey] || '';
}
