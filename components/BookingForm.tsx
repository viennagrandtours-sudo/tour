"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  TOURS,
  TIME_SLOTS,
  NARRATION_LANGUAGES,
  NARRATION_LANGUAGE_LABELS,
  MIN_GUESTS,
  MAX_GUESTS,
  MAX_GUESTS_PER_CAR,
  calculateTotal,
  carsNeeded,
  tourTierKey,
  type TourType,
  type NarrationLanguage,
} from "@/lib/tours";
import {
  EMPTY_AVAILABILITY,
  isSlotAvailable,
  type AvailabilityPayload,
} from "@/lib/availability";

const STEPS = ["tour", "datetime", "guests", "language", "contact", "payment"] as const;

type FormState = {
  tour_type: TourType;
  date: string;
  time: string;
  guest_count: number;
  language: NarrationLanguage;
  name: string;
  email: string;
  phone: string;
  notes: string;
};

function isTourType(value: string | null): value is TourType {
  return Boolean(value && TOURS.some((t) => t.id === value));
}

type Props = {
  initialTour?: TourType;
};

export default function BookingForm({ initialTour = "silver" }: Props) {
  const t = useTranslations("booking");
  const tTours = useTranslations("tours");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    id: string;
    demo?: boolean;
    paymentSkipped?: boolean;
    awaitingOnlinePayment?: boolean;
  } | null>(null);

  const [availability, setAvailability] = useState<AvailabilityPayload>(EMPTY_AVAILABILITY);

  const [form, setForm] = useState<FormState>({
    tour_type: initialTour,
    date: "",
    time: TIME_SLOTS[2],
    guest_count: 3,
    language: "en",
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    const fromQuery = searchParams.get("tour");
    if (isTourType(fromQuery)) {
      setForm((prev) => ({ ...prev, tour_type: fromQuery }));
    }
  }, [searchParams]);

  // Days and slots closed in /admin/availability. A failed lookup must never
  // block booking, so anything unexpected leaves everything bookable.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/availability")
      .then((r) => r.json())
      .then((data: AvailabilityPayload) => {
        if (cancelled || !Array.isArray(data?.blockedDates)) return;
        setAvailability({
          blockedDates: data.blockedDates,
          blockedTimes: data.blockedTimes ?? {},
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const step = STEPS[stepIndex];
  const dayBlocked = Boolean(form.date) && availability.blockedDates.includes(form.date);
  const openSlots = useMemo(
    () => TIME_SLOTS.filter((slot) => !form.date || isSlotAvailable(availability, form.date, slot)),
    [availability, form.date]
  );

  // Move the selection off a slot that has since been blocked out.
  useEffect(() => {
    const stillOpen = openSlots as readonly string[];
    if (openSlots.length === 0 || stillOpen.includes(form.time)) return;
    setForm((prev) => ({ ...prev, time: openSlots[0] }));
  }, [openSlots, form.time]);

  const total = useMemo(
    () => calculateTotal(form.tour_type, form.guest_count),
    [form.tour_type, form.guest_count]
  );

  const carCount = useMemo(
    () => carsNeeded(form.guest_count),
    [form.guest_count]
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setStepError(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /** Returns the message for the first unmet requirement of the current step. */
  function validateStep(): string | null {
    switch (step) {
      case "tour":
        return form.tour_type ? null : t("validation.tour");
      case "datetime":
        if (!form.date) return t("validation.date");
        if (!form.time) return t("validation.time");
        return isSlotAvailable(availability, form.date, form.time)
          ? null
          : t("validation.unavailable");
      case "guests":
        return form.guest_count >= MIN_GUESTS && form.guest_count <= MAX_GUESTS
          ? null
          : t("validation.guests");
      case "language":
        return form.language ? null : t("validation.language");
      case "contact":
        if (!form.name.trim()) return t("validation.name");
        if (!form.email.trim()) return t("validation.email");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
          return t("validation.emailFormat");
        return form.phone.trim() ? null : t("validation.phone");
      case "payment":
        return null;
      default:
        return null;
    }
  }

  function goNext() {
    const message = validateStep();
    setStepError(message);
    if (message) return;
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }

  function goBack() {
    setStepError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step !== "payment") return;

    const invalid = validateStep();
    if (invalid) {
      setStepError(invalid);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });

      const data = await res.json();
      // 409 = the slot was blocked while the guest was filling the form.
      if (res.status === 409) throw new Error(t("validation.unavailable"));

      // SumUp Hosted Checkout — leave this site to pay, then return to /book/complete.
      if (data.checkoutUrl && data.checkoutId && data.id) {
        try {
          sessionStorage.setItem(`vgt_sumup_checkout_${data.id}`, data.checkoutId);
          sessionStorage.setItem(
            `vgt_sumup_guest_${data.id}`,
            JSON.stringify({ email: form.email, name: form.name, locale })
          );
        } catch {
          /* private mode — complete page can still use DB lookup */
        }
        window.location.assign(data.checkoutUrl as string);
        return;
      }

      if (res.status === 502 || data.error === "payment_start_failed") {
        throw new Error(data.message || t("paymentStartFailed"));
      }

      if (!res.ok && !data.id) throw new Error(data.error || "Booking failed");

      // No SumUp env / payment skipped — booking held; show honest confirmation.
      setConfirmation({
        id: data.id,
        demo: data.demo,
        paymentSkipped: Boolean(data.paymentSkipped),
        awaitingOnlinePayment: data.status === "awaiting_payment",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="paper-surface animate-fade-up border-gold/30 p-8 text-center sm:p-10">
        <div className="relative">
          <p className="section-kicker">
            {t("successRef")}: {confirmation.id}
          </p>
          <h2 className="mt-3 font-display text-display-md text-navy">
            {confirmation.paymentSkipped || confirmation.awaitingOnlinePayment
              ? t("heldTitle")
              : t("successTitle")}
          </h2>
          <div className="mx-auto mt-4 h-px w-14 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <p className="mx-auto mt-4 max-w-md font-sans text-navy/65">
            {confirmation.paymentSkipped || confirmation.awaitingOnlinePayment
              ? t("heldBody")
              : t("successBody")}
          </p>
          <p className="mx-auto mt-3 max-w-md font-sans text-sm text-navy/50">
            {t("successNote")}
          </p>
          {confirmation.demo && (
            <p className="mx-auto mt-5 max-w-md border border-navy/10 bg-cream-warm/80 px-4 py-3 font-sans text-xs text-navy/60">
              {t("demoMode")}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="paper-surface shadow-soft">
      <div className="relative border-b border-navy/8 px-5 py-5 sm:px-8 sm:py-6">
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-2" aria-label={t("stepsLabel")}>
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-1">
              <button
                type="button"
                disabled={i > stepIndex}
                onClick={() => {
                  if (i >= stepIndex) return;
                  setStepError(null);
                  setStepIndex(i);
                }}
                className={`flex items-center gap-2 rounded-sm px-2 py-1 font-sans text-[11px] font-semibold tracking-wide transition ${
                  i === stepIndex
                    ? "text-navy"
                    : i < stepIndex
                      ? "text-gold-muted hover:text-navy"
                      : "cursor-default text-navy/30"
                }`}
                aria-current={i === stepIndex ? "step" : undefined}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center border text-[10px] ${
                    i === stepIndex
                      ? "border-gold bg-gold text-navy-deep"
                      : i < stepIndex
                        ? "border-gold/40 text-gold-muted"
                        : "border-navy/15 text-navy/30"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{t(`steps.${s}`)}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span className="mx-0.5 hidden h-px w-4 bg-navy/15 sm:block rtl:rotate-180" aria-hidden />
              )}
            </li>
          ))}
        </ol>
      </div>

      <div className="relative px-5 py-7 sm:px-8 sm:py-9">
        <p className="mb-6 max-w-xl font-sans text-sm leading-relaxed text-navy/55">
          {t(`hints.${step}`)}
        </p>
        <div className="min-h-[240px]">
          {step === "tour" && (
            <fieldset>
              <legend className="label-field">{t("fields.tourType")}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {TOURS.map((tour) => (
                  <label
                    key={tour.id}
                    className={`cursor-pointer border p-5 transition duration-300 ease-elegant ${
                      form.tour_type === tour.id
                        ? "border-gold bg-cream-warm/80"
                        : "border-navy/12 bg-cream-soft/40 hover:border-gold/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tour_type"
                      className="sr-only"
                      checked={form.tour_type === tour.id}
                      onChange={() => update("tour_type", tour.id)}
                    />
                    <span className="block font-display text-xl tracking-display text-navy">
                      {tTours(`tiers.${tourTierKey(tour.id)}.name`)}
                    </span>
                    <span className="mt-1.5 block font-sans text-sm text-navy/55">
                      €{tour.pricePerPerson} {tTours("perPerson")}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === "datetime" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="date" className="label-field">
                  {t("fields.date")}
                </label>
                <input
                  id="date"
                  type="date"
                  required
                  className="input-field"
                  value={form.date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => update("date", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="time" className="label-field">
                  {t("fields.time")}
                </label>
                <select
                  id="time"
                  className="input-field"
                  value={form.time}
                  onChange={(e) => update("time", e.target.value)}
                  disabled={dayBlocked}
                  required
                >
                  {TIME_SLOTS.map((slot) => (
                    <option
                      key={slot}
                      value={slot}
                      disabled={
                        Boolean(form.date) && !isSlotAvailable(availability, form.date, slot)
                      }
                    >
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              {dayBlocked && (
                <p className="font-sans text-sm text-navy/55 sm:col-span-2">
                  {t("validation.unavailable")}
                </p>
              )}
            </div>
          )}

          {step === "guests" && (
            <div>
              <label htmlFor="guests" className="label-field">
                {t("fields.guests")}
              </label>
              <input
                id="guests"
                type="number"
                min={MIN_GUESTS}
                max={MAX_GUESTS}
                className="input-field max-w-[12rem]"
                value={form.guest_count}
                onChange={(e) => update("guest_count", Number(e.target.value))}
                required
              />
              <p className="mt-2 font-sans text-xs text-navy/50">{t("minGuestsHint")}</p>
              {form.guest_count > MAX_GUESTS_PER_CAR && (
                <p className="mt-2 font-sans text-xs text-navy/60">
                  {t("carsNeededHint", { count: carCount })}
                </p>
              )}
            </div>
          )}

          {step === "language" && (
            <fieldset>
              <legend className="label-field">{t("fields.language")}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {NARRATION_LANGUAGES.map((lang) => (
                  <label
                    key={lang}
                    className={`cursor-pointer border p-4 transition duration-300 ${
                      form.language === lang
                        ? "border-gold bg-cream-warm/80"
                        : "border-navy/12 hover:border-gold/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="language"
                      className="sr-only"
                      checked={form.language === lang}
                      onChange={() => update("language", lang)}
                    />
                    <span className="font-sans font-medium text-navy">
                      {NARRATION_LANGUAGE_LABELS[lang]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === "contact" && (
            <div className="grid gap-4">
              <div>
                <label htmlFor="name" className="label-field">
                  {t("fields.name")}
                </label>
                <input
                  id="name"
                  className="input-field"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="label-field">
                  {t("fields.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="label-field">
                  {t("fields.phone")}
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="input-field"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="notes" className="label-field">
                  {t("fields.notes")}
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className="input-field"
                  placeholder={t("fields.notesPlaceholder")}
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-5">
              <div className="border border-navy/10 bg-cream-warm/50 p-6">
                <h3 className="section-kicker">{t("summary")}</h3>
                <dl className="mt-4 space-y-3 font-sans text-sm text-navy/75">
                  <div className="flex justify-between gap-4 text-start">
                    <dt>{t("fields.tourType")}</dt>
                    <dd className="font-medium text-navy">
                      {tTours(`tiers.${tourTierKey(form.tour_type)}.name`)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 text-start">
                    <dt>{t("fields.date")}</dt>
                    <dd className="font-medium text-navy">
                      {form.date} · {form.time}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 text-start">
                    <dt>{t("fields.guests")}</dt>
                    <dd className="font-medium text-navy">{form.guest_count}</dd>
                  </div>
                  {carCount > 1 && (
                    <div className="flex justify-between gap-4 text-start">
                      <dt>{t("fields.cars")}</dt>
                      <dd className="font-medium text-navy">{carCount}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 text-start">
                    <dt>{t("fields.language")}</dt>
                    <dd className="font-medium text-navy">
                      {NARRATION_LANGUAGE_LABELS[form.language]}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-navy/10 pt-3 text-start">
                    <dt className="font-semibold text-navy">{t("total")}</dt>
                    <dd className="font-display text-3xl tracking-display text-navy">€{total}</dd>
                  </div>
                </dl>
              </div>

              <div className="border border-gold/40 bg-gold/10 px-4 py-4 font-sans text-sm leading-relaxed text-navy/70">
                {t("paymentNote")}
              </div>

              <div>
                <h3 className="section-kicker">{t("policyTitle")}</h3>
                <p className="mt-2 font-sans text-xs leading-relaxed text-navy/55">
                  {t("policy")}
                </p>
              </div>
            </div>
          )}
        </div>

        {(stepError || error) && (
          <p
            className="mt-5 border border-red-200 bg-red-50/80 px-3 py-2 font-sans text-sm text-red-800"
            role="alert"
          >
            {stepError ?? error}
          </p>
        )}

        <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-navy/8 pt-6">
          <button
            type="button"
            className="btn-ghost"
            disabled={stepIndex === 0 || submitting}
            onClick={goBack}
          >
            {t("back")}
          </button>

          {step !== "payment" ? (
            <button type="button" className="btn-primary" onClick={goNext}>
              {t("next")}
            </button>
          ) : (
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? tCommon("loading") : t("submit")}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
