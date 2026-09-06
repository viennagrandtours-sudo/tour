import { TIME_SLOTS } from "@/lib/tours";
import type { BlockedSlot } from "@/lib/admin/types";

/**
 * The client-safe half of the availability logic. It is kept apart from
 * lib/blocked-slots.ts so the booking form can import these helpers without
 * pulling the Supabase client — and the service role key it reads — into the
 * browser bundle. lib/blocked-slots.ts re-exports everything here, so server
 * code can keep importing from either module.
 */

export type AvailabilityPayload = {
  /** `YYYY-MM-DD` days that are entirely unavailable */
  blockedDates: string[];
  /** `YYYY-MM-DD` → list of `HH:MM` slots that are unavailable that day */
  blockedTimes: Record<string, string[]>;
};

export const EMPTY_AVAILABILITY: AvailabilityPayload = {
  blockedDates: [],
  blockedTimes: {},
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Collapses raw rows into the day/time shape the booking form needs. */
export function toAvailabilityPayload(slots: BlockedSlot[]): AvailabilityPayload {
  const blockedDates = new Set<string>();
  const blockedTimes: Record<string, string[]> = {};

  for (const slot of slots) {
    if (!slot.start_time && !slot.end_time) {
      blockedDates.add(slot.date);
      continue;
    }

    const start = toMinutes(slot.start_time ?? "00:00");
    const end = toMinutes(slot.end_time ?? "23:59");
    const hit = TIME_SLOTS.filter((t) => {
      const m = toMinutes(t);
      return m >= start && m < end;
    });

    if (hit.length === 0) continue;
    const existing = new Set(blockedTimes[slot.date] ?? []);
    hit.forEach((t) => existing.add(t));
    blockedTimes[slot.date] = Array.from(existing).sort();
  }

  // A day with every slot blocked is effectively a closed day.
  for (const [date, times] of Object.entries(blockedTimes)) {
    if (times.length >= TIME_SLOTS.length) blockedDates.add(date);
  }

  return { blockedDates: Array.from(blockedDates).sort(), blockedTimes };
}

/** Client-safe check used by the booking form once it has the payload. */
export function isSlotAvailable(
  availability: AvailabilityPayload,
  date: string,
  time?: string,
): boolean {
  if (availability.blockedDates.includes(date)) return false;
  if (!time) return true;
  return !(availability.blockedTimes[date] ?? []).includes(time);
}
