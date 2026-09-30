import { NextRequest, NextResponse } from "next/server";
import { confirmBookingAfterPayment } from "@/lib/confirm-payment";

/**
 * Called from /book/complete after SumUp Hosted Checkout redirects back,
 * or polled if the guest lands before the webhook fires.
 *
 * Body: { bookingId: string, checkoutId: string, locale?: string }
 *
 * The confirmation email is sent inside confirmBookingAfterPayment, to the
 * address stored on the booking.
 */
export async function POST(req: NextRequest) {
  let body: {
    bookingId?: string;
    checkoutId?: string;
    locale?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const bookingId = body.bookingId?.trim();
  const checkoutId = body.checkoutId?.trim();
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }

  const result = await confirmBookingAfterPayment({
    bookingId,
    checkoutId,
    locale: body.locale?.trim(),
  });
  if (!result.ok) {
    const pending = result.error.startsWith("Payment not complete");
    return NextResponse.json(
      { error: result.error, pending },
      { status: pending ? 409 : 400 }
    );
  }

  return NextResponse.json({
    id: bookingId,
    status: result.status,
    already: Boolean(result.already),
  });
}
