import type { ReactNode } from "react";
import { card, cardPad, kicker } from "./styles";
import type { AdminBookingStatus, DataSource, MessageStatus } from "@/lib/admin/types";
import { BOOKING_STATUS_LABELS } from "@/lib/admin/types";

/** Presentational pieces shared by the admin screens. No interactivity here. */

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-navy/60">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  hint,
  children,
  action,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={card}>
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy/10 px-4 py-3 sm:px-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-navy">{title}</h2>
            {hint ? <p className="text-xs text-navy/55">{hint}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={cardPad}>{children}</div>
    </section>
  );
}

const STATUS_TONE: Record<AdminBookingStatus, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  awaiting_payment: "border-orange-300 bg-orange-50 text-orange-800",
  confirmed: "border-emerald-300 bg-emerald-50 text-emerald-800",
  completed: "border-navy/25 bg-navy/5 text-navy",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: AdminBookingStatus }) {
  const tone = STATUS_TONE[status] ?? "border-navy/20 bg-white text-navy";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}
    >
      {BOOKING_STATUS_LABELS[status] ?? status}
    </span>
  );
}

const MESSAGE_TONE: Record<MessageStatus, string> = {
  new: "border-gold bg-gold/15 text-navy",
  read: "border-navy/20 bg-white text-navy/70",
  handled: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

export function MessageBadge({ status }: { status: MessageStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${
        MESSAGE_TONE[status] ?? MESSAGE_TONE.new
      }`}
    >
      {status}
    </span>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "gold" | "muted" }) {
  const tones = {
    neutral: "border-navy/20 bg-white text-navy/75",
    gold: "border-gold bg-gold/15 text-navy",
    muted: "border-navy/10 bg-navy/5 text-navy/55",
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Banner shown above data when it is demo-only or a query failed. */
export function DataNotice({ source, error }: { source: DataSource; error?: string | null }) {
  if (error) {
    return (
      <div
        role="alert"
        className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
      >
        <strong className="font-semibold">Something went wrong. </strong>
        {error}
      </div>
    );
  }

  if (source === "demo") {
    return (
      <div className="mb-4 rounded-md border border-gold bg-gold/10 px-4 py-3 text-sm text-navy">
        <strong className="font-semibold">Demo data. </strong>
        Supabase is not configured, so these are made-up rows and nothing you change will be
        saved. Set <code className="rounded bg-white px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
        and <code className="rounded bg-white px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
        to go live.
      </div>
    );
  }

  return null;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-md border border-dashed border-navy/20 bg-cream-warm/40 px-5 py-10 text-center">
      <p className="font-display text-lg text-navy">{title}</p>
      {hint ? <p className="mx-auto mt-1 max-w-md text-sm text-navy/55">{hint}</p> : null}
    </div>
  );
}

export function StatCard({
  label: statLabel,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "gold";
}) {
  return (
    <div
      className={`rounded-md border px-4 py-3.5 ${
        tone === "gold" ? "border-gold/60 bg-gold/10" : "border-navy/10 bg-cream-soft"
      }`}
    >
      <p className={kicker}>{statLabel}</p>
      <p className="mt-1 font-display text-2xl font-semibold leading-none text-navy sm:text-3xl">
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-navy/55">{hint}</p> : null}
    </div>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded bg-navy/5" />
      ))}
    </div>
  );
}
