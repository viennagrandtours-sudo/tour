import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-env";
import { getAvailability } from "@/lib/blocked-slots";
import { isSlotAvailable } from "@/lib/availability";
import {
  TOURS,
  NARRATION_LANGUAGES,
  MIN_GUESTS,
  MAX_GUESTS,
  calculateTotal,
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

export async function POST(req: NextRequest) {
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

  const availability = await getAvailability({ from: date, to: date });
  if (!isSlotAvailable(availability, date, time)) {
    return NextResponse.json({ error: "That time is no longer available" }, { status: 409 });
  }

  const amount = calculateTotal(tour_type, guests);
  const tour = TOURS.find((t) => t.id === tour_type)!;
  const localePrefix = (locale || "en").replace(/[^a-z-]/gi, "") || "en";

  const row = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    tour_type,
    date,
    time,
    guest_count: guests,
    language,
    notes: notes?.trim() || null,
    status: "awaiting_payment" as const,
  };

  const supabase = supabaseConfigured() ? getSupabaseServer() : null;
  let bookingId: string;
  let demo = false;

  if (!supabase) {
    bookingId = `demo_${Date.now().toString(36)}`;
    demo = true;
  } else {
    const { data, error } = await supabase
      .from("bookings")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      console.error("Supabase booking insert error:", error);
      return NextResponse.json({ error: "Could not save booking" }, { status: 500 });
    }

    bookingId = data.id;
  }

  if (sumupConfigured()) {
    try {
      const origin = req.nextUrl.origin || SITE_URL;
      // Checkout id is appended by the client via sessionStorage; booking id is enough here.
      // We also pass checkout in redirect after create by rebuilding URL with both params —
      // SumUp needs redirect_url at create time, so we include a placeholder path that the
      // complete page can resolve using sessionStorage when ?checkout= is absent.
      const completeUrl = `${origin}/${localePrefix}/book/complete?booking=${encodeURIComponent(bookingId)}`;
      const webhookUrl = `${origin}/api/sumup/webhook`;

      const checkout = await createHostedCheckout({
        amount,
        currency: "EUR",
        checkoutReference: bookingId,
        description: `Vienna Grand Tours · ${tour.id} · ${guests} guests · ${date} ${time}`,
        redirectUrl: completeUrl,
        returnUrl: webhookUrl,
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
