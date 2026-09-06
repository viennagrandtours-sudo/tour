import { getSupabaseServer } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-env";
import { TOURS, type Tour, type TourType } from "@/lib/tours";
import type { TourSettingRow } from "@/lib/admin/types";

/**
 * Tour tiers with any Supabase overrides applied on top of the code defaults in
 * lib/tours.ts. Lets the owner change a price or retire a tier from /admin/tours
 * without a deploy. Server-only: it reads with the service role key when
 * available.
 */

export type ResolvedTour = Tour & {
  active: boolean;
  /** true when a tour_settings row changed something relative to the code default */
  overridden: boolean;
};

function toResolved(tour: Tour, row?: TourSettingRow): ResolvedTour {
  if (!row) return { ...tour, active: true, overridden: false };

  const price = Number(row.price_eur);
  const merged: ResolvedTour = {
    ...tour,
    pricePerPerson: Number.isFinite(price) ? price : tour.pricePerPerson,
    minGuests: row.min_guests ?? tour.minGuests,
    active: row.active,
    overridden: false,
  };

  merged.overridden =
    merged.pricePerPerson !== tour.pricePerPerson ||
    merged.minGuests !== tour.minGuests ||
    merged.active !== true;

  return merged;
}

export async function getTourSettingRows(): Promise<TourSettingRow[]> {
  if (!supabaseConfigured()) return [];

  const supabase = getSupabaseServer();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.from("tour_settings").select("*");
    if (error || !data) return [];
    return data as TourSettingRow[];
  } catch {
    // Public pages must render even if Supabase is unreachable.
    return [];
  }
}

/** All tiers in code order, with overrides merged in. Never throws. */
export async function getResolvedTours(): Promise<ResolvedTour[]> {
  const rows = await getTourSettingRows();
  const byType = new Map(rows.map((r) => [r.tour_type, r]));
  return TOURS.map((t) => toResolved(t, byType.get(t.id)));
}

/** Only the tiers the owner currently sells — use this on public pages. */
export async function getActiveTours(): Promise<ResolvedTour[]> {
  return (await getResolvedTours()).filter((t) => t.active);
}

export async function getResolvedTour(id: TourType): Promise<ResolvedTour | null> {
  return (await getResolvedTours()).find((t) => t.id === id) ?? null;
}

/** Price × guests using the merged price, falling back to the code default. */
export async function calculateResolvedTotal(
  tourType: TourType,
  guestCount: number,
): Promise<number> {
  const tour = await getResolvedTour(tourType);
  const fallback = TOURS.find((t) => t.id === tourType);
  const price = tour?.pricePerPerson ?? fallback?.pricePerPerson ?? 0;
  return price * guestCount;
}

/** Synchronous price lookup for code that already holds the resolved list. */
export function priceFor(tours: ResolvedTour[], tourType: string): number {
  return tours.find((t) => t.id === tourType)?.pricePerPerson ?? 0;
}
