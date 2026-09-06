import { cache } from "react";
import { getSupabaseServer } from "@/lib/supabase";
import { supabaseConfigured, supabaseUrl } from "@/lib/supabase-env";
import { GALLERY_SHOT_IDS, PHOTO_SHOTS, type ShotCategory } from "@/lib/photo-shots";
import type { SitePhotoRow } from "@/lib/admin/types";

/**
 * Photos with any Supabase overrides applied on top of the shot list in
 * lib/photo-shots.ts, so the owner can upload, replace and re-word every image
 * from /admin/photos without a deploy.
 *
 * Same shape as lib/tour-settings.ts and lib/site-settings.ts: the code is the
 * floor, a `site_photos` row wins, and a missing row (or a row with no file
 * uploaded yet) leaves the titled placeholder in place. Server-only.
 */

export const PHOTO_BUCKET = "photos";

/** 10 MB — comfortable for a full-width hero master, small enough to upload. */
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const PHOTO_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** EN/DE are live; ES/TR columns exist so the copy is ready when they launch. */
export const PHOTO_LOCALES = ["en", "de", "es", "tr"] as const;
export type PhotoLocale = (typeof PHOTO_LOCALES)[number];

export const PHOTO_LOCALE_LABELS: Record<PhotoLocale, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  tr: "Türkçe",
};

export const GALLERY_CATEGORIES = ["vehicle", "landmarks", "guests", "city"] as const;
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export const PHOTO_CATEGORIES: ShotCategory[] = [...GALLERY_CATEGORIES, "site"];

/** English admin labels — the admin UI is deliberately not translated. */
export const PHOTO_CATEGORY_LABELS: Record<ShotCategory, string> = {
  vehicle: "The car",
  landmarks: "Landmarks",
  guests: "Guests",
  city: "City views",
  site: "Other site slots",
};

export type PhotoVariant = "vehicle" | "landmark" | "guest" | "city" | "map";

/** Where a slot shows up — used to group the admin screen. */
export type PhotoSurface = "hero" | "gallery" | "about" | "tours" | "social";

export type PhotoSlotDef = {
  key: string;
  surface: PhotoSurface;
  category: ShotCategory;
  /** Internal shoot title (admin + shoot brief only, never shown to guests) */
  title: string;
  hint: string;
  /** English alt text baked into the code */
  alt: string;
  /** Ships with the repo, e.g. /gallery/city-opera-sunrise.png */
  defaultSrc?: string;
  appearsOn: string[];
  variant: PhotoVariant;
  /** Part of the gallery grid (and therefore reorderable / re-categorisable) */
  inGallery: boolean;
  consentNote: boolean;
  /** Slots to borrow an image from while this one is empty */
  fallbackKeys: string[];
};

const VARIANT_BY_CATEGORY: Record<ShotCategory, PhotoVariant> = {
  vehicle: "vehicle",
  landmarks: "landmark",
  guests: "guest",
  city: "city",
  site: "vehicle",
};

const SURFACE_BY_SLOT: Record<string, PhotoSurface> = {
  "about-founder": "about",
  "about-detail": "about",
  "tours-map": "tours",
  "og-social": "social",
};

/**
 * The homepage hero is its own slot so the owner can upload a wide crop for it,
 * but until they do it borrows v1 — the shot list already promises that photo
 * appears in the hero.
 */
const HERO_SLOT: PhotoSlotDef = {
  key: "hero",
  surface: "hero",
  category: "site",
  title: "Homepage hero — full-bleed vehicle shot",
  hint: "Landscape master, 2000 px wide or more. Text sits over the lower-left, so keep that area calm.",
  alt: "Dark green vintage electric tour vehicle on Vienna’s Ringstrasse at golden hour",
  appearsOn: ["Homepage hero"],
  variant: "vehicle",
  inGallery: false,
  consentNote: false,
  fallbackKeys: ["v1"],
};

/** Every image slot on the site, hero first, then the shot list in code order. */
export const PHOTO_SLOTS: PhotoSlotDef[] = [
  HERO_SLOT,
  ...PHOTO_SHOTS.map((shot): PhotoSlotDef => ({
    key: shot.id,
    surface: SURFACE_BY_SLOT[shot.id] ?? "gallery",
    category: shot.category,
    title: shot.title,
    hint: shot.hint,
    alt: shot.alt,
    defaultSrc: shot.src,
    appearsOn: shot.appearsOn,
    variant: shot.id === "tours-map" ? "map" : VARIANT_BY_CATEGORY[shot.category],
    inGallery: (GALLERY_SHOT_IDS as readonly string[]).includes(shot.id),
    consentNote: Boolean(shot.consentNote),
    fallbackKeys: shot.id === "og-social" ? ["hero", "v1"] : [],
  })),
];

