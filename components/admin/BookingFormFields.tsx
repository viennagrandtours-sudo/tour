"use client";

import {
  MAX_GUESTS,
  MAX_GUESTS_PER_CAR,
  MIN_GUESTS,
  NARRATION_LANGUAGE_LABELS,
  NARRATION_LANGUAGES,
  TIME_SLOTS,
  TOURS,
} from "@/lib/tours";
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS, type AdminBooking } from "@/lib/admin/types";
import { input, label, select, textarea } from "./styles";

export function Field({
  id,
  children,
  labelText,
  hint,
}: {
  id: string;
  children: React.ReactNode;
  labelText: string;
  hint?: string;
}) {
  return (
    <div>
      <label className={label} htmlFor={id}>
        {labelText}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-navy/50">{hint}</p> : null}
    </div>
  );
}

/** Date / time / guests / notes — the fields both the add and edit forms share. */
export function ScheduleFields({
  idPrefix,
  booking,
}: {
  idPrefix: string;
  booking?: AdminBooking;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field id={`${idPrefix}-date`} labelText="Date">
          <input
            id={`${idPrefix}-date`}
            name="date"
            type="date"
            required
            defaultValue={booking?.date}
            className={input}
          />
        </Field>

        <Field id={`${idPrefix}-time`} labelText="Time">
          <select
            id={`${idPrefix}-time`}
            name="time"
            required
            defaultValue={booking?.time ?? "10:00"}
            className={select}
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
            {booking?.time && !TIME_SLOTS.includes(booking.time as (typeof TIME_SLOTS)[number]) ? (
              <option value={booking.time}>{booking.time} (custom)</option>
            ) : null}
          </select>
        </Field>
      </div>

      <Field
        id={`${idPrefix}-guests`}
        labelText="Guests"
        hint={`${MIN_GUESTS}–${MAX_GUESTS} on the public form (${MAX_GUESTS_PER_CAR} per car). You can go a little higher here.`}
      >
        <input
          id={`${idPrefix}-guests`}
          name="guest_count"
          type="number"
          min={1}
          max={MAX_GUESTS + 7}
          required
          defaultValue={booking?.guest_count ?? MIN_GUESTS}
          className={input}
        />
      </Field>

      <Field id={`${idPrefix}-notes`} labelText="Notes">
        <textarea
          id={`${idPrefix}-notes`}
          name="notes"
          defaultValue={booking?.notes ?? ""}
          className={textarea}
          placeholder="Access needs, meeting point tweaks, how they paid…"
        />
      </Field>
    </>
  );
}

/** Contact + tour choice, only needed when creating a booking by hand. */
export function GuestFields() {
  return (
    <>
      <Field id="add-name" labelText="Guest name">
        <input id="add-name" name="name" type="text" required className={input} />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="add-email" labelText="Email">
          <input id="add-email" name="email" type="email" required className={input} />
        </Field>
        <Field id="add-phone" labelText="Phone">
          <input id="add-phone" name="phone" type="tel" required className={input} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field id="add-tour" labelText="Tour">
          <select id="add-tour" name="tour_type" required defaultValue="silver" className={select}>
            {TOURS.map((tour) => (
              <option key={tour.id} value={tour.id}>
                {tour.id} · {tour.durationMinutes} min
              </option>
            ))}
          </select>
        </Field>

        <Field id="add-language" labelText="Narration">
          <select id="add-language" name="language" required defaultValue="en" className={select}>
            {NARRATION_LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {NARRATION_LANGUAGE_LABELS[code]}
              </option>
            ))}
          </select>
        </Field>

        <Field id="add-status" labelText="Status">
          <select id="add-status" name="status" required defaultValue="confirmed" className={select}>
            {BOOKING_STATUSES.map((value) => (
              <option key={value} value={value}>
                {BOOKING_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </>
  );
}
