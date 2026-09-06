import { NextRequest, NextResponse } from "next/server";
import { confirmBookingAfterPayment } from "@/lib/confirm-payment";

/**
 * Called from /book/complete after SumUp Hosted Checkout redirects back,
 * or polled if the guest lands before the webhook fires.
 *
 * Body: { bookingId: string, checkoutId: string, email?: string, name?: string, locale?: string }
 */
export async function POST(req: NextRequest) {
  let body: {
    bookingId?: string;
    checkoutId?: string;
    email?: string;
    name?: string;
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

  const result = await confirmBookingAfterPayment({ bookingId, checkoutId });
  if (!result.ok) {
    const pending = result.error.startsWith("Payment not complete");
    return NextResponse.json(
      { error: result.error, pending },
      { status: pending ? 409 : 400 }
    );
  }

  // Fire confirmation email once payment is verified (non-blocking).
  if (body.email && !result.already) {
    void fetch(new URL("/api/confirm-email", req.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        email: body.email,
        name: body.name,
        locale: body.locale,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({
    id: bookingId,
    status: result.status,
    already: Boolean(result.already),
  });
}
