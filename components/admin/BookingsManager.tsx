"use client";

import { useMemo, useState } from "react";
import {
  createBookingAction,
  deleteBookingAction,
  updateBookingAction,
} from "@/lib/admin/booking-actions";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  type AdminBooking,
  type AdminBookingStatus,
} from "@/lib/admin/types";
import type { ResolvedTour } from "@/lib/tour-settings";
import { formatDate, formatEur, formatTimestamp, relativeDay, toCsv } from "@/lib/admin/format";
import { BookingStatusSelect } from "./BookingStatusSelect";
import { GuestFields, ScheduleFields, Field } from "./BookingFormFields";
import { ConfirmButton, Dialog, Feedback, useActionFeedback } from "./client-ui";
import { EmptyState, StatusBadge } from "./ui";
import {
  btnGhost,
  btnGold,
  btnPrimary,
  btnTiny,
  input,
  label,
  select,
  table,
  tableWrap,
  td,
  th,
} from "./styles";

type SortKey = "date-desc" | "date-asc" | "created-desc";

const CSV_COLUMNS = [
  "date",
  "time",
  "name",
  "email",
  "phone",
  "tour_type",
  "guest_count",
  "language",
  "status",
  "estimated_eur",
  "notes",
  "created_at",
];

export function BookingsManager({
  bookings,
  tours,
  readOnly,
}: {
  bookings: AdminBooking[];
  tours: ResolvedTour[];
  readOnly: boolean;
}) {
  const [status, setStatus] = useState<"all" | AdminBookingStatus>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const priceOf = useMemo(() => {
    const map = new Map(tours.map((t) => [t.id as string, t.pricePerPerson]));
    return (tourType: string) => map.get(tourType) ?? 0;
  }, [tours]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const rows = bookings.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (from && b.date < from) return false;
      if (to && b.date > to) return false;
      if (q && !`${b.name} ${b.email} ${b.phone}`.toLowerCase().includes(q)) return false;
      return true;
    });

    return rows.sort((a, b) => {
      if (sort === "created-desc") return b.created_at.localeCompare(a.created_at);
      const cmp = a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date);
      return sort === "date-asc" ? cmp : -cmp;
    });
  }, [bookings, status, from, to, query, sort]);

  const totals = useMemo(() => {
    const guests = filtered.reduce((sum, b) => sum + b.guest_count, 0);
    const value = filtered.reduce((sum, b) => sum + priceOf(b.tour_type) * b.guest_count, 0);
    return { guests, value };
  }, [filtered, priceOf]);

  const hasFilters = status !== "all" || Boolean(from || to || query);

  function exportCsv() {
    const csv = toCsv(
      filtered.map((b) => ({
        ...b,
        estimated_eur: priceOf(b.tour_type) * b.guest_count,
      })),
      CSV_COLUMNS,
    );

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-navy/10 bg-cream-soft p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className={label} htmlFor="filter-search">
              Search name, email or phone
            </label>
            <input
              id="filter-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. anna"
              className={input}
            />
          </div>

          <div>
            <label className={label} htmlFor="filter-status">
              Status
            </label>
            <select
              id="filter-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className={select}
            >
              <option value="all">All statuses</option>
              {BOOKING_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {BOOKING_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={label} htmlFor="filter-from">
              From date
            </label>
            <input
              id="filter-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={input}
            />
          </div>

          <div>
            <label className={label} htmlFor="filter-to">
              To date
            </label>
            <input
              id="filter-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={input}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-navy/10 pt-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-navy/70">
            <span>
              <strong className="font-semibold text-navy">{filtered.length}</strong> of{" "}
              {bookings.length} bookings
            </span>
            <span>
              <strong className="font-semibold text-navy">{totals.guests}</strong> guests
            </span>
            <span>
              approx. <strong className="font-semibold text-navy">{formatEur(totals.value)}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div>
              <label className="sr-only" htmlFor="filter-sort">
                Sort
              </label>
              <select
                id="filter-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className={`${select} py-1.5 text-xs`}
              >
                <option value="date-desc">Tour date, newest first</option>
                <option value="date-asc">Tour date, soonest first</option>
                <option value="created-desc">Recently booked</option>
              </select>
            </div>

            {hasFilters ? (
              <button
                type="button"
                className={btnTiny}
                onClick={() => {
                  setStatus("all");
                  setFrom("");
                  setTo("");
                  setQuery("");
                }}
              >
                Clear filters
              </button>
            ) : null}

            <button
              type="button"
              className={btnGhost}
              onClick={exportCsv}
              disabled={filtered.length === 0}
            >
              Export CSV
            </button>

            <button type="button" className={btnGold} onClick={() => setAddOpen(true)}>
              Add booking
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={bookings.length === 0 ? "No bookings yet" : "Nothing matches those filters"}
          hint={
            bookings.length === 0
              ? "Bookings made on the website appear here. Use “Add booking” for phone or walk-up guests."
              : "Try widening the date range or clearing the search."
          }
        />
      ) : (
        <div className={tableWrap}>
          <table className={table}>
            <caption className="sr-only">
              Bookings, {filtered.length} shown of {bookings.length}
            </caption>
            <thead>
              <tr>
                <th scope="col" className={`${th} w-10`}>
                  <span className="sr-only">Expand</span>
                </th>
                <th scope="col" className={th}>
                  Date &amp; time
                </th>
                <th scope="col" className={th}>
                  Guest
                </th>
                <th scope="col" className={th}>
                  Tour
                </th>
                <th scope="col" className={th}>
                  Party
                </th>
                <th scope="col" className={th}>
                  Lang
                </th>
                <th scope="col" className={th}>
                  Value
                </th>
                <th scope="col" className={th}>
                  Status
                </th>
                <th scope="col" className={th}>
                  Booked
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((booking) => {
                const open = expanded === booking.id;
                return (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    open={open}
                    onToggle={() => setExpanded(open ? null : booking.id)}
                    value={priceOf(booking.tour_type) * booking.guest_count}
                    readOnly={readOnly}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddBookingDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function BookingRow({
  booking,
  open,
  onToggle,
  value,
  readOnly,
}: {
  booking: AdminBooking;
  open: boolean;
  onToggle: () => void;
  value: number;
  readOnly: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const detailId = `booking-detail-${booking.id}`;

  return (
    <>
      <tr className={open ? "bg-cream-warm/50" : "hover:bg-cream-warm/30"}>
        <td className={td}>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={detailId}
            className="rounded px-1.5 py-0.5 text-navy/70 transition hover:bg-navy/10 hover:text-navy"
          >
            <span aria-hidden>{open ? "▾" : "▸"}</span>
            <span className="sr-only">
              {open ? "Hide" : "Show"} details for {booking.name}
            </span>
          </button>
        </td>
        <td className={td}>
          <span className="whitespace-nowrap font-semibold text-navy">
            {formatDate(booking.date)}
          </span>
          <span className="block text-xs tabular-nums text-navy/70">
            {booking.time} · {relativeDay(booking.date)}
          </span>
        </td>
        <td className={td}>
          <span className="font-medium">{booking.name}</span>
          <a
            href={`mailto:${booking.email}`}
            className="block truncate text-xs text-navy/70 underline-offset-2 hover:text-navy hover:underline"
          >
            {booking.email}
          </a>
        </td>
        <td className={`${td} whitespace-nowrap`}>{booking.tour_type}</td>
        <td className={`${td} tabular-nums`}>{booking.guest_count}</td>
        <td className={`${td} uppercase`}>{booking.language}</td>
        <td className={`${td} whitespace-nowrap tabular-nums`}>{formatEur(value)}</td>
        <td className={td}>
          {readOnly ? (
            <StatusBadge status={booking.status} />
          ) : (
            <BookingStatusSelect id={booking.id} status={booking.status} />
          )}
        </td>
        <td className={`${td} whitespace-nowrap text-xs text-navy/70`}>
          {formatTimestamp(booking.created_at)}
        </td>
      </tr>

      {open ? (
        <tr id={detailId} className="bg-cream-warm/50">
          <td className={td} />
          <td className={td} colSpan={8}>
            <div className="grid grid-cols-1 gap-4 pb-1 md:grid-cols-3">
              <dl className="space-y-1.5 text-sm">
                <Detail term="Phone">
                  <a href={`tel:${booking.phone}`} className="underline-offset-2 hover:underline">
                    {booking.phone}
                  </a>
                </Detail>
                <Detail term="Email">
                  <a href={`mailto:${booking.email}`} className="underline-offset-2 hover:underline">
                    {booking.email}
                  </a>
                </Detail>
                <Detail term="Booking id">
                  <code className="text-xs">{booking.id}</code>
                </Detail>
              </dl>

              <dl className="space-y-1.5 text-sm md:col-span-2">
                <Detail term="Notes">
                  {booking.notes ? (
                    <span className="whitespace-pre-wrap">{booking.notes}</span>
                  ) : (
                    <span className="text-navy/70">No notes</span>
                  )}
                </Detail>
              </dl>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-navy/10 pt-3">
              <button
                type="button"
                className={btnTiny}
                onClick={() => setEditOpen(true)}
                disabled={readOnly}
              >
                Edit details
              </button>
              <ConfirmButton
                label="Delete"
                title="Delete this booking?"
                body={`This permanently removes ${booking.name}'s ${booking.tour_type} tour on ${formatDate(
                  booking.date,
                )}. It cannot be undone — cancel it instead if you might need the record.`}
                confirmLabel="Delete booking"
                onConfirm={() => deleteBookingAction(booking.id)}
                className="inline-flex items-center rounded border border-red-300 bg-white px-2 py-1 text-xs font-semibold text-red-700 transition hover:border-red-500 hover:bg-red-50 disabled:opacity-50"
                disabled={readOnly}
              />
              {readOnly ? (
                <span className="self-center text-xs text-navy/70">
                  Editing is disabled while showing demo data.
                </span>
              ) : null}
            </div>

            <EditBookingDialog
              booking={booking}
              open={editOpen}
              onClose={() => setEditOpen(false)}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Detail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wideish text-navy/70">
        {term}
      </dt>
      <dd className="min-w-0 flex-1 text-navy/85">{children}</dd>
    </div>
  );
}

function EditBookingDialog({
  booking,
  open,
  onClose,
}: {
  booking: AdminBooking;
  open: boolean;
  onClose: () => void;
}) {
  const { pending, result, run } = useActionFeedback();

  return (
    <Dialog open={open} onClose={onClose} title={`Edit ${booking.name}'s booking`}>
      <form
        className="space-y-3"
        action={(formData) => {
          run(async () => {
            const res = await updateBookingAction(formData);
            if (res.ok) onClose();
            return res;
          });
        }}
      >
        <input type="hidden" name="id" value={booking.id} />

        <Field id="edit-phone" labelText="Phone">
          <input
            id="edit-phone"
            name="phone"
            type="tel"
            defaultValue={booking.phone}
            className={input}
          />
        </Field>

        <ScheduleFields idPrefix="edit" booking={booking} />

        <Feedback result={result} />

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={btnPrimary} disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function AddBookingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pending, result, run } = useActionFeedback();
  const [formKey, setFormKey] = useState(0);

  return (
    <Dialog open={open} onClose={onClose} title="Add a booking" width="max-w-xl">
      <p className="mb-3 text-sm text-navy/70">
        For phone or walk-up guests. Nothing is emailed to them — send a confirmation yourself.
      </p>

      <form
        key={formKey}
        className="space-y-3"
        action={(formData) => {
          run(async () => {
            const res = await createBookingAction(formData);
            if (res.ok) setFormKey((k) => k + 1);
            return res;
          });
        }}
      >
        <GuestFields />
        <ScheduleFields idPrefix="add" />

        <Feedback result={result} />

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={btnGhost} onClick={onClose}>
            Close
          </button>
          <button type="submit" className={btnGold} disabled={pending}>
            {pending ? "Saving…" : "Add booking"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