const SLOT_BY_KEY = new Map(PHOTO_SLOTS.map((slot) => [slot.key, slot]));

export function photoSlot(key: string): PhotoSlotDef | undefined {
  return SLOT_BY_KEY.get(key);
}

/** Position a slot takes in the gallery before the owner reorders anything. */
export function defaultSortOrder(slotKey: string): number {
  const index = PHOTO_SLOTS.findIndex((slot) => slot.key === slotKey);
  return index === -1 ? PHOTO_SLOTS.length + 1 : index + 1;
}

export function isGalleryCategory(value: string): value is GalleryCategory {
  return (GALLERY_CATEGORIES as readonly string[]).includes(value);
}

export function isPhotoCategory(value: string): value is ShotCategory {
  return (PHOTO_CATEGORIES as readonly string[]).includes(value);
}

export function variantForCategory(category: ShotCategory): PhotoVariant {
  return VARIANT_BY_CATEGORY[category] ?? "vehicle";
}

/** Public URL of an uploaded file, or undefined when Supabase is not configured. */
export function photoPublicUrl(storagePath: string | null | undefined): string | undefined {
  if (!storagePath) return undefined;
  const base = supabaseUrl();
  if (!base) return undefined;

  const path = storagePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

function localeValue(
  row: SitePhotoRow,
  field: "alt" | "caption",
  locale: string,
): string | undefined {
  const wanted = (PHOTO_LOCALES as readonly string[]).includes(locale)
    ? (locale as PhotoLocale)
    : "en";

  const candidates = wanted === "en" ? ["en"] : [wanted, "en"];
  for (const candidate of candidates) {
    const value = row[`${field}_${candidate}` as keyof SitePhotoRow];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export type ResolvedPhoto = {
  slotKey: string | null;
  /** Row id, or `slot:<key>` for a slot with no row yet */
  ref: string;
  category: ShotCategory;
  /** Uploaded file if there is one, else the image shipped with the code */
  src?: string;
  /** Owner-written alt text for this locale — falls back to the code/i18n text */
  alt?: string;
  /** Owner-written caption for this locale */
  caption?: string;
  /** Internal shoot title, admin-facing only */
  title?: string;
  /** true when an image (uploaded or code default) exists */
  filled: boolean;
  /** true when the image came from an upload rather than the repo */
  uploaded: boolean;
};

export type GalleryEntry = ResolvedPhoto & { category: GalleryCategory; variant: PhotoVariant };

export type SitePhotoData = {
  /** Every slot in the registry, with overrides merged in */
  bySlot: Record<string, ResolvedPhoto>;
  /** Ordered gallery tiles: predefined slots plus any extra photos */
  gallery: GalleryEntry[];
};

/** Reads site_photos. Never throws: public pages must render without Supabase. */
export async function getSitePhotoRows(publishedOnly = true): Promise<SitePhotoRow[]> {
  if (!supabaseConfigured()) return [];

  const supabase = getSupabaseServer();
  if (!supabase) return [];

  try {
    let query = supabase.from("site_photos").select("*");
    if (publishedOnly) query = query.eq("published", true);

    const { data, error } = await query
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as SitePhotoRow[];
  } catch {
    return [];
  }
}

function resolveSlot(slot: PhotoSlotDef, row: SitePhotoRow | undefined, locale: string): ResolvedPhoto {
  // Hidden rows keep their file in storage but render as empty on the public site
  // (and do not use a code-default image either — otherwise you could not hide a
  // slot that ships with a default file in public/gallery/).
  const hidden = row != null && row.published === false;
  const uploaded = hidden ? undefined : photoPublicUrl(row?.storage_path);
  const src = uploaded ?? (hidden ? undefined : slot.defaultSrc);

  return {
    slotKey: slot.key,
    ref: row?.id ?? `slot:${slot.key}`,
    category: row && isPhotoCategory(row.category) ? row.category : slot.category,
    src,
    alt: hidden ? undefined : row ? localeValue(row, "alt", locale) : undefined,
    caption: hidden ? undefined : row ? localeValue(row, "caption", locale) : undefined,
    title: hidden ? undefined : row?.title?.trim() || undefined,
    filled: Boolean(src),
    uploaded: Boolean(uploaded),
  };
}

/**
 * Photo data for the public site, merged over the code defaults.
 * `bySlot` covers every slot; `gallery` is the ordered grid.
 *
 * Fetches unpublished rows as well (via the service role, when set) so that
 * hiding a slot can suppress a code-default image, not just an upload. Cached
 * per request so generateMetadata and the page share one lookup.
 */
export const getSitePhotos = cache(async (locale: string): Promise<SitePhotoData> => {
  const rows = await getSitePhotoRows(false);
  return mergeSitePhotos(rows, locale);
});

export function mergeSitePhotos(rows: SitePhotoRow[], locale: string): SitePhotoData {
  const bySlotKey = new Map<string, SitePhotoRow>();
  const extras: SitePhotoRow[] = [];

  for (const row of rows) {
    if (row.slot_key) {
      if (!bySlotKey.has(row.slot_key)) bySlotKey.set(row.slot_key, row);
    } else {
      extras.push(row);
    }
  }

  const bySlot: Record<string, ResolvedPhoto> = {};
  PHOTO_SLOTS.forEach((slot) => {
    bySlot[slot.key] = resolveSlot(slot, bySlotKey.get(slot.key), locale);
  });

  // Gallery order: sort_order when the owner has set one, otherwise the code
  // order of the shot list. Extras without an explicit position land last.
  const entries: Array<{ entry: GalleryEntry; order: number; fallback: number }> = [];

  PHOTO_SLOTS.forEach((slot, index) => {
    if (!slot.inGallery) return;
    const resolved = bySlot[slot.key];
    if (!isGalleryCategory(resolved.category)) return;

    const row = bySlotKey.get(slot.key);
    entries.push({
      entry: { ...resolved, category: resolved.category, variant: variantForCategory(resolved.category) },
      order: row?.sort_order || index + 1,
      fallback: index,
    });
  });

  extras.forEach((row, index) => {
    if (!row.published) return;
    if (!isGalleryCategory(row.category)) return;
    const uploaded = photoPublicUrl(row.storage_path);
    if (!uploaded) return; // an extra photo with no file has nothing to show

    entries.push({
      entry: {
        slotKey: null,
        ref: row.id,
        category: row.category,
        variant: variantForCategory(row.category),
        src: uploaded,
        alt: localeValue(row, "alt", locale),
        caption: localeValue(row, "caption", locale),
        title: row.title?.trim() || undefined,
        filled: true,
        uploaded: true,
      },
      order: row.sort_order || PHOTO_SLOTS.length + index + 1,
      fallback: PHOTO_SLOTS.length + index,
    });
  });

  entries.sort((a, b) => a.order - b.order || a.fallback - b.fallback);

  return { bySlot, gallery: entries.map((e) => e.entry) };
}

/**
 * Photo for a slot, borrowing from its fallback slots while it is still empty
 * (the hero uses v1, the social card uses the hero).
 */
export function slotPhoto(data: SitePhotoData, key: string): ResolvedPhoto | undefined {
  const own = data.bySlot[key];
  if (own?.src) return own;

  for (const fallbackKey of SLOT_BY_KEY.get(key)?.fallbackKeys ?? []) {
    const borrowed = data.bySlot[fallbackKey];
    if (borrowed?.src) {
      return {
        ...borrowed,
        slotKey: key,
        ref: own?.ref ?? borrowed.ref,
        alt: own?.alt ?? borrowed.alt,
        caption: own?.caption ?? borrowed.caption,
        title: own?.title ?? borrowed.title,
      };
    }
  }

  return own;
}

/* -------------------------------------------------------------------------- */
/* Admin view model                                                            */
/* -------------------------------------------------------------------------- */

/**
 * One editable card on /admin/photos. Every registry slot gets one (whether or
 * not it has a row yet), plus one per extra gallery photo. Kept here next to the
 * registry so the admin screen and the public merge cannot drift apart.
 */
export type AdminPhoto = {
  /** Stable handle for actions: the row id, or `slot:<key>` before a row exists */
  ref: string;
  rowId: string | null;
  slotKey: string | null;
  surface: PhotoSurface;
  category: ShotCategory;
  variant: PhotoVariant;
  /** Thumbnail: the uploaded file, or the image shipped with the code */
  previewSrc?: string;
  uploaded: boolean;
  /** Showing an image that ships with the repo rather than an upload */
  usingCodeDefault: boolean;
  published: boolean;
  sortOrder: number;
  /** Internal shoot title — the row's, falling back to the code default */
  title: string;
  codeTitle: string;
  hint: string;
  codeAlt: string;
  alt: Record<PhotoLocale, string>;
  caption: Record<PhotoLocale, string>;
  appearsOn: string[];
  inGallery: boolean;
  consentNote: boolean;
  updatedAt: string | null;
};

function textMap(row: SitePhotoRow | null, field: "alt" | "caption"): Record<PhotoLocale, string> {
  const out = {} as Record<PhotoLocale, string>;
  for (const locale of PHOTO_LOCALES) {
    const value = row?.[`${field}_${locale}` as keyof SitePhotoRow];
    out[locale] = typeof value === "string" ? value : "";
  }
  return out;
}

const SURFACE_ORDER: PhotoSurface[] = ["hero", "gallery", "about", "tours", "social"];

/** Cards for /admin/photos, in the order the screen shows them. */
export function buildAdminPhotos(rows: SitePhotoRow[]): AdminPhoto[] {
  const bySlotKey = new Map<string, SitePhotoRow>();
  const extras: SitePhotoRow[] = [];

  for (const row of rows) {
    if (row.slot_key) {
      if (!bySlotKey.has(row.slot_key)) bySlotKey.set(row.slot_key, row);
    } else {
      extras.push(row);
    }
  }

  const cards: AdminPhoto[] = PHOTO_SLOTS.map((slot, index) => {
    const row = bySlotKey.get(slot.key) ?? null;
    const uploaded = photoPublicUrl(row?.storage_path);
    const category = row && isPhotoCategory(row.category) ? row.category : slot.category;

    return {
      ref: row?.id ?? `slot:${slot.key}`,
      rowId: row?.id ?? null,
      slotKey: slot.key,
      surface: slot.surface,
      category,
      variant: slot.key === "tours-map" ? "map" : variantForCategory(category),
      previewSrc: uploaded ?? slot.defaultSrc,
      uploaded: Boolean(uploaded),
      usingCodeDefault: !uploaded && Boolean(slot.defaultSrc),
      published: row?.published ?? true,
      sortOrder: row?.sort_order || index + 1,
      title: row?.title?.trim() || slot.title,
      codeTitle: slot.title,
      hint: slot.hint,
      codeAlt: slot.alt,
      alt: textMap(row, "alt"),
      caption: textMap(row, "caption"),
      appearsOn: slot.appearsOn,
      inGallery: slot.inGallery,
      consentNote: slot.consentNote,
      updatedAt: row?.updated_at ?? null,
    };
  });

  extras.forEach((row, index) => {
    const category = isPhotoCategory(row.category) ? row.category : "vehicle";
    cards.push({
      ref: row.id,
      rowId: row.id,
      slotKey: null,
      surface: "gallery",
      category,
      variant: variantForCategory(category),
      previewSrc: photoPublicUrl(row.storage_path),
      uploaded: Boolean(row.storage_path),
      usingCodeDefault: false,
      published: row.published,
      sortOrder: row.sort_order || PHOTO_SLOTS.length + index + 1,
      title: row.title?.trim() || "Extra gallery photo",
      codeTitle: "",
      hint: "Added from the dashboard — not part of the planned shot list.",
      codeAlt: "",
      alt: textMap(row, "alt"),
      caption: textMap(row, "caption"),
      appearsOn: ["Gallery"],
      inGallery: true,
      consentNote: false,
      updatedAt: row.updated_at,
    });
  });

  return cards.sort((a, b) => {
    const surface = SURFACE_ORDER.indexOf(a.surface) - SURFACE_ORDER.indexOf(b.surface);
    if (surface !== 0) return surface;

    const category = PHOTO_CATEGORIES.indexOf(a.category) - PHOTO_CATEGORIES.indexOf(b.category);
    if (category !== 0) return category;

    return a.sortOrder - b.sortOrder;
  });
}
