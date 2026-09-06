import { getSupabaseServer } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-env";
import { toAvailabilityPayload, type AvailabilityPayload } from "@/lib/availability";
import type { BlockedSlot } from "@/lib/admin/types";

/**
 * Dates and time slots the owner has blocked out in /admin/availability.
 * The public booking form consumes the derived shape via GET /api/availability.
 *
 * Server-only: this module reads Supabase. The pure helpers live in
 * lib/availability.ts and are re-exported below so existing server imports keep
 * working; client components must import them from lib/availability directly.
 */

export {
  EMPTY_AVAILABILITY,
  isSlotAvailable,
  toAvailabilityPayload,
  type AvailabilityPayload,
} from "@/lib/availability";

export async function getBlockedSlots(options?: {
  from?: string;
  to?: string;
}): Promise<BlockedSlot[]> {
  if (!supabaseConfigured()) return [];

  const supabase = getSupabaseServer();
  if (!supabase) return [];

  let query = supabase.from("blocked_slots").select("*").order("date", { ascending: true });
  if (options?.from) query = query.gte("date", options.from);
  if (options?.to) query = query.lte("date", options.to);

  try {
    const { data, error } = await query;
    if (error || !data) return [];
    return data as BlockedSlot[];
  } catch {
    // Never block the booking flow because availability could not be read.
    return [];
  }
}

export async function getAvailability(options?: {
  from?: string;
  to?: string;
}): Promise<AvailabilityPayload> {
  return toAvailabilityPayload(await getBlockedSlots(options));
}
