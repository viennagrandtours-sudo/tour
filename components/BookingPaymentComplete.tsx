"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Phase = "checking" | "success" | "pending" | "error";

/**
 * Return URL after SumUp Hosted Checkout.
 * Verifies payment via /api/bookings/confirm-payment, then shows confirmation.
 */
export default function BookingPaymentComplete() {
  const t = useTranslations("booking");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking") || "";
  const checkoutFromQuery = searchParams.get("checkout");

  const [phase, setPhase] = useState<Phase>("checking");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setPhase("error");
      setMessage(t("paymentVerifyMissing"));
      return;
    }

    let cancelled = false;
    let attempts = 0;

    async function verify() {
      let checkoutId = checkoutFromQuery && checkoutFromQuery !== "pending" ? checkoutFromQuery : "";
      let guest: { email?: string; name?: string; locale?: string } = {};

      try {
        checkoutId =
          checkoutId || sessionStorage.getItem(`vgt_sumup_checkout_${bookingId}`) || "";
        const raw = sessionStorage.getItem(`vgt_sumup_guest_${bookingId}`);
        if (raw) guest = JSON.parse(raw) as typeof guest;
      } catch {
        /* ignore */
      }

      try {
        const res = await fetch("/api/bookings/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            checkoutId: checkoutId || undefined,
            email: guest.email,
            name: guest.name,
            locale: guest.locale || locale,
          }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (res.ok) {
          try {
            sessionStorage.removeItem(`vgt_sumup_checkout_${bookingId}`);
            sessionStorage.removeItem(`vgt_sumup_guest_${bookingId}`);
          } catch {
            /* ignore */
          }
          setPhase("success");
          return;
        }

        if (res.status === 409 || data.pending) {
          attempts += 1;
          if (attempts < 8) {
            setTimeout(verify, 1500);
            return;
          }
          setPhase("pending");
          setMessage(data.error || t("paymentPending"));
          return;
        }

        setPhase("error");
        setMessage(data.error || t("paymentVerifyFailed"));
      } catch {
        if (cancelled) return;
        setPhase("error");
        setMessage(t("paymentVerifyFailed"));
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [bookingId, checkoutFromQuery, locale, t]);

  return (
    <div className="paper-surface animate-fade-up border-gold/30 p-8 text-center sm:p-10">
      {phase === "checking" && (
        <>
          <p className="section-kicker">{t("paymentCheckingKicker")}</p>
          <h1 className="mt-3 font-display text-display-md text-navy">{t("paymentCheckingTitle")}</h1>
          <p className="mx-auto mt-4 max-w-md font-sans text-navy/65">{t("paymentCheckingBody")}</p>
        </>
      )}

      {phase === "success" && (
        <>
          <p className="section-kicker">
            {t("successRef")}: {bookingId}
          </p>
          <h1 className="mt-3 font-display text-display-md text-navy">{t("successTitle")}</h1>
          <div className="mx-auto mt-4 h-px w-14 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <p className="mx-auto mt-4 max-w-md font-sans text-navy/65">{t("successBody")}</p>
          <p className="mx-auto mt-3 max-w-md font-sans text-sm text-navy/50">{t("successNote")}</p>
          <Link href="/tours" className="btn-primary mt-8 inline-flex">
            {t("backToTours")}
          </Link>
        </>
      )}

      {phase === "pending" && (
        <>
          <p className="section-kicker">
            {t("successRef")}: {bookingId}
          </p>
          <h1 className="mt-3 font-display text-display-md text-navy">{t("paymentPendingTitle")}</h1>
          <p className="mx-auto mt-4 max-w-md font-sans text-navy/65">
            {message || t("paymentPending")}
          </p>
          <Link href="/book" className="btn-ghost mt-8 inline-flex">
            {t("backToBook")}
          </Link>
        </>
      )}

      {phase === "error" && (
        <>
          <h1 className="font-display text-display-md text-navy">{t("paymentVerifyFailedTitle")}</h1>
          <p className="mx-auto mt-4 max-w-md font-sans text-navy/65">
            {message || t("paymentVerifyFailed")}
          </p>
          {bookingId ? (
            <p className="mx-auto mt-2 font-sans text-sm text-navy/45">
              {t("successRef")}: {bookingId}
            </p>
          ) : null}
          <Link href="/book" className="btn-primary mt-8 inline-flex">
            {t("backToBook")}
          </Link>
        </>
      )}
    </div>
  );
}
