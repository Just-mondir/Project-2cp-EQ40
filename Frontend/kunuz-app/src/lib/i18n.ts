import arMessages from "../../messages/ar.json";
import enMessages from "../../messages/en.json";
import frMessages from "../../messages/fr.json";

export const SUPPORTED_LOCALES = ["ar", "fr", "en"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export type AppDirection = "ltr" | "rtl";

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_STORAGE_KEY = "locale";
export const LOCALE_COOKIE_NAME = "locale";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  ar: "\uD83C\uDDE9\uD83C\uDDFF \u0627\u0644\u0639\u0631\u0628\u064A\u0629",
  fr: "\uD83C\uDDEB\uD83C\uDDF7 Fran\u00E7ais",
  en: "\uD83C\uDDEC\uD83C\uDDE7 English",
};

const MESSAGES = {
  ar: arMessages,
  fr: frMessages,
  en: enMessages,
} as const;

export function isValidLocale(value: string | null | undefined): value is AppLocale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as AppLocale));
}

export function resolveLocale(value: string | null | undefined): AppLocale {
  return isValidLocale(value) ? value : DEFAULT_LOCALE;
}

export function getLocaleDirection(locale: AppLocale): AppDirection {
  return locale === "ar" ? "rtl" : "ltr";
}

export function getMessages(locale: AppLocale) {
  return MESSAGES[locale];
}

export function getDateLocale(locale: AppLocale) {
  switch (locale) {
    case "ar":
      return "ar-DZ";
    case "fr":
      return "fr-FR";
    default:
      return "en-US";
  }
}
