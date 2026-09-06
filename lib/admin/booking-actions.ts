"use server";

import { revalidatePath } from "next/cache";
import { MAX_GUESTS, MIN_GUESTS, NARRATION_LANGUAGES, TOURS } from "@/lib/tours";
import { bool, dbFailure, failure, num, requireAdmin, str, success } from "./guard";
import { BOOKING_STATUSES, type ActionResult, type AdminBookingStatus } from "./types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^\d{2}:\d{2}$/;

/** Admin may record slightly larger walk-up / phone parties than the public form. */
const ADMIN_MAX_GUESTS = MAX_GUESTS + 7;

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
}

function validateCore(formData: FormData): string | null {
  const date = str(formData, "date");
  const time = str(formData, "time");
  const guests = num(formData, "guest_count");

  if (!ISO_DAY.test(date)) return "Pick a valid date.";
  if (!HHMM.test(time)) return "Pick a valid time, e.g. 14:00.";
  if (!Number.isInteger(guests) || guests < MIN_GUESTS || guests > ADMIN_MAX_GUESTS) {
    return `Guest count must be between ${MIN_GUESTS} and ${ADMIN_MAX_GUESTS}.`;
  }
  return null;
}

export async function createBookingAction(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const phone = str(formData, "phone");
  const tourType = str(formData, "tour_type");
  const language = str(formData, "language");
  const status = str(formData, "status") as AdminBookingStatus;

  if (!name) return failure("Enter the guest's name.");
  if (!EMAIL.test(email)) return failure("Enter a valid email address.");
  if (!phone) return failure("Enter a phone number.");
  if (!TOURS.some((t) => t.id === tourType)) return failure("Choose a tour tier.");
  if (!NARRATION_LANGUAGES.includes(language as (typeof NARRATION_LANGUAGES)[number])) {
    return failure("Choose a narration language.");
  }
  if (!BOOKING_STATUSES.includes(status)) return failure("Choose a status.");

  const invalid = validateCore(formData);
  if (invalid) return failure(invalid);

  const { error } = await gate.supabase.from("bookings").insert({
    name,
    email,
    phone,
    tour_type: tourType,
    date: str(formData, "date"),
    time: str(formData, "time"),
    guest_count: num(formData, "guest_count"),
    language,
    notes: str(formData, "notes") || null,
    status,
  });

  if (error) return dbFailure("Could not add the booking", error);

  refresh();
  return success(`Booking for ${name} added.`);
}

export async function updateBookingAction(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  const id = str(formData, "id");
  if (!id) return failure("Missing booking id.");

  const invalid = validateCore(formData);
  if (invalid) return failure(invalid);

  const { error } = await gate.supabase
    .from("bookings")
    .update({
      date: str(formData, "date"),
      time: str(formData, "time"),
      guest_count: num(formData, "guest_count"),
      notes: str(formData, "notes") || null,
      phone: str(formData, "phone") || undefined,
    })
    .eq("id", id);

  if (error) return dbFailure("Could not save the booking", error);

  refresh();
  return success("Booking updated.");
}

export async function updateBookingStatusAction(
  id: string,
  status: AdminBookingStatus,
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  if (!id) return failure("Missing booking id.");
  if (!BOOKING_STATUSES.includes(status)) return failure("Unknown status.");

  const { error } = await gate.supabase.from("bookings").update({ status }).eq("id", id);
  if (error) return dbFailure("Could not change the status", error);

  refresh();
  return success(`Status set to ${status.replace("_", " ")}.`);
}

export async function deleteBookingAction(id: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  if (!id) return failure("Missing booking id.");

  const { error } = await gate.supabase.from("bookings").delete().eq("id", id);
  if (error) return dbFailure("Could not delete the booking", error);

  refresh();
  return success("Booking deleted.");
}

export async function createBlockedSlotAction(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  const date = str(formData, "date");
  const endDate = str(formData, "end_date");
  const wholeDay = bool(formData, "whole_day");
  const startTime = str(formData, "start_time");
  const endTime = str(formData, "end_time");
  const reason = str(formData, "reason") || null;

  if (!ISO_DAY.test(date)) return failure("Pick a date to block.");
  if (endDate && !ISO_DAY.test(endDate)) return failure("The end date is not valid.");
  if (endDate && endDate < date) return failure("The end date is before the start date.");

  if (!wholeDay) {
    if (!HHMM.test(startTime) || !HHMM.test(endTime)) {
      return failure("Enter both a start and end time, or block the whole day.");
    }
    if (endTime <= startTime) return failure("The end time must be after the start time.");
  }

  const rows: { date: string; start_time: string | null; end_time: string | null; reason: string | null }[] = [];
  const cursor = new Date(`${date}T12:00:00`);
  const last = new Date(`${endDate || date}T12:00:00`);

  // Blocking a holiday week should be one form submission, not seven.
  while (cursor <= last && rows.length < 366) {
    rows.push({
      date: cursor.toISOString().slice(0, 10),
      start_time: wholeDay ? null : startTime,
      end_time: wholeDay ? null : endTime,
      reason,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const { error } = await gate.supabase.from("blocked_slots").insert(rows);
  if (error) return dbFailure("Could not block that time", error);

  revalidatePath("/admin/availability");
  revalidatePath("/admin");
  return success(rows.length === 1 ? "Date blocked." : `${rows.length} dates blocked.`);
}

export async function deleteBlockedSlotAction(id: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  if (!id) return failure("Missing id.");

  const { error } = await gate.supabase.from("blocked_slots").delete().eq("id", id);
  if (error) return dbFailure("Could not unblock that time", error);

  revalidatePath("/admin/availability");
  revalidatePath("/admin");
  return success("Unblocked.");
}
