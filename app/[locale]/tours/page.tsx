import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PageHero from "@/components/PageHero";
import PricingTable from "@/components/PricingTable";
import PhotoSlot from "@/components/PhotoSlot";
import { localeAlternates } from "@/i18n/seo";
import { getActiveTours } from "@/lib/tour-settings";
import { getSitePhotos } from "@/lib/photos";

type Props = {
  params: Promise<{ locale: string }> | { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("toursTitle"),
    description: t("toursDescription"),
    openGraph: {
      title: t("toursTitle"),
      description: t("toursDescription"),
      locale,
    },
    alternates: localeAlternates(locale, "/tours"),
  };
}

export default async function ToursPage({ params }: Props) {
  const { locale } = await Promise.resolve(params);
  setRequestLocale(locale);
  const t = await getTranslations("tours");
  const tours = await getActiveTours();
  const photos = await getSitePhotos(locale);
  const map = photos.bySlot["tours-map"];

  return (
    <>
      <PageHero
        title={t("pageTitle")}
        subtitle={t("pageIntro")}
        imageSrc="/gallery/vehicle-graben-three-quarter.jpg"
        imageAlt={t("pageTitle")}
        objectPosition="center 55%"
      />
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-page-glow" />
        <div className="section-shell relative py-14 sm:py-16">
          <p className="mb-8 font-sans text-sm text-navy/55">{t("payOnArrival")}</p>
          <PricingTable tours={tours} />

          <section className="mt-16 overflow-hidden border border-navy/10 bg-cream-soft/60">
            <div className={`grid ${map?.src ? "lg:grid-cols-2" : ""}`}>
              <div className="flex flex-col justify-center p-7 sm:p-9">
                <p className="section-kicker">{t("mapKicker")}</p>
                <h2 className="mt-3 font-display text-display-md text-navy">{t("mapTitle")}</h2>
                <div className="ornament-rule mt-4" />
                <p className="mt-4 font-sans text-sm leading-relaxed text-navy/65">
                  {t("mapNote")}
                </p>
              </div>
              {map?.src && (
                <div className="relative min-h-[260px] lg:min-h-[320px]">
                  <PhotoSlot
                    title={map.caption ?? t("mapShotTitle")}
                    alt={map.alt ?? t("mapShotAlt")}
                    variant="map"
                    src={map.src}
                    mode="media"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="absolute inset-0 min-h-[260px]"
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
