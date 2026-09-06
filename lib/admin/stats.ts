import type { ResolvedTour } from "@/lib/tour-settings";
import type { AdminBooking, AdminBookingStatus } from "./types";
import { addDaysIso, parseDay, todayIso } from "./format";

export type DashboardStats = {
  total: number;
  upcoming: number;
  thisWeek: number;
  thisMonth: number;
  guestsUpcoming: number;
  revenueConfirmed: number;
  revenuePipeline: number;
  revenueThisMonth: number;
  byStatus: Record<AdminBookingStatus, number>;
  nextTours: AdminBooking[];
  perDay: { date: string; count: number }[];
};

const EMPTY_STATUS: Record<AdminBookingStatus, number> = {
  pending: 0,
  awaiting_payment: 0,
  confirmed: 0,
  completed: 0,
  cancelled: 0,
};

function priceOf(tours: ResolvedTour[], tourType: string): number {
  return tours.find((t) => t.id === tourType)?.pricePerPerson ?? 0;
}

/** Monday-based start of the current week, as `YYYY-MM-DD`. */
function startOfWeekIso(today: string): string {
  const d = parseDay(today);
  const dow = (d.getDay() + 6) % 7;
  return addDaysIso(today, -dow);
}

export function bookingValue(booking: AdminBooking, tours: ResolvedTour[]): number {
  return priceOf(tours, booking.tour_type) * booking.guest_count;
}

export function computeStats(
  bookings: AdminBooking[],
  tours: ResolvedTour[],
): DashboardStats {
  const today = todayIso();
  const weekStart = startOfWeekIso(today);
  const weekEnd = addDaysIso(weekStart, 7);
  const monthPrefix = today.slice(0, 7);

  const byStatus = { ...EMPTY_STATUS };
  let upcoming = 0;
  let thisWeek = 0;
  let thisMonth = 0;
  let guestsUpcoming = 0;
  let revenueConfirmed = 0;
  let revenuePipeline = 0;
  let revenueThisMonth = 0;

  for (const b of bookings) {
    if (b.status in byStatus) byStatus[b.status] += 1;

    const value = bookingValue(b, tours);
    const isCancelled = b.status === "cancelled";
    const isEarned = b.status === "confirmed" || b.status === "completed";

    if (b.date >= today && !isCancelled) {
      upcoming += 1;
      guestsUpcoming += b.guest_count;
    }
    if (b.date >= weekStart && b.date < weekEnd && !isCancelled) thisWeek += 1;
    if (b.date.startsWith(monthPrefix) && !isCancelled) {
      thisMonth += 1;
      revenueThisMonth += value;
    }

    if (isEarned) revenueConfirmed += value;
    else if (!isCancelled) revenuePipeline += value;
  }

  const nextTours = bookings
    .filter((b) => b.date >= today && b.status !== "cancelled")
    .sort((a, b) =>
      a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
    )
    .slice(0, 6);

  // 14-day window centred on today: a week of history plus the week ahead.
  const perDay: { date: string; count: number }[] = [];
  for (let i = -6; i <= 7; i += 1) {
    const date = addDaysIso(today, i);
    perDay.push({
      date,
      count: bookings.filter((b) => b.date === date && b.status !== "cancelled").length,
    });
  }

  return {
    total: bookings.length,
    upcoming,
    thisWeek,
    thisMonth,
    guestsUpcoming,
    revenueConfirmed,
    revenuePipeline,
    revenueThisMonth,
    byStatus,
    nextTours,
    perDay,
  };
}
