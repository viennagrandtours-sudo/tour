import { NextRequest, NextResponse } from "next/server";
import { getAvailability, EMPTY_AVAILABILITY } from "@/lib/blocked-slots";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Public read of blocked dates/time slots so the booking form can grey them out.
 * Optional `?from=YYYY-MM-DD&to=YYYY-MM-DD` narrows the window.
 *
 * Returns `{ blockedDates: string[], blockedTimes: Record<string, string[]> }`.
 * Always 200 — an unavailable backend must not break the booking flow, so it
 * degrades to "nothing is blocked".
 */
export async function GET(req: NextRequest) {
  const rate = checkRateLimit(`availability:${clientIp(req)}`, { limit: 60, windowMs: 60 * 1000 });
  if (!rate.ok) {
    return NextResponse.json(EMPTY_AVAILABILITY, {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfterSeconds) },
    });
  }

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const availability = await getAvailability({
      from: from && ISO_DAY.test(from) ? from : undefined,
      to: to && ISO_DAY.test(to) ? to : undefined,
    });

    return NextResponse.json(availability, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Availability lookup failed:", error);
    return NextResponse.json(EMPTY_AVAILABILITY);
  }
}
