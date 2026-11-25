import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getAdminUser = vi.fn();
vi.mock("@/lib/supabase-server", () => ({ getAdminUser: () => getAdminUser() }));
// Demo mode: no database, no SumUp — the route returns the computed amount.
vi.mock("@/lib/supabase-env", () => ({ supabaseConfigured: () => false }));
vi.mock("@/lib/sumup", () => ({ sumupConfigured: () => false, createHostedCheckout: vi.fn() }));
vi.mock("@/lib/blocked-slots", () => ({
  getAvailability: async () => ({ blockedDates: [], blockedTimes: {} }),
}));
vi.mock("@/lib/tour-settings", () => ({
  getResolvedTour: async () => ({ pricePerPerson: 49, active: true }),
}));
vi.mock("@/lib/booking-email", () => ({ sendOwnerNotification: vi.fn() }));

import { POST } from "./route";

function book(extra: Record<string, unknown> = {}, ip = "203.0.113.1") {
  const date = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  return POST(
    new NextRequest("http://localhost/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({
        name: "Test Guest",
        email: "guest@example.com",
        phone: "+43 1 234",
        tour_type: "gold",
        date,
        time: "11:00",
        guest_count: 3,
        language: "en",
        ...extra,
      }),
    }),
  );
}

describe("POST /api/bookings test mode", () => {
  beforeEach(() => getAdminUser.mockReset());

  it("charges the normal price for a normal booking", async () => {
    const res = await book({}, "203.0.113.10");
    expect((await res.json()).amount).toBe(147);
  });

  it("refuses a €1 test booking from someone who is not signed in to /admin", async () => {
    getAdminUser.mockResolvedValue(null);
    const res = await book({ test: true }, "203.0.113.11");
    expect(res.status).toBe(403);
  });

  it("charges €1 in total for a signed-in admin", async () => {
    getAdminUser.mockResolvedValue({ id: "u1", email: "viennagrandtours@gmail.com" });
    const res = await book({ test: true }, "203.0.113.12");
    expect(res.status).toBe(200);
    expect((await res.json()).amount).toBe(1);
  });

  it("ignores anything other than test: true", async () => {
    const res = await book({ test: "yes" }, "203.0.113.13");
    expect((await res.json()).amount).toBe(147);
    expect(getAdminUser).not.toHaveBeenCalled();
  });
});
