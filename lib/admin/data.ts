import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { TOURS } from "@/lib/tours";
import { getResolvedTours, type ResolvedTour } from "@/lib/tour-settings";
import { codeDefaults, getSiteSettings, type ResolvedSiteSettings } from "@/lib/site-settings";
import { toAvailabilityPayload, type AvailabilityPayload } from "@/lib/blocked-slots";
import { buildAdminPhotos, type AdminPhoto } from "@/lib/photos";
import {
  DEMO_BLOCKED_SLOTS,
  DEMO_BOOKINGS,
  DEMO_MESSAGES,
  DEMO_SITE_PHOTOS,
  DEMO_TESTIMONIALS,
} from "./demo";
import type {
  AdminBooking,
  AdminMessage,
  AdminResult,
  AdminTestimonial,
  BlockedSlot,
  SitePhotoRow,
} from "./types";
import { todayIso } from "./format";

/**
 * Read helpers for the admin screens. Every one returns an AdminResult so the
 * UI can say whether it is showing live data, demo data (no Supabase env), or a
 * friendly error instead of blowing up.
 */

type QueryResult = { data: unknown; error: PostgrestError | null };

export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}

function explain(prefix: string, message: string): string {
  if (/does not exist|schema cache|column/i.test(message)) {
    return `${prefix}: ${message}. Re-run supabase/schema.sql in the Supabase SQL editor.`;
  }
  if (/fetch failed|ENOTFOUND|network|ECONN/i.test(message)) {
    return `${prefix}: could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and that the project is not paused.`;
  }
  return `${prefix}: ${message}`;
}

/**
 * Runs a Supabase query with the service-role client, falling back to demo data
 * when there is no project configured and to an empty list plus a readable
 * message when the query fails.
 */
async function read<T>(
  prefix: string,
  demoData: T[],
  query: (client: SupabaseClient) => PromiseLike<QueryResult>,
  normalise: (rows: Record<string, unknown>[]) => T[] = (rows) => rows as T[],
): Promise<AdminResult<T[]>> {
  const supabase = isDemoMode() ? null : createSupabaseAdmin();
  if (!supabase) return { data: demoData, source: "demo", error: null };

  try {
    const { data, error } = await query(supabase);
    if (error) {
      return { data: [], source: "live", error: explain(prefix, error.message) };
    }
    return {
      data: normalise((data ?? []) as Record<string, unknown>[]),
      source: "live",
      error: null,
    };
  } catch (error) {
    return { data: [], source: "live", error: explain(prefix, (error as Error).message) };
  }
}

export async function fetchBookings(): Promise<AdminResult<AdminBooking[]>> {
  return read<AdminBooking>(
    "Could not load bookings",
    sortBookings(DEMO_BOOKINGS),
    (client) =>
      client.from("bookings").select("*").order("date", { ascending: false }).limit(2000),
    (rows) => sortBookings(rows as unknown as AdminBooking[]),
  );
}

function sortBookings(rows: AdminBooking[]): AdminBooking[] {
  return [...rows].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export async function fetchTestimonials(): Promise<AdminResult<AdminTestimonial[]>> {
  return read<AdminTestimonial>(
    "Could not load testimonials",
    DEMO_TESTIMONIALS,
    (client) =>
      client
        .from("testimonials")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
    // Tolerate a database that has not had the admin columns applied yet.
    (rows) =>
      rows.map((row) => ({
        featured: false,
        sort_order: 0,
        is_sample: false,
        ...row,
      })) as unknown as AdminTestimonial[],
  );
}

export async function fetchMessages(): Promise<AdminResult<AdminMessage[]>> {
  return read<AdminMessage>(
    "Could not load messages",
    DEMO_MESSAGES,
    (client) =>
      client
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
    (rows) => rows.map((row) => ({ status: "new", ...row })) as unknown as AdminMessage[],
  );
}

export async function fetchBlockedSlots(): Promise<AdminResult<BlockedSlot[]>> {
  return read<BlockedSlot>(
    "Could not load blocked dates",
    DEMO_BLOCKED_SLOTS,
    (client) =>
      client
        .from("blocked_slots")
        .select("*")
        .gte("date", todayIso())
        .order("date", { ascending: true }),
  );
}

/**
 * Every photo slot on the site plus any extra gallery photos, with the
 * site_photos rows merged over the code defaults in lib/photo-shots.ts. Slots
 * with no row are still returned, so the owner can see what is unshot.
 */
export async function fetchAdminPhotos(): Promise<AdminResult<AdminPhoto[]>> {
  const rows = await read<SitePhotoRow>(
    "Could not load photos",
    DEMO_SITE_PHOTOS,
    (client) =>
      client
        .from("site_photos")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    // Tolerate a database where the photo columns are not applied yet.
    (raw) =>
      raw.map((row) => ({
        published: true,
        sort_order: 0,
        ...row,
      })) as unknown as SitePhotoRow[],
  );

  return { ...rows, data: buildAdminPhotos(rows.data) };
}

export async function fetchAvailabilityPayload(): Promise<AvailabilityPayload> {
  const { data } = await fetchBlockedSlots();
  return toAvailabilityPayload(data);
}

function fallbackTours(): ResolvedTour[] {
  return TOURS.map((t) => ({ ...t, active: true, overridden: false }));
}

export async function fetchResolvedTours(): Promise<AdminResult<ResolvedTour[]>> {
  if (isDemoMode()) return { data: fallbackTours(), source: "demo", error: null };

  try {
    return { data: await getResolvedTours(), source: "live", error: null };
  } catch (error) {
    return {
      data: fallbackTours(),
      source: "live",
      error: explain("Could not load pricing overrides", (error as Error).message),
    };
  }
}

export async function fetchSiteSettings(): Promise<AdminResult<ResolvedSiteSettings>> {
  if (isDemoMode()) return { data: codeDefaults(), source: "demo", error: null };

  try {
    return { data: await getSiteSettings(), source: "live", error: null };
  } catch (error) {
    return {
      data: codeDefaults(),
      source: "live",
      error: explain("Could not load settings", (error as Error).message),
    };
  }
}
