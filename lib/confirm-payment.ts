import { getSupabaseServer } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-env";
import { getCheckout, isCheckoutPaid, sumupConfigured } from "@/lib/sumup";

/**
 * Confirm a booking after SumUp reports PAID.
 * Idempotent: already-confirmed bookings stay confirmed.
 */
export async function confirmBookingAfterPayment(opts: {
  bookingId: string;
  checkoutId?: string;
}): Promise<{ ok: true; status: string; already?: boolean } | { ok: false; error: string }> {
  if (!sumupConfigured()) {
    return { ok: false, error: "SumUp is not configured" };
  }

  const supabase = supabaseConfigured() ? getSupabaseServer() : null;

  let checkoutId = opts.checkoutId?.trim();
  if (!checkoutId && supabase) {
    const { data } = await supabase
      .from("bookings")
      .select("sumup_checkout_id")
      .eq("id", opts.bookingId)
      .maybeSingle();
    checkoutId = data?.sumup_checkout_id ?? undefined;
  }

  if (!checkoutId) {
    return { ok: false, error: "Missing SumUp checkout id" };
  }

  let checkout;
  try {
    checkout = await getCheckout(checkoutId);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not verify payment",
    };
  }

  if (!isCheckoutPaid(checkout)) {
    return {
      ok: false,
      error: `Payment not complete (status: ${checkout.status || "unknown"})`,
    };
  }

  if (
    checkout.checkout_reference &&
    checkout.checkout_reference !== opts.bookingId &&
    !opts.bookingId.startsWith(checkout.checkout_reference) &&
    !checkout.checkout_reference.startsWith(opts.bookingId.slice(0, 64))
  ) {
    return { ok: false, error: "Checkout does not match this booking" };
  }

  if (!supabase) {
    return { ok: true, status: "confirmed" };
  }

  const { data: existing, error: readError } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("id", opts.bookingId)
    .maybeSingle();

  if (readError || !existing) {
    return { ok: false, error: "Booking not found" };
  }

  if (existing.status === "confirmed" || existing.status === "completed") {
    return { ok: true, status: existing.status, already: true };
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", opts.bookingId);

  if (updateError) {
    console.error("Failed to confirm booking after SumUp payment:", updateError);
    return { ok: false, error: "Could not update booking" };
  }

  return { ok: true, status: "confirmed" };
}
