import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { isLocale, routing } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import JsonLd from "@/components/JsonLd";

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

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex min-h-screen flex-col bg-cream-mist bg-page-glow">
        <JsonLd />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
      </div>
    </NextIntlClientProvider>
  );
}
