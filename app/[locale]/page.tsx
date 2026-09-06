import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { localeAlternates } from "@/i18n/seo";
import TourCard from "@/components/TourCard";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import PhotoSlot from "@/components/PhotoSlot";
import { getActiveTours } from "@/lib/tour-settings";
import { getSitePhotos, slotPhoto } from "@/lib/photos";
import { getSupabaseServer, type Testimonial } from "@/lib/supabase";

type Props = {
  params: Promise<{ locale: string }> | { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations({ locale, namespace: "meta" });

  // Social preview image, once the owner has uploaded one in /admin/photos.
  const photos = await getSitePhotos(locale);
  const social = slotPhoto(photos, "og-social");
  const images = social?.uploaded && social.src ? [{ url: social.src }] : undefined;

  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    openGraph: {
      title: t("homeTitle"),
      description: t("homeDescription"),
      locale,
      type: "website",
      siteName: t("siteName"),
      ...(images ? { images } : {}),
    },
    alternates: localeAlternates(locale),
  };
}

async function getTestimonials(locale: string): Promise<Testimonial[] | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .eq("published", true)
    .eq("locale", locale)
    .order("created_at", { ascending: false })
    .limit(8);

  return data as Testimonial[] | null;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await Promise.resolve(params);
  setRequestLocale(locale);

  const t = await getTranslations("hero");
  const trust = await getTranslations("trust");
  const tours = await getTranslations("tours");
  const why = await getTranslations("why");
  const gallery = await getTranslations("gallery");
  const testimonials = await getTranslations("testimonials");
  const remoteTestimonials = await getTestimonials(locale);
  const tourTiers = await getActiveTours();
  const photos = await getSitePhotos(locale);

  // Hero photo: the dedicated hero upload, or the Ringstrasse shot (v1) while
  // that slot is empty. Wording stays the finalised copy unless the owner has
  // written their own alt text or caption in /admin/photos.
  const hero = slotPhoto(photos, "hero");

  const whyKeys = ["personal", "vintage", "languages", "pace"] as const;
  const teaserKeys = [
    { key: "v1" as const, variant: "vehicle" as const, span: "md:col-span-2 md:row-span-2" },
    { key: "c1" as const, variant: "city" as const, span: "" },
    { key: "c7" as const, variant: "city" as const, span: "" },
    { key: "c9" as const, variant: "city" as const, span: "md:col-span-2" },
    { key: "c10" as const, variant: "city" as const, span: "" },
    { key: "v8" as const, variant: "vehicle" as const, span: "" },
  ];
  const teaserPhotos = teaserKeys.filter(({ key }) => Boolean(photos.bySlot[key]?.src));
  const hasRealTestimonials = Boolean(remoteTestimonials?.length);

  return (
    <>
      {/* Full-bleed hero — one composition, brand-first */}
      <section className="relative min-h-[100svh] overflow-hidden bg-navy-ink text-cream">
        {hero?.src ? (
          <div className="absolute inset-0 animate-soft-pan will-change-transform">
            <PhotoSlot
              title={t("shotTitle")}
              hint={hero.caption ?? t("shotHint")}
              alt={hero.alt ?? t("imageAlt")}
              variant="vehicle"
              mode="media"
              src={hero.src}
              sizes="100vw"
              className="h-full min-h-[100svh] w-full"
              // Car sits mid-lower in the Graben three-quarter; bias cover crop to the grille/body.
              objectPosition="center 58%"
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-forest-depth" aria-hidden />
        )}
        {/* One soft bottom wash for type — keep car paint visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-ink/80 via-navy-ink/25 to-transparent" />

        <div className="section-shell relative flex min-h-[calc(100svh-4.5rem)] flex-col justify-end pb-14 pt-10 sm:pb-20 sm:pt-12">
          <p className="animate-fade-up font-display text-[clamp(2.6rem,7vw,5.25rem)] font-semibold leading-[0.95] tracking-brand text-cream">
            {t("brand")}
          </p>
          <div className="ornament-rule mt-5 animate-rule-draw delay-100" />
          <h1 className="mt-6 max-w-2xl animate-fade-up font-display text-[clamp(1.65rem,3.4vw,2.65rem)] font-normal leading-snug tracking-display text-cream/92 delay-180">
            {t("headline")}
          </h1>
          <p className="mt-4 max-w-lg animate-fade-up font-sans text-base leading-relaxed text-cream/72 sm:text-lg delay-260">
            {t("subline")}
          </p>
          <div className="mt-9 flex flex-wrap gap-3 animate-fade-up delay-340">
            <Link href="/book" className="btn-primary">
              {t("cta")}
            </Link>
            <Link href="/tours" className="btn-secondary">
              {t("secondaryCta")}
            </Link>
          </div>
          <p className="mt-4 max-w-lg animate-fade-up font-sans text-sm text-cream/60 delay-340">
            {t("payOnArrival")}
          </p>
        </div>
      </section>

      {/* Trust — verifiable facts about the service, not borrowed press logos */}
      <section className="relative border-b border-navy/8 bg-cream-mist">
        <div className="pointer-events-none absolute inset-0 bg-section-glow opacity-70" />
        <div className="section-shell relative flex flex-col items-stretch gap-8 py-10 sm:flex-row sm:items-center sm:justify-between sm:gap-12">
          <div className="text-center sm:text-start">
            <p className="font-display text-4xl tracking-display text-navy sm:text-5xl">
              {trust("statValue")}
              <span className="ms-2 font-sans text-sm font-normal tracking-wide text-navy/45">
                {trust("statUnit")}
              </span>
            </p>
            <p className="mt-1 max-w-xs font-sans text-sm text-navy/55">{trust("statCaption")}</p>
          </div>
          <div className="hidden h-12 w-px bg-gradient-to-b from-transparent via-navy/15 to-transparent sm:block" />
          <div className="flex-1">
            <p className="section-kicker text-center sm:text-start">{trust("kicker")}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:justify-start">
              {[trust("item1"), trust("item2"), trust("item3")].map((label) => (
                <span
                  key={label}
                  className="font-display text-lg tracking-wide text-navy/35 sm:text-xl"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tour highlights — conversion engine: prices + Book, close under the fold */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-page-glow" />
        <div className="section-shell relative">
          <div className="max-w-xl">
            <p className="section-kicker">{tours("kicker")}</p>
            <h2 className="mt-3 font-display text-display-lg text-navy">
              {tours("sectionTitle")}
            </h2>
            <div className="ornament-rule mt-4" />
            <p className="mt-4 font-sans text-base leading-relaxed text-navy/60">
              {tours("sectionSub")}
            </p>
            <p className="mt-3 font-sans text-sm text-navy/50">{tours("payOnArrival")}</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tourTiers.map((tour, i) => (
              <TourCard
                key={tour.id}
                tourId={tour.id}
                price={tour.pricePerPerson}
                minGuests={tour.minGuests}
                featured={i === 1}
              />
            ))}
          </div>
          <div className="mt-10">
            <Link href="/tours" className="btn-ghost">
              {tours("viewAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials — only when real guest reviews exist */}
      {hasRealTestimonials && (
        <section className="relative overflow-hidden border-t border-navy/8 py-24">
          <div className="absolute inset-0 bg-cream-warm/50" />
          <div className="pointer-events-none absolute inset-0 bg-pattern-grid bg-grid opacity-60" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 55% 50% at 50% 40%, rgba(247,243,235,0.9), transparent 70%)",
            }}
          />
          <div className="section-shell relative">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-kicker">{testimonials("sub")}</p>
              <h2 className="mt-3 font-display text-display-lg text-navy">
                {testimonials("title")}
              </h2>
              <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent" />
            </div>
            <div className="mt-12">
              <TestimonialCarousel remote={remoteTestimonials} />
            </div>
          </div>
        </section>
      )}

      {/* Why ride — objection handling after price and proof */}
      <section className="relative overflow-hidden text-cream">
        <div className="absolute inset-0 bg-forest-depth" />
        <div className="pointer-events-none absolute inset-0 bg-pattern-lines opacity-25" />
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 80% 20%, rgba(196,163,90,0.12), transparent 55%)",
          }}
        />
        <div className="section-shell relative py-24">
          <div className="max-w-xl">
            <p className="section-kicker text-gold-pale/80">{why("kicker")}</p>
            <h2 className="mt-3 font-display text-display-lg">{why("title")}</h2>
            <div className="ornament-rule mt-4" />
          </div>
          <ul className="mt-14 grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {whyKeys.map((key, i) => (
              <li
                key={key}
                className={`border-cream/10 py-6 sm:px-6 sm:py-0 ${
                  i > 0 ? "border-t sm:border-s sm:border-t-0" : ""
                } ${i > 1 ? "lg:border-s" : ""} ${i === 2 ? "sm:border-t lg:border-t-0" : ""} ${
                  i === 3 ? "sm:border-t lg:border-t-0" : ""
                }`}
              >
                <span className="font-display text-sm tracking-caption text-gold/60">
                  0{i + 1}
                </span>
                <h3 className="mt-3 font-display text-2xl leading-snug text-gold-light">
                  {why(`items.${key}.title`)}
                </h3>
                <p className="mt-3 font-sans text-sm leading-relaxed text-cream/68">
                  {why(`items.${key}.text`)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Gallery teaser — only real photos */}
      {teaserPhotos.length > 0 && (
        <section className="relative py-24">
          <div className="pointer-events-none absolute inset-0 bg-section-glow opacity-80" />
          <div className="section-shell relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-lg">
                <p className="section-kicker">{gallery("kicker")}</p>
                <h2 className="mt-3 font-display text-display-lg text-navy">
                  {gallery("teaserTitle")}
                </h2>
                <div className="ornament-rule mt-4" />
                <p className="mt-4 font-sans text-navy/60">{gallery("teaserSub")}</p>
              </div>
              <Link href="/gallery" className="btn-ghost shrink-0">
                {gallery("viewAll")}
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-4">
              {teaserPhotos.map(({ key, variant, span }) => {
                const photo = photos.bySlot[key];
                return (
                  <div
                    key={key}
                    className={`group relative overflow-hidden ${span} ${
                      span.includes("row-span")
                        ? "aspect-auto min-h-[240px] md:min-h-0"
                        : "aspect-[4/3]"
                    }`}
                  >
                    <PhotoSlot
                      title={photo?.caption ?? gallery(`items.${key}.title`)}
                      alt={photo?.alt ?? gallery(`items.${key}.alt`)}
                      variant={variant}
                      src={photo?.src}
                      mode="media"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className={`h-full w-full transition duration-700 ease-elegant group-hover:scale-[1.02] ${
                        span.includes("row-span") ? "min-h-[240px] md:min-h-full" : ""
                      }`}
                    />
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-navy-ink/75 via-navy-ink/25 to-transparent px-3 pb-3 pt-10">
                      <span className="font-display text-sm leading-snug text-cream sm:text-base">
                        {photo?.caption ?? gallery(`items.${key}.title`)}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Closing CTA — distinct closer copy, Book stays primary */}
      <section className="relative overflow-hidden text-cream">
        <div className="absolute inset-0 bg-forest-depth" />
        <div className="pointer-events-none absolute inset-0 bg-pattern-lines opacity-25" />
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 20% 80%, rgba(196,163,90,0.12), transparent 55%)",
          }}
        />
        <div className="section-shell relative flex flex-col items-start gap-8 py-14 sm:flex-row sm:items-center sm:justify-between sm:gap-12 sm:py-16">
          <div className="max-w-xl">
            <h2 className="font-display text-display-md leading-snug">{t("closingTitle")}</h2>
            <p className="mt-3 font-sans text-base text-cream/68">{t("closingSub")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/book" className="btn-primary">
              {t("cta")}
            </Link>
            <Link href="/tours" className="btn-secondary">
              {t("secondaryCta")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
