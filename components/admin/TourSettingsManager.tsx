"use client";

import {
  resetTourSettingAction,
  saveTourSettingAction,
} from "@/lib/admin/settings-actions";
import type { Tour } from "@/lib/tours";
import type { ResolvedTour } from "@/lib/tour-settings";
import { formatEur } from "@/lib/admin/format";
import { ConfirmButton, Feedback, useActionFeedback } from "./client-ui";
import { Pill } from "./ui";
import { btnPrimary, input, label } from "./styles";

/**
 * Tier prices live in lib/tours.ts. This screen writes overrides to the
 * tour_settings table, so the owner can change a price without a deploy.
 */
export function TourSettingsManager({
  tours,
  defaults,
  readOnly,
}: {
  tours: ResolvedTour[];
  defaults: Tour[];
  readOnly: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {tours.map((tour) => (
        <TierCard
          key={tour.id}
          tour={tour}
          fallback={defaults.find((d) => d.id === tour.id)}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

function TierCard({
  tour,
  fallback,
  readOnly,
}: {
  tour: ResolvedTour;
  fallback?: Tour;
  readOnly: boolean;
}) {
  const { pending, result, run } = useActionFeedback();
  const changed =
    fallback &&
    (fallback.pricePerPerson !== tour.pricePerPerson ||
      fallback.minGuests !== tour.minGuests ||
      !tour.active);

  return (
    <section
      className={`rounded-md border bg-cream-soft p-4 ${
        tour.active ? "border-navy/10" : "border-red-200 bg-red-50/30"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold text-navy">{tour.id}</h2>
          <p className="text-xs text-navy/55">{tour.durationMinutes} minute tour</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tour.active ? <Pill tone="gold">On sale</Pill> : <Pill>Hidden</Pill>}
          {changed ? <Pill tone="muted">Overridden</Pill> : <Pill tone="muted">Code default</Pill>}
        </div>
      </div>

      {fallback ? (
        <p className="mt-2 text-xs text-navy/50">
          Code default: {formatEur(fallback.pricePerPerson)} per person, min{" "}
          {fallback.minGuests} guests.
        </p>
      ) : null}

      <form
        className="mt-3 space-y-3"
        action={(formData) => run(() => saveTourSettingAction(formData))}
      >
        <input type="hidden" name="tour_type" value={tour.id} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor={`price-${tour.id}`}>
              Price per person (€)
            </label>
            <input
              id={`price-${tour.id}`}
              name="price_eur"
              type="number"
              min={0}
              step="1"
              defaultValue={tour.pricePerPerson}
              className={input}
              required
            />
          </div>
          <div>
            <label className={label} htmlFor={`min-${tour.id}`}>
              Minimum guests
            </label>
            <input
              id={`min-${tour.id}`}
              name="min_guests"
              type="number"
              min={1}
              max={8}
              defaultValue={tour.minGuests}
              className={input}
              required
            />
          </div>
        </div>

        <label className="flex items-start gap-2 rounded border border-navy/15 bg-white px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={tour.active}
            className="mt-0.5 h-4 w-4 accent-navy"
          />
          <span>
            <span className="font-semibold text-navy">Offer this tier</span>
            <span className="block text-xs text-navy/55">
              Uncheck to take it off the public pricing table and booking form.
            </span>
          </span>
        </label>

        <Feedback result={result} />

        <div className="flex flex-wrap gap-2">
          <button type="submit" className={btnPrimary} disabled={pending || readOnly}>
            {pending ? "Saving…" : "Save tier"}
          </button>
          <ConfirmButton
            label="Reset to code default"
            title={`Reset ${tour.id}?`}
            body={`This deletes the override row so ${tour.id} goes back to ${
              fallback ? formatEur(fallback.pricePerPerson) : "the value"
            } from lib/tours.ts.`}
            confirmLabel="Reset tier"
            onConfirm={() => resetTourSettingAction(tour.id)}
            className="inline-flex items-center rounded border border-navy/20 bg-white px-3 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:bg-cream-warm/60 disabled:opacity-50"
            disabled={readOnly}
          />
        </div>
      </form>
    </section>
  );
}
