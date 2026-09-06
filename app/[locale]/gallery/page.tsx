import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localeAlternates } from "@/i18n/seo";
import PageHero from "@/components/PageHero";
import GalleryGrid, { type GalleryTile } from "@/components/GalleryGrid";
import { GALLERY_SHOT_IDS } from "@/lib/photo-shots";
import { getSitePhotos, type GalleryCategory } from "@/lib/photos";

type Props = {
  params: Promise<{ locale: string }> | { locale: string };
};

/** Shots that have wording in messages/*.json under gallery.items.*. */
const TRANSLATED_SHOTS = new Set<string>(GALLERY_SHOT_IDS);

const VARIANT: Record<GalleryCategory, GalleryTile["variant"]> = {
  vehicle: "vehicle",
  landmarks: "landmark",
  guests: "guest",
  city: "city",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("galleryTitle"),
    description: t("galleryDescription"),
    alternates: localeAlternates(locale, "/gallery"),
  };
}

export default async function GalleryPage({ params }: Props) {
  const { locale } = await Promise.resolve(params);
  setRequestLocale(locale);
  const t = await getTranslations("gallery");
  const photos = await getSitePhotos(locale);

  /**
   * Real photos only — empty slots stay in admin. Guest-facing titles sit under
   * the image (masonry), not as shoot-brief overlays. Owner captions from
   * /admin/photos win when present; otherwise we use the polished i18n title.
   */
  const items: GalleryTile[] = photos.gallery
    .filter((entry) => Boolean(entry.src))
    .map((entry) => {
      const slotKey = entry.slotKey && TRANSLATED_SHOTS.has(entry.slotKey) ? entry.slotKey : null;

      if (slotKey) {
        return {
          key: entry.ref,
          category: entry.category,
          variant: VARIANT[entry.category],
          title: entry.caption ?? t(`items.${slotKey}.title`),
          alt: entry.alt ?? t(`items.${slotKey}.alt`),
          src: entry.src,
          mode: "media" as const,
        };
      }

      const alt = entry.alt ?? entry.caption ?? "";
      return {
        key: entry.ref,
        category: entry.category,
        variant: VARIANT[entry.category],
        title: entry.caption ?? "",
        alt,
        src: entry.src,
        mode: "media" as const,
      };
    });

  return (
    <>
      <PageHero
        title={t("title")}
        subtitle={t("sub")}
        imageSrc="/gallery/vehicle-stephansdom-golden.jpg"
        imageAlt={t("title")}
        objectPosition="center 50%"
      />
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-page-glow" />
        <div className="section-shell relative py-14 sm:py-16">
          <GalleryGrid items={items} />
        </div>
      </div>
    </>
  );
}
