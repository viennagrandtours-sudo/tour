import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localeAlternates } from "@/i18n/seo";
import PageHero from "@/components/PageHero";
import BookingPaymentComplete from "@/components/BookingPaymentComplete";

type Props = {
  params: Promise<{ locale: string }> | { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("bookTitle"),
    description: t("bookDescription"),
    robots: { index: false, follow: false },
    alternates: localeAlternates(locale, "/book/complete"),
  };
}

export default async function BookCompletePage({ params }: Props) {
  const { locale } = await Promise.resolve(params);
  setRequestLocale(locale);
  const t = await getTranslations("booking");

  return (
    <>
      <PageHero
        title={t("paymentCheckingTitle")}
        subtitle={t("paymentCheckingBody")}
        imageSrc="/gallery/vehicle-front-grille-night.jpg"
        imageAlt={t("title")}
        objectPosition="center 60%"
      />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-page-glow" />
        <div className="section-shell relative max-w-3xl py-14 sm:py-16">
          <Suspense
            fallback={
              <div className="paper-surface p-8 font-sans text-navy/70">
                {t("paymentCheckingBody")}
              </div>
            }
          >
            <BookingPaymentComplete />
          </Suspense>
        </div>
      </div>
    </>
  );
}
