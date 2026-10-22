import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { htmlLang, isLocale, isRtlLocale, routing } from "@/i18n/routing";
import { bodyFontClasses } from "@/app/fonts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import JsonLd from "@/components/JsonLd";
import "../globals.css";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Prices, business info and testimonials come from Supabase, so fully static
 * pages would keep serving whatever was true at deploy time. Five minutes keeps
 * the marketing pages effectively static while letting /admin edits show up
 * without a rebuild.
 */
export const revalidate = 300;

export default async function LocaleLayout({ children, params }: Props) {
  const resolved = await Promise.resolve(params);
  const locale = resolved.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  // This is a root layout (there is no app/layout.tsx): it owns <html> so
  // lang/dir come from the route param. Reading the locale from request
  // headers in a shared root layout instead made every page render per
  // request and never hit the CDN cache.
  return (
    <html lang={htmlLang(locale)} dir={isRtlLocale(locale) ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className={bodyFontClasses(locale)}>
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col bg-cream-mist bg-page-glow">
            <JsonLd />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CookieConsent />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
