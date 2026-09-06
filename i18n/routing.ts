import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "de", "es", "it", "ar", "zh", "pt", "tr"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const RTL_LOCALES: readonly Locale[] = ["ar"];

export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  ar: "العربية",
  zh: "中文",
  pt: "Português",
  tr: "Türkçe",
};

export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

export function isRtlLocale(locale: string): boolean {
  return locale === "ar";
}

/** BCP 47 tag for `<html lang>`. URL prefixes stay short (`zh`, not `zh-CN`). */
export function htmlLang(locale: string): string {
  if (locale === "zh") return "zh-CN";
  return locale;
}
