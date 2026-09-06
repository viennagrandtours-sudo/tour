import { NextRequest, NextResponse } from "next/server";
import { confirmBookingAfterPayment } from "@/lib/confirm-payment";
import { sumupConfigured } from "@/lib/sumup";

/**
 * SumUp can POST transaction status to return_url when configured on the checkout.
 * We also accept a generic JSON body with checkout id / reference.
 *
 * Configure this URL in the checkout create call as return_url, e.g.
 *   https://your-domain/api/sumup/webhook
 */
export async function POST(req: NextRequest) {
  if (!sumupConfigured()) {
    return NextResponse.json({ error: "SumUp not configured" }, { status: 503 });
  }

  let payload: Record<string, unknown> = {};
  const contentType = req.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const form = await req.formData();
      form.forEach((value, key) => {
        payload[key] = typeof value === "string" ? value : value.name;
      });
    }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const checkoutId = String(
    payload.id ||
      payload.checkout_id ||
      payload.checkoutId ||
      payload.checkout ||
      ""
  ).trim();

  const bookingId = String(
    payload.checkout_reference ||
      payload.checkoutReference ||
      payload.reference ||
      payload.foreign_transaction_id ||
      ""
  ).trim();

  if (!checkoutId || !bookingId) {
    // Acknowledge so SumUp doesn't retry forever on unexpected shapes;
    // complete-page verification remains the primary confirm path.
    console.warn("SumUp webhook missing checkout/booking ids", payload);
    return NextResponse.json({ received: true, matched: false });
  }

  const result = await confirmBookingAfterPayment({ bookingId, checkoutId });
  if (!result.ok) {
    console.warn("SumUp webhook confirm failed:", result.error);
    return NextResponse.json({ received: true, confirmed: false, error: result.error });
  }

  return NextResponse.json({ received: true, confirmed: true, status: result.status });
}
