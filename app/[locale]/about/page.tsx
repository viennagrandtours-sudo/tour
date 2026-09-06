import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localeAlternates } from "@/i18n/seo";
import PageHero from "@/components/PageHero";
import PhotoSlot from "@/components/PhotoSlot";
import { Link } from "@/i18n/navigation";
import { getSitePhotos } from "@/lib/photos";

type Props = {
  params: Promise<{ locale: string }> | { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    alternates: localeAlternates(locale, "/about"),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await Promise.resolve(params);
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const nav = await getTranslations("nav");
  const valueKeys = ["care", "city", "honesty"] as const;
  const storyKeys = ["story1", "story2", "story3"] as const;
  const rawSpecs = t.raw("vehicleSpecs");
  const specs = (Array.isArray(rawSpecs) ? rawSpecs : []) as string[];

  const photos = await getSitePhotos(locale);
  const founder = photos.bySlot["about-founder"];
  const vehicle = photos.bySlot["about-detail"];

  return (
    <>
      <PageHero
        title={t("title")}
        subtitle={t("intro")}
        imageSrc="/gallery/fleet-lineup.jpg"
        imageAlt={t("title")}
        objectPosition="center 40%"
      />
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-page-glow" />
        <div className="section-shell relative space-y-24 py-16">
          <section
            className={`grid items-center gap-12 ${founder?.src ? "lg:grid-cols-2" : ""}`}
          >
            <div>
              <p className="section-kicker">{t("storyKicker")}</p>
              <h2 className="mt-3 font-display text-display-md text-navy">{t("storyTitle")}</h2>
              <div className="ornament-rule mt-4" />
              <div className="mt-5 space-y-4 font-sans text-base leading-relaxed text-navy/70">
                {storyKeys.map((key) => (
                  <p key={key}>{t(key)}</p>
                ))}
              </div>
              <Link href="/book" className="btn-primary mt-8">
                {nav("bookCta")}
              </Link>
            </div>
            {founder?.src && (
              <PhotoSlot
                title={founder.caption ?? t("founderShotTitle")}
                alt={founder.alt ?? t("founderShotAlt")}
                variant="vehicle"
                src={founder.src}
                mode="media"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="aspect-[4/3]"
              />
            )}
          </section>

          <section
            className={`grid items-center gap-12 ${vehicle?.src ? "lg:grid-cols-2" : ""}`}
          >
            {vehicle?.src && (
              <PhotoSlot
                title={vehicle.caption ?? t("vehicleShotTitle")}
                alt={vehicle.alt ?? t("vehicleShotAlt")}
                variant="vehicle"
                src={vehicle.src}
                mode="media"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="order-2 aspect-[4/3] lg:order-1"
              />
            )}
            <div className={vehicle?.src ? "order-1 lg:order-2" : undefined}>
              <p className="section-kicker">{t("vehicleKicker")}</p>
              <h2 className="mt-3 font-display text-display-md text-navy">{t("vehicleTitle")}</h2>
              <div className="ornament-rule mt-4" />
              <div className="mt-5 space-y-4 font-sans text-base leading-relaxed text-navy/70">
                <p>{t("vehicle1")}</p>
                <p>{t("vehicle2")}</p>
              </div>
              <h3 className="section-kicker mt-7">{t("vehicleSpecsTitle")}</h3>
              <ul className="mt-3 space-y-2">
                {specs.map((spec) => (
                  <li key={spec} className="flex gap-3 font-sans text-sm text-navy/70">
                    <span className="mt-2 h-px w-3 shrink-0 bg-gold" aria-hidden />
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <div className="max-w-xl">
              <p className="section-kicker">{t("valuesKicker")}</p>
              <h2 className="mt-3 font-display text-display-md text-navy">{t("valuesTitle")}</h2>
              <div className="ornament-rule mt-4" />
            </div>
            <ul className="mt-10 grid gap-0 border-t border-navy/10 sm:grid-cols-3">
              {valueKeys.map((key, i) => (
                <li
                  key={key}
                  className={`border-navy/10 py-8 sm:px-6 ${
                    i > 0 ? "border-t sm:border-s sm:border-t-0" : ""
                  }`}
                >
                  <span className="font-display text-sm tracking-caption text-gold/70">
                    0{i + 1}
                  </span>
                  <h3 className="mt-3 font-display text-2xl text-navy">
                    {t(`values.${key}.title`)}
                  </h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-navy/65">
                    {t(`values.${key}.text`)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
