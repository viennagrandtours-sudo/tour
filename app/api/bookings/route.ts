import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-env";
import { getAvailability } from "@/lib/blocked-slots";
import { isSlotAvailable } from "@/lib/availability";
import { getResolvedTour } from "@/lib/tour-settings";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import {
  TOURS,
  NARRATION_LANGUAGES,
  MIN_GUESTS,
  MAX_GUESTS,
  FLEET_SIZE,
  MAX_GUESTS_PER_CAR,
  SITE_URL,
  type TourType,
} from "@/lib/tours";
import { createHostedCheckout, sumupConfigured } from "@/lib/sumup";

type BookingBody = {
  name: string;
  email: string;
  phone: string;
  tour_type: TourType;
  date: string;
  time: string;
  guest_count: number;
  language: string;
  notes?: string;
  locale?: string;
};

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** UTC "yesterday" — a one-day grace window so a guest's local "today" (in a
 * timezone ahead of UTC) is never rejected by the server's UTC clock. */
function earliestBookableDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const rate = checkRateLimit(`bookings:${clientIp(req)}`, { limit: 8, windowMs: 10 * 60 * 1000 });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  let body: BookingBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    name,
    email,
    phone,
    tour_type,
    date,
    time,
    guest_count,
    language,
    notes,
    locale,
  } = body;

  if (!name?.trim() || !emailOk(email) || !phone?.trim()) {
    return NextResponse.json({ error: "Invalid contact details" }, { status: 400 });
  }

  if (!TOURS.some((t) => t.id === tour_type)) {
    return NextResponse.json({ error: "Invalid tour type" }, { status: 400 });
  }

  if (!date || !time) {
    return NextResponse.json({ error: "Date and time required" }, { status: 400 });
  }

  if (date < earliestBookableDate()) {
    return NextResponse.json({ error: "That date has already passed" }, { status: 400 });
  }

  const guests = Number(guest_count);
  if (!Number.isFinite(guests) || guests < MIN_GUESTS || guests > MAX_GUESTS) {
    return NextResponse.json(
      { error: `Guest count must be between ${MIN_GUESTS} and ${MAX_GUESTS}` },
      { status: 400 }
    );
  }

  if (!NARRATION_LANGUAGES.includes(language as (typeof NARRATION_LANGUAGES)[number])) {
    return NextResponse.json({ error: "Invalid narration language" }, { status: 400 });
  }

  // Price and "still on sale" both come from the admin-editable tour_settings
  // table (falling back to the lib/tours.ts default), never the static table
  // alone — otherwise a price change or a retired tour in /admin/tours would
  // never reach what guests are actually charged.
  const resolvedTour = await getResolvedTour(tour_type);
  if (!resolvedTour || !resolvedTour.active) {
    return NextResponse.json({ error: "That tour is not currently available" }, { status: 400 });
  }
  const amount = resolvedTour.pricePerPerson * guests;
  const tour = TOURS.find((t) => t.id === tour_type)!;

  // Fast, non-authoritative pre-check: gives a quick "unavailable" for the
  // common case (owner already blocked this slot) before we touch the DB or
  // SumUp. The real capacity/availability enforcement happens atomically
  // inside create_booking_if_available below.
  const availability = await getAvailability({ from: date, to: date });
  if (!isSlotAvailable(availability, date, time)) {
    return NextResponse.json({ error: "That time is no longer available" }, { status: 409 });
  }

  const localePrefix = (locale || "en").replace(/[^a-z-]/gi, "") || "en";

  const supabase = supabaseConfigured() ? getSupabaseServer() : null;

  // A booking that isn't persisted can't later be confirmed, refunded, or even
  // found in /admin — so if Supabase isn't configured, never take real money
  // for it, regardless of whether SumUp happens to be configured too.
  if (!supabase && sumupConfigured()) {
    console.error(
      "Booking blocked: SumUp is configured but Supabase is not — refusing to create a real charge with no record."
    );
    return NextResponse.json(
      {
        error: "Booking is temporarily unavailable. Please contact us directly to book.",
      },
      { status: 503 }
    );
  }

  let bookingId: string;
  const demo = !supabase;

  if (!supabase) {
    bookingId = `demo_${Date.now().toString(36)}`;
  } else {
    const { data, error } = await supabase.rpc("create_booking_if_available", {
      p_name: name.trim(),
      p_email: email.trim().toLowerCase(),
      p_phone: phone.trim(),
      p_tour_type: tour_type,
      p_date: date,
      p_time: time,
      p_guest_count: guests,
      p_language: language,
      p_notes: notes?.trim() || null,
      p_status: "awaiting_payment",
      p_fleet_size: FLEET_SIZE,
      p_seats_per_car: MAX_GUESTS_PER_CAR,
    });

    if (error) {
      if (error.message === "slot_full" || error.message === "slot_blocked") {
        return NextResponse.json({ error: "That time is no longer available" }, { status: 409 });
      }
      if (/does not exist|schema cache/i.test(error.message)) {
        console.error("create_booking_if_available is missing — re-run supabase/schema.sql:", error);
        return NextResponse.json({ error: "Could not save booking" }, { status: 500 });
      }
      console.error("Supabase booking insert error:", error);
      return NextResponse.json({ error: "Could not save booking" }, { status: 500 });
    }

    bookingId = data as string;
  }

  if (sumupConfigured()) {
    try {
      const origin = req.nextUrl.origin || SITE_URL;
      // Checkout id is appended by the client via sessionStorage; booking id is enough here.
      // We also pass checkout in redirect after create by rebuilding URL with both params —
      // SumUp needs redirect_url at create time, so we include a placeholder path that the
      // complete page can resolve using sessionStorage when ?checkout= is absent.
      const completeUrl = `${origin}/${localePrefix}/book/complete?booking=${encodeURIComponent(bookingId)}`;
      const webhookUrl = new URL("/api/sumup/webhook", origin);
      const webhookSecret = process.env.SUMUP_WEBHOOK_SECRET?.trim();
      if (webhookSecret) webhookUrl.searchParams.set("token", webhookSecret);

      const checkout = await createHostedCheckout({
        amount,
        currency: "EUR",
        checkoutReference: bookingId,
        description: `Vienna Grand Tours · ${tour.id} · ${guests} guests · ${date} ${time}`,
        redirectUrl: completeUrl,
        returnUrl: webhookUrl.toString(),
      });

      if (supabase) {
        await supabase
          .from("bookings")
          .update({ sumup_checkout_id: checkout.id })
          .eq("id", bookingId)
          .then(({ error }) => {
            if (error) console.warn("sumup_checkout_id column missing or update failed:", error.message);
          });
      }

      return NextResponse.json({
        id: bookingId,
        demo,
        amount,
        currency: "EUR",
        status: "awaiting_payment",
        checkoutId: checkout.id,
        checkoutUrl: checkout.hosted_checkout_url,
        completeUrl: `${completeUrl}&checkout=${encodeURIComponent(checkout.id)}`,
      });
    } catch (err) {
      console.error("SumUp checkout create failed:", err);
      return NextResponse.json(
        {
          id: bookingId,
          demo,
          amount,
          status: "awaiting_payment",
          checkoutUrl: null,
          error: "payment_start_failed",
          message:
            err instanceof Error
              ? err.message
              : "Could not start SumUp checkout. Your booking is held awaiting payment.",
        },
        { status: 502 }
      );
    }
  }

  if (demo) {
    return NextResponse.json({
      id: bookingId,
      demo: true,
      amount,
      status: "awaiting_payment",
      checkoutUrl: null,
      paymentSkipped: true,
      message:
        "Demo mode: SumUp is not configured. Set SUMUP_API_KEY and SUMUP_MERCHANT_CODE to take card payments.",
    });
  }

  return NextResponse.json({
    id: bookingId,
    demo: false,
    amount,
    status: "awaiting_payment",
    checkoutUrl: null,
    paymentSkipped: true,
    message:
      "Online payment is not configured yet. Your booking is held — we will email a SumUp payment link.",
  });
}
