"use client";

import { useOptimistic, useState } from "react";
import { updateBookingStatusAction } from "@/lib/admin/booking-actions";
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS, type AdminBookingStatus } from "@/lib/admin/types";
import { useActionFeedback } from "./client-ui";
import { select } from "./styles";

/**
 * Status dropdown that flips immediately and rolls back with an explanation if
 * the write fails, so the owner is never left guessing on a phone.
 */
export function BookingStatusSelect({
  id,
  status,
  disabled,
}: {
  id: string;
  status: AdminBookingStatus;
  disabled?: boolean;
}) {
  const [committed, setCommitted] = useState(status);
  const [optimistic, setOptimistic] = useOptimistic(committed);
  const { pending, result, run } = useActionFeedback();

  return (
    <div className="min-w-[8.5rem]">
      <label className="sr-only" htmlFor={`status-${id}`}>
        Booking status
      </label>
      <select
        id={`status-${id}`}
        className={`${select} py-1 text-xs`}
        value={optimistic}
        disabled={disabled || pending}
        onChange={(event) => {
          const next = event.target.value as AdminBookingStatus;
          run(async () => {
            setOptimistic(next);
            const res = await updateBookingStatusAction(id, next);
            if (res.ok) setCommitted(next);
            return res;
          });
        }}
      >
        {BOOKING_STATUSES.map((value) => (
          <option key={value} value={value}>
            {BOOKING_STATUS_LABELS[value]}
          </option>
        ))}
      </select>

      {result && !result.ok ? (
        <p role="alert" className="mt-1 text-xs leading-tight text-red-700">
          {result.message}
        </p>
      ) : null}
      {pending ? <p className="mt-1 text-xs text-navy/70">Saving…</p> : null}
    </div>
  );
}
