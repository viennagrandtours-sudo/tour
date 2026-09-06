/**
 * SumUp Online Checkout (hosted payment page).
 * Docs: https://developer.sumup.com/online-payments/checkouts/hosted-checkout/
 *
 * Required env: SUMUP_API_KEY, SUMUP_MERCHANT_CODE
 * Optional: SUMUP_PAY_TO_EMAIL (account email, for owner reference only)
 */

const SUMUP_API = "https://api.sumup.com/v0.1";

export type SumUpCheckout = {
  id: string;
  status: string;
  checkout_reference?: string;
  amount?: number;
  currency?: string;
  hosted_checkout_url?: string;
  hosted_checkout?: { enabled?: boolean };
};

export function sumupConfigured(): boolean {
  return Boolean(
    process.env.SUMUP_API_KEY?.trim() && process.env.SUMUP_MERCHANT_CODE?.trim()
  );
}

function authHeaders(): HeadersInit {
  const key = process.env.SUMUP_API_KEY?.trim();
  if (!key) throw new Error("SUMUP_API_KEY is not set");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export async function createHostedCheckout(input: {
  amount: number;
  currency?: string;
  checkoutReference: string;
  description: string;
  redirectUrl: string;
  returnUrl?: string;
}): Promise<SumUpCheckout> {
  const merchantCode = process.env.SUMUP_MERCHANT_CODE?.trim();
  if (!merchantCode) throw new Error("SUMUP_MERCHANT_CODE is not set");

  // checkout_reference must be unique per SumUp merchant — use the booking id.
  const reference = input.checkoutReference.slice(0, 64);

  const body: Record<string, unknown> = {
    amount: Number(input.amount.toFixed(2)),
    currency: input.currency ?? "EUR",
    checkout_reference: reference,
    merchant_code: merchantCode,
    description: input.description.slice(0, 128),
    redirect_url: input.redirectUrl,
    hosted_checkout: { enabled: true },
  };

  if (input.returnUrl) body.return_url = input.returnUrl;

  const res = await fetch(`${SUMUP_API}/checkouts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as SumUpCheckout & {
    message?: string;
    detail?: string;
    error_code?: string;
  };

  if (!res.ok) {
    const msg = data.detail || data.message || data.error_code || `SumUp ${res.status}`;
    throw new Error(msg);
  }

  if (!data.id || !data.hosted_checkout_url) {
    throw new Error("SumUp checkout did not return a hosted_checkout_url");
  }

  return data;
}

export async function getCheckout(checkoutId: string): Promise<SumUpCheckout> {
  const res = await fetch(`${SUMUP_API}/checkouts/${encodeURIComponent(checkoutId)}`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as SumUpCheckout & {
    detail?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.detail || data.message || `SumUp ${res.status}`);
  }

  return data;
}

export function isCheckoutPaid(checkout: SumUpCheckout): boolean {
  return String(checkout.status || "").toUpperCase() === "PAID";
}
