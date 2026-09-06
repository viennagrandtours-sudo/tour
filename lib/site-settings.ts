import { getSupabaseServer } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-env";
import { SITE } from "@/lib/tours";

/**
 * Business info with Supabase overrides applied on top of the SITE constant in
 * lib/tours.ts, so the owner can fix a phone number or swap a social link from
 * /admin/settings without a deploy.
 */

export const SITE_SETTING_KEYS = [
  "contact_email",
  "contact_phone",
  "meeting_point_street",
  "meeting_point_city",
  "meeting_point_country",
  "instagram_url",
  "facebook_url",
  "google_business_url",
] as const;

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];

export type SiteSettingField = {
  key: SiteSettingKey;
  label: string;
  hint: string;
  type: "text" | "email" | "tel" | "url";
};

export const SITE_SETTING_FIELDS: SiteSettingField[] = [
  {
    key: "contact_email",
    label: "Contact email",
    hint: "Shown in the footer, Impressum and booking confirmations.",
    type: "email",
  },
  {
    key: "contact_phone",
    label: "Contact phone",
    hint: "International format, e.g. +43 1 234 5678.",
    type: "tel",
  },
  {
    key: "meeting_point_street",
    label: "Meeting point — street",
    hint: "Where guests meet the vehicle.",
    type: "text",
  },
  { key: "meeting_point_city", label: "Meeting point — postcode & city", hint: "e.g. 1010 Wien.", type: "text" },
  { key: "meeting_point_country", label: "Meeting point — country", hint: "e.g. Austria.", type: "text" },
  { key: "instagram_url", label: "Instagram URL", hint: "Full https:// link.", type: "url" },
  { key: "facebook_url", label: "Facebook URL", hint: "Full https:// link.", type: "url" },
  {
    key: "google_business_url",
    label: "Google Business Profile URL",
    hint: "The 'write a review' or maps link customers should land on.",
    type: "url",
  },
];

export type ResolvedSiteSettings = Record<SiteSettingKey, string>;

/**
 * lib/tours.ts ships unfinished values as `[Straße und Hausnummer]` style
 * placeholders. Anything still bracketed has never been filled in, so the
 * admin UI flags it rather than pretending it is real business data.
 */
export function isUnfilled(value: string): boolean {
  return value.includes("[") && value.includes("]");
}

/** Values baked into lib/tours.ts — the floor that DB values are merged over. */
export function codeDefaults(): ResolvedSiteSettings {
  return {
    contact_email: SITE.email,
    contact_phone: SITE.phone,
    meeting_point_street: SITE.address.street,
    meeting_point_city: SITE.address.city,
    meeting_point_country: SITE.address.country,
    instagram_url: SITE.social.instagram,
    facebook_url: SITE.social.facebook,
    google_business_url: SITE.googleBusinessUrl,
  };
}

export async function getSiteSettingOverrides(): Promise<Partial<ResolvedSiteSettings>> {
  if (!supabaseConfigured()) return {};

  const supabase = getSupabaseServer();
  if (!supabase) return {};

  try {
    const { data, error } = await supabase.from("site_settings").select("key, value");
    if (error || !data) return {};

    const overrides: Partial<ResolvedSiteSettings> = {};
    for (const row of data as { key: string; value: string | null }[]) {
      if (!row.value?.trim()) continue;
      if ((SITE_SETTING_KEYS as readonly string[]).includes(row.key)) {
        overrides[row.key as SiteSettingKey] = row.value.trim();
      }
    }
    return overrides;
  } catch {
    // Public pages must render even if Supabase is unreachable.
    return {};
  }
}

/** Code defaults with any non-empty DB value layered on top. Never throws. */
export async function getSiteSettings(): Promise<ResolvedSiteSettings> {
  return { ...codeDefaults(), ...(await getSiteSettingOverrides()) };
}
