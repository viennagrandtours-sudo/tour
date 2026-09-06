"use client";

import { useState } from "react";
import {
  createBlockedSlotAction,
  deleteBlockedSlotAction,
} from "@/lib/admin/booking-actions";
import type { BlockedSlot } from "@/lib/admin/types";
import { formatDate, relativeDay, todayIso } from "@/lib/admin/format";
import { TIME_SLOTS } from "@/lib/tours";
import { ConfirmButton, Feedback, useActionFeedback } from "./client-ui";
import { EmptyState, Pill } from "./ui";
import { btnGold, input, label, select, table, tableWrap, td, th } from "./styles";

export function AvailabilityManager({
  slots,
  readOnly,
}: {
  slots: BlockedSlot[];
  readOnly: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[22rem_1fr]">
      <BlockForm readOnly={readOnly} />
      <BlockedList slots={slots} readOnly={readOnly} />
    </div>
  );
}

function BlockForm({ readOnly }: { readOnly: boolean }) {
  const { pending, result, run } = useActionFeedback();
  const [wholeDay, setWholeDay] = useState(true);
  const [formKey, setFormKey] = useState(0);

  return (
    <section className="rounded-md border border-navy/10 bg-cream-soft p-4">
      <h2 className="font-display text-lg font-semibold text-navy">Block time off</h2>
      <p className="mt-0.5 text-xs text-navy/70">
        Blocked days and slots disappear from the public booking form.
      </p>

      <form
        key={formKey}
        className="mt-4 space-y-3"
        action={(formData) => {
          run(async () => {
            const res = await createBlockedSlotAction(formData);
            if (res.ok) setFormKey((k) => k + 1);
            return res;
          });
        }}
      >
        <div>
          <label className={label} htmlFor="block-date">
            Date
          </label>
          <input
            id="block-date"
            name="date"
            type="date"
            required
            min={todayIso()}
            className={input}
          />
        </div>

        <div>
          <label className={label} htmlFor="block-end-date">
            Through (optional)
          </label>
          <input id="block-end-date" name="end_date" type="date" className={input} />
          <p className="mt-1 text-xs text-navy/70">
            Leave empty for a single day, or set it to block a whole holiday.
          </p>
        </div>

        <label className="flex items-start gap-2 rounded border border-navy/15 bg-white px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            name="whole_day"
            checked={wholeDay}
            onChange={(e) => setWholeDay(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-navy"
          />
          <span>
            <span className="font-semibold text-navy">Block the whole day</span>
            <span className="block text-xs text-navy/70">
              Uncheck to block only part of the day.
            </span>
          </span>
        </label>

        {!wholeDay ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="block-start">
                From
              </label>
              <select id="block-start" name="start_time" defaultValue="09:00" className={select}>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="block-end">
                Until
              </label>
              <select id="block-end" name="end_time" defaultValue="13:00" className={select}>
                {[...TIME_SLOTS, "18:00"].map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        <div>
          <label className={label} htmlFor="block-reason">
            Reason (only you see this)
          </label>
          <input
            id="block-reason"
            name="reason"
            type="text"
            placeholder="Vehicle service, family day…"
            className={input}
          />
        </div>

        <Feedback result={result} />

        <button type="submit" className={`${btnGold} w-full`} disabled={pending || readOnly}>
          {pending ? "Blocking…" : "Block this time"}
        </button>

        {readOnly ? (
          <p className="text-xs text-navy/70">Disabled while showing demo data.</p>
        ) : null}
      </form>
    </section>
  );
}

function BlockedList({ slots, readOnly }: { slots: BlockedSlot[]; readOnly: boolean }) {
  if (slots.length === 0) {
    return (
      <EmptyState
        title="Nothing blocked"
        hint="Every date is currently bookable. Block a day when the vehicle is in for service, you are away, or you have a private hire."
      />
    );
  }

  return (
    <div className={tableWrap}>
      <table className={`${table} min-w-[520px]`}>
        <caption className="sr-only">Blocked dates and time slots</caption>
        <thead>
          <tr>
            <th scope="col" className={th}>
              Date
            </th>
            <th scope="col" className={th}>
              Blocked
            </th>
            <th scope="col" className={th}>
              Reason
            </th>
            <th scope="col" className={`${th} text-right`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot.id} className="hover:bg-cream-warm/30">
              <td className={td}>
                <span className="whitespace-nowrap font-semibold text-navy">
                  {formatDate(slot.date)}
                </span>
                <span className="block text-xs text-navy/70">{relativeDay(slot.date)}</span>
              </td>
              <td className={td}>
                {slot.start_time ? (
                  <Pill>
                    {slot.start_time}–{slot.end_time}
                  </Pill>
                ) : (
                  <Pill tone="gold">All day</Pill>
                )}
              </td>
              <td className={td}>
                {slot.reason ? (
                  slot.reason
                ) : (
                  <span className="text-navy/70">—</span>
                )}
              </td>
              <td className={`${td} text-right`}>
                <ConfirmButton
                  label="Unblock"
                  title="Unblock this time?"
                  body={`${formatDate(slot.date)}${
                    slot.start_time ? ` between ${slot.start_time} and ${slot.end_time}` : ""
                  } will become bookable again on the public site.`}
                  confirmLabel="Unblock"
                  onConfirm={() => deleteBlockedSlotAction(slot.id)}
                  className="inline-flex items-center rounded border border-navy/20 bg-white px-2 py-1 text-xs font-semibold text-navy transition hover:border-gold hover:bg-cream-warm/60 disabled:opacity-50"
                  disabled={readOnly}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
