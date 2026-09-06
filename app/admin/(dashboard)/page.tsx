import Link from "next/link";
import { fetchBlockedSlots, fetchBookings, fetchMessages, fetchResolvedTours } from "@/lib/admin/data";
import { computeStats } from "@/lib/admin/stats";
import { formatDate, formatEur, relativeDay } from "@/lib/admin/format";
import { BOOKING_STATUS_LABELS } from "@/lib/admin/types";
import { BookingsChart } from "@/components/admin/BookingsChart";
import {
  DataNotice,
  EmptyState,
  PageHeading,
  Panel,
  Pill,
  StatCard,
  StatusBadge,
} from "@/components/admin/ui";
import { btnGhost, td, th, table, tableWrap } from "@/components/admin/styles";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [bookings, tours, blocked, messages] = await Promise.all([
    fetchBookings(),
    fetchResolvedTours(),
    fetchBlockedSlots(),
    fetchMessages(),
  ]);

  const stats = computeStats(bookings.data, tours.data);
  const unreadMessages = messages.data.filter((m) => m.status === "new").length;
  const nextBlocked = blocked.data[0];

  return (
    <>
      <PageHeading
        title="Overview"
        description="Where the business stands right now."
        action={
          <>
            <Link href="/admin/bookings" className={btnGhost}>
              All bookings
            </Link>
            <Link href="/admin/availability" className={btnGhost}>
              Block a date
            </Link>
          </>
        }
      />

      <DataNotice source={bookings.source} error={bookings.error} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Upcoming tours"
          value={stats.upcoming}
          hint={`${stats.guestsUpcoming} guests booked`}
          tone="gold"
        />
        <StatCard label="This week" value={stats.thisWeek} hint="Mon–Sun, cancellations excluded" />
        <StatCard
          label="This month"
          value={stats.thisMonth}
          hint={`${formatEur(stats.revenueThisMonth)} of tours`}
        />
        <StatCard label="All time" value={stats.total} hint="Every booking ever taken" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <StatCard
          label="Confirmed & completed"
          value={formatEur(stats.revenueConfirmed)}
          hint="Guests × tier price. An estimate, not accounting."
        />
        <StatCard
          label="Still to be confirmed"
          value={formatEur(stats.revenuePipeline)}
          hint="Pending and awaiting-payment bookings"
        />
        <StatCard
          label="Unread messages"
          value={unreadMessages}
          hint={unreadMessages > 0 ? "Waiting in the inbox" : "Inbox is clear"}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Next tours"
            hint="The soonest six that are not cancelled."
            action={
              <Link href="/admin/bookings" className="text-xs font-semibold text-navy underline">
                See all
              </Link>
            }
          >
            {stats.nextTours.length === 0 ? (
              <EmptyState
                title="Nothing on the calendar"
                hint="New bookings from the website land here automatically. You can also add a phone booking from the Bookings screen."
              />
            ) : (
              <div className={tableWrap}>
                <table className={`${table} min-w-[560px]`}>
                  <caption className="sr-only">Upcoming tours</caption>
                  <thead>
                    <tr>
                      <th scope="col" className={th}>
                        Date
                      </th>
                      <th scope="col" className={th}>
                        Time
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
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.nextTours.map((booking) => (
                      <tr key={booking.id} className="hover:bg-cream-warm/40">
                        <td className={td}>
                          <span className="font-semibold text-navy">{formatDate(booking.date)}</span>
                          <span className="block text-xs text-navy/70">
                            {relativeDay(booking.date)}
                          </span>
                        </td>
                        <td className={`${td} tabular-nums`}>{booking.time}</td>
                        <td className={td}>
                          <span className="font-medium">{booking.name}</span>
                          <span className="block text-xs text-navy/70">{booking.phone}</span>
                        </td>
                        <td className={td}>{booking.tour_type}</td>
                        <td className={`${td} tabular-nums`}>{booking.guest_count}</td>
                        <td className={td}>
                          <StatusBadge status={booking.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Bookings per day" hint="Last week and the week ahead.">
            <BookingsChart data={stats.perDay} />
          </Panel>

          <Panel title="By status">
            <ul className="space-y-1.5">
              {(
                Object.entries(stats.byStatus) as [keyof typeof stats.byStatus, number][]
              ).map(([status, count]) => (
                <li key={status} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-navy/70">{BOOKING_STATUS_LABELS[status]}</span>
                  <span className="font-display text-lg font-semibold tabular-nums text-navy">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Blocked dates" hint="Days the booking form will not offer.">
            {blocked.data.length === 0 ? (
              <p className="text-sm text-navy/70">
                Nothing blocked.{" "}
                <Link href="/admin/availability" className="font-semibold underline">
                  Block a date
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-navy/70">
                  <span className="font-semibold">{blocked.data.length}</span> upcoming block
                  {blocked.data.length === 1 ? "" : "s"}, next on{" "}
                  <span className="font-semibold">{formatDate(nextBlocked.date)}</span>.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {blocked.data.slice(0, 6).map((slot) => (
                    <Pill key={slot.id}>
                      {formatDate(slot.date)}
                      {slot.start_time ? ` · ${slot.start_time}–${slot.end_time}` : " · all day"}
                    </Pill>
                  ))}
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
