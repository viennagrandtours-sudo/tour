import { formatDateShort, todayIso } from "@/lib/admin/format";

/**
 * Hand-rolled inline SVG bar chart — 14 days of booking counts. Deliberately
 * not a charting library; this is the only chart in the app.
 */
export function BookingsChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) return null;

  const today = todayIso();
  const max = Math.max(1, ...data.map((d) => d.count));
  const width = 100;
  const height = 46;
  const gap = 1.2;
  const barWidth = (width - gap * (data.length - 1)) / data.length;

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Bookings per day over 14 days, ${total} in total. ${data
          .map((d) => `${formatDateShort(d.date)}: ${d.count}`)
          .join(", ")}.`}
        className="h-28 w-full"
      >
        {data.map((d, i) => {
          const barHeight = (d.count / max) * (height - 4);
          const isToday = d.date === today;
          const isPast = d.date < today;
          return (
            <rect
              key={d.date}
              x={i * (barWidth + gap)}
              y={height - Math.max(barHeight, d.count > 0 ? 1.5 : 0.6)}
              width={barWidth}
              height={Math.max(barHeight, d.count > 0 ? 1.5 : 0.6)}
              rx={0.6}
              fill={isToday ? "#C4A35A" : isPast ? "#3D6B58" : "#1B3A2F"}
              opacity={d.count === 0 ? 0.18 : 1}
            />
          );
        })}
      </svg>

      <div className="mt-1.5 flex justify-between text-xs text-navy/70">
        <span>{formatDateShort(data[0].date)}</span>
        <span className="font-semibold text-gold-deep">Today</span>
        <span>{formatDateShort(data[data.length - 1].date)}</span>
      </div>

      <figcaption className="mt-2 text-xs text-navy/70">
        {total} booked tour{total === 1 ? "" : "s"} across this 14-day window (cancellations
        excluded).
      </figcaption>
    </figure>
  );
}
