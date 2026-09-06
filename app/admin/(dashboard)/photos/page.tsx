import { fetchAdminPhotos } from "@/lib/admin/data";
import { hasServiceRole } from "@/lib/supabase-server";
import {
  GALLERY_CATEGORIES,
  PHOTO_BUCKET,
  PHOTO_CATEGORY_LABELS,
  PHOTO_LOCALES,
  PHOTO_LOCALE_LABELS,
  PHOTO_MAX_BYTES,
  PHOTO_MIME_TYPES,
  type AdminPhoto,
} from "@/lib/photos";
import {
  PhotosManager,
  type PhotoGroup,
  type PhotosConfig,
} from "@/components/admin/PhotosManager";
import { DataNotice, PageHeading, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const GALLERY_HINTS: Record<(typeof GALLERY_CATEGORIES)[number], string> = {
  vehicle: "The dark green vintage EV. v1 also feeds the homepage hero and the homepage teaser.",
  landmarks: "Vienna landmarks with the car in frame. l1 also appears in the homepage teaser.",
  guests: "Guests on tour — publish faces only with clear consent. g1 also appears in the homepage teaser.",
  city: "City views, no car needed. c1 also appears in the homepage teaser.",
};

function group(
  key: string,
  title: string,
  hint: string,
  photos: AdminPhoto[],
  category: PhotoGroup["category"] = null,
): PhotoGroup {
  return { key, title, hint, category, photos };
}

export default async function AdminPhotosPage() {
  const photos = await fetchAdminPhotos();
  const bySurface = (surface: AdminPhoto["surface"]) =>
    photos.data.filter((photo) => photo.surface === surface);

  const gallery = bySurface("gallery");

  const groups: PhotoGroup[] = [
    group(
      "hero",
      "Homepage hero",
      "The full-bleed image behind the brand name. Until you upload one here, it borrows the Ringstrasse photo (v1).",
      bySurface("hero"),
    ),
    ...GALLERY_CATEGORIES.map((category) =>
      group(
        `gallery-${category}`,
        `Gallery — ${PHOTO_CATEGORY_LABELS[category]}`,
        GALLERY_HINTS[category],
        gallery.filter((photo) => photo.category === category),
        category,
      ),
    ),
    group(
      "about",
      "About page",
      "The founder portrait and the vehicle detail shot beside the story.",
      bySurface("about"),
    ),
    group("tours", "Tours & pricing", "The route map beside the pricing table.", bySurface("tours")),
    group(
      "social",
      "Social sharing",
      "Used when someone shares the homepage. Falls back to the hero photo.",
      bySurface("social"),
    ),
  ];

  const config: PhotosConfig = {
    maxBytes: PHOTO_MAX_BYTES,
    mimeTypes: [...PHOTO_MIME_TYPES],
    locales: [...PHOTO_LOCALES],
    localeLabels: PHOTO_LOCALE_LABELS,
    liveLocales: ["en", "de", "es", "tr"],
    categories: GALLERY_CATEGORIES.map((value) => ({
      value,
      label: PHOTO_CATEGORY_LABELS[value],
    })),
  };

  return (
    <>
      <PageHeading
        title="Photos"
        description="Every image on the public site. Upload a photo as you take it, replace it later, and edit the wording guests read. Slots with no photo yet keep showing their titled placeholder, so this page doubles as your shoot checklist."
      />

      <DataNotice source={photos.source} error={photos.error} />

      <div className="mb-5">
        <Panel title="How this works" hint="Read once, then ignore.">
          <ul className="space-y-1.5 text-sm text-navy/70">
            <li>
              <strong className="font-semibold text-navy">Uploads</strong> go to the{" "}
              <code className="rounded bg-cream-warm px-1">{PHOTO_BUCKET}</code> bucket in Supabase
              Storage. If an upload says the bucket is missing, create a public bucket with that
              name (Storage → New bucket) or re-run{" "}
              <code className="rounded bg-cream-warm px-1">supabase/schema.sql</code>.
            </li>
            <li>
              <strong className="font-semibold text-navy">Alt text and captions</strong> are
              per-language. English, German, Spanish and Turkish have their own fields; Italian,
              Arabic, Chinese and Portuguese fall back to English until those columns are added.
              Empty fields fall back to the wording that ships with the site.
            </li>
            <li>
              <strong className="font-semibold text-navy">Removing</strong> a photo brings back the
              titled placeholder. <strong className="font-semibold text-navy">Hiding</strong> does
              the same without deleting your file for the planned slots, and takes an extra gallery
              photo out of the grid.
            </li>
            <li>
              <strong className="font-semibold text-navy">Homepage teasers</strong> use v1, l1, g1
              and c1 — fill those four first for the biggest visible change.
            </li>
            {!hasServiceRole() && photos.source === "live" ? (
              <li className="text-amber-800">
                <strong className="font-semibold">
                  SUPABASE_SERVICE_ROLE_KEY is not set.
                </strong>{" "}
                Uploads will only work if your Supabase storage policies allow the signed-in admin
                to write. Setting the key is the reliable route — see ADMIN.md.
              </li>
            ) : null}
          </ul>
        </Panel>
      </div>

      <PhotosManager groups={groups} config={config} readOnly={photos.source === "demo"} />
    </>
  );
}
