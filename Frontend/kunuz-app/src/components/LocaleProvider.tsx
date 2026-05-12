"use client";

import { NextIntlClientProvider } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  type AppDirection,
  type AppLocale,
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
  getLocaleDirection,
  getMessages,
  isValidLocale,
} from "@/lib/i18n";

type LocaleContextValue = {
  direction: AppDirection;
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const PLATFORM_LAYOUT_DIRECTION: AppDirection = "ltr";

function persistLocale(locale: AppLocale) {
  if (typeof document !== "undefined") {
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }
}

function syncDocumentLocale(locale: AppLocale) {
  if (typeof document === "undefined") return;

  const textDirection = getLocaleDirection(locale);
  document.documentElement.lang = locale;
  // Keep the authenticated platform layout aligned like French/English,
  // even when Arabic is selected.
  document.documentElement.dir = PLATFORM_LAYOUT_DIRECTION;
  document.documentElement.dataset.locale = locale;
  document.documentElement.dataset.localeDirection = textDirection;
}

export default function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: AppLocale;
}) {
  const [locale, setLocaleState] = useState<AppLocale>(() => {
    if (typeof window !== "undefined") {
      const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isValidLocale(storedLocale)) {
        return storedLocale;
      }
    }

    return initialLocale;
  });

  useLayoutEffect(() => {
    syncDocumentLocale(locale);
  }, [locale]);

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      direction: getLocaleDirection(locale),
      locale,
      setLocale,
    }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={getMessages(locale)}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocaleSettings() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocaleSettings must be used within LocaleProvider.");
  }

  return context;
}
