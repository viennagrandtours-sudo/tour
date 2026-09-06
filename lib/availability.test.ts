import { describe, expect, it } from "vitest";
import { EMPTY_AVAILABILITY, isSlotAvailable, toAvailabilityPayload } from "@/lib/availability";
import { TIME_SLOTS } from "@/lib/tours";
import type { BlockedSlot } from "@/lib/admin/types";

function slot(overrides: Partial<BlockedSlot>): BlockedSlot {
  return {
    id: "test",
    date: "2026-10-15",
    start_time: null,
    end_time: null,
    reason: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("toAvailabilityPayload", () => {
  it("blocks the whole day when start_time and end_time are both null", () => {
    const payload = toAvailabilityPayload([slot({ date: "2026-10-15" })]);
    expect(payload.blockedDates).toContain("2026-10-15");
    expect(payload.blockedTimes["2026-10-15"]).toBeUndefined();
  });

  it("blocks only the slots inside a partial time range, half-open at the end", () => {
    const payload = toAvailabilityPayload([
      slot({ date: "2026-10-15", start_time: "10:00", end_time: "12:00" }),
    ]);
    expect(payload.blockedDates).not.toContain("2026-10-15");
    expect(payload.blockedTimes["2026-10-15"]).toEqual(["10:00", "11:00"]);
    // 12:00 is the end boundary — half-open, so it must stay bookable.
    expect(payload.blockedTimes["2026-10-15"]).not.toContain("12:00");
  });

  it("merges multiple blocked ranges on the same day", () => {
    const payload = toAvailabilityPayload([
      slot({ date: "2026-10-15", start_time: "09:00", end_time: "10:00" }),
      slot({ date: "2026-10-15", start_time: "16:00", end_time: "17:00" }),
    ]);
    expect(payload.blockedTimes["2026-10-15"]).toEqual(["09:00", "16:00"]);
  });

  it("collapses a day into blockedDates once every slot is individually blocked", () => {
    const payload = toAvailabilityPayload([
      slot({ date: "2026-10-15", start_time: "00:00", end_time: "23:59" }),
    ]);
    expect(payload.blockedDates).toContain("2026-10-15");
  });

  it("returns the empty payload for no rows", () => {
    expect(toAvailabilityPayload([])).toEqual(EMPTY_AVAILABILITY);
  });
});

describe("isSlotAvailable", () => {
  it("is available by default when nothing is blocked", () => {
    expect(isSlotAvailable(EMPTY_AVAILABILITY, "2026-10-15", TIME_SLOTS[0])).toBe(true);
  });

  it("is unavailable for any time on a fully blocked date", () => {
    const payload = toAvailabilityPayload([slot({ date: "2026-10-15" })]);
    expect(isSlotAvailable(payload, "2026-10-15", "14:00")).toBe(false);
  });

  it("is unavailable only for the specific blocked time, not the whole day", () => {
    const payload = toAvailabilityPayload([
      slot({ date: "2026-10-15", start_time: "14:00", end_time: "15:00" }),
    ]);
    expect(isSlotAvailable(payload, "2026-10-15", "14:00")).toBe(false);
    expect(isSlotAvailable(payload, "2026-10-15", "15:00")).toBe(true);
    expect(isSlotAvailable(payload, "2026-10-15", "09:00")).toBe(true);
  });

  it("checks only the date when no time is given", () => {
    const payload = toAvailabilityPayload([
      slot({ date: "2026-10-15", start_time: "14:00", end_time: "15:00" }),
    ]);
    expect(isSlotAvailable(payload, "2026-10-15")).toBe(true);
    expect(isSlotAvailable(payload, "2026-10-16")).toBe(true);
  });
});
