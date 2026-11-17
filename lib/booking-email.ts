import { getSupabaseServer } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-env";
import { getSiteSettings, isUnfilled, type ResolvedSiteSettings } from "@/lib/site-settings";
import { sendEmail, type SendResult } from "@/lib/email";
import {
  NARRATION_LANGUAGE_LABELS,
  SITE,
  SITE_URL,
  TOURS,
  type NarrationLanguage,
} from "@/lib/tours";

export type EmailLocale = "en" | "de";

export type ConfirmationBooking = {
  id: string;
  name: string;
  email: string;
  tour_type: string;
  date: string;
  time: string;
  guest_count: number;
  language: string;
  phone?: string | null;
  notes?: string | null;
};

/**
 * The guest's site locale isn't stored on the booking, so when the caller
 * can't pass it (e.g. the SumUp webhook) the narration language they picked
 * is the next best signal. Only EN and DE copy exist; everyone else gets EN.
 */
export function resolveEmailLocale(hint: string | undefined, narrationLanguage: string): EmailLocale {
  const pick = hint || narrationLanguage;
  return pick === "de" ? "de" : "en";
}

function formatDate(isoDay: string, locale: EmailLocale): string {
  const d = new Date(`${isoDay}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDay;
  return new Intl.DateTimeFormat(locale === "de" ? "de-AT" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function tourLabel(tourType: string, locale: EmailLocale): string {
  const tour = TOURS.find((t) => t.id === tourType);
  const name = tourType.charAt(0).toUpperCase() + tourType.slice(1);
  if (!tour) return name;
  return `${name} · ${tour.durationMinutes} ${locale === "de" ? "Minuten" : "minutes"}`;
}

function meetingPoint(settings: ResolvedSiteSettings): string | null {
  const parts = [
    settings.meeting_point_street,
    settings.meeting_point_city,
    settings.meeting_point_country,
  ].filter((p) => p.trim() && !isUnfilled(p));
  return parts.length ? parts.join(", ") : null;
}

/** Final confirmation-email copy, EN + DE. Pure, so it can be unit tested. */
export function buildConfirmationEmail(
  booking: ConfirmationBooking,
  locale: EmailLocale,
  settings: ResolvedSiteSettings,
) {
  const name = booking.name.trim() || (locale === "de" ? "Gast" : "there");
  const date = formatDate(booking.date, locale);
  const time = booking.time.slice(0, 5);
  const tour = tourLabel(booking.tour_type, locale);
  const narration =
    NARRATION_LANGUAGE_LABELS[booking.language as NarrationLanguage] ?? booking.language;
  const place = meetingPoint(settings);
  const contactEmail = settings.contact_email || SITE.email;
  const phone = isUnfilled(settings.contact_phone) ? "" : settings.contact_phone;

  if (locale === "de") {
    return {
      subject: `${SITE.name} — Ihre Buchung ist bestätigt (${booking.id})`,
      text: [
        `Guten Tag ${name},`,
        "",
        `vielen Dank für Ihre Buchung bei ${SITE.name}. Ihre Fahrt ist verbindlich reserviert.`,
        "",
        `Buchungsnummer: ${booking.id}`,
        `Tour: ${tour}`,
        `Datum: ${date}`,
        `Abfahrt: ${time} Uhr`,
        `Gäste: ${booking.guest_count}`,
        `Sprache: ${narration}`,
        place
          ? `Treffpunkt: ${place}`
          : "Treffpunkt: Den genauen Treffpunkt schicken wir Ihnen vor der Fahrt separat.",
        "",
        "Bitte seien Sie fünf Minuten vorher da — wir warten bis zu 15 Minuten.",
        "",
        "Was Sie wissen sollten:",
        "· Bei leichtem Regen fahren wir; die Wetterplanen sind in einer Minute oben.",
        "· Wird das Wetter unsicher, melden wir uns rechtzeitig und bieten einen Ersatztermin oder die volle Erstattung an.",
        "· Kostenlose Stornierung bis 24 Stunden vor Abfahrt.",
        "· Kinder unter 135 cm bzw. 14 Jahren brauchen einen Kindersitz — sagen Sie uns kurz Bescheid, dann liegt er bereit.",
        "",
        "Wenn sich etwas ändert, antworten Sie einfach auf diese E-Mail.",
        "",
        "Bis bald in Wien",
        SITE.name,
        contactEmail,
        ...(phone ? [phone] : []),
      ].join("\n"),
    };
  }

  return {
    subject: `${SITE.name} — your booking is confirmed (${booking.id})`,
    text: [
      `Hello ${name},`,
      "",
      `thank you for booking with ${SITE.name}. Your ride is confirmed.`,
      "",
      `Booking reference: ${booking.id}`,
      `Tour: ${tour}`,
      `Date: ${date}`,
      `Departure: ${time}`,
      `Guests: ${booking.guest_count}`,
      `Language: ${narration}`,
      place
        ? `Meeting point: ${place}`
        : "Meeting point: we will send you the exact meeting point separately before your tour.",
      "",
      "Please arrive five minutes early — we can wait up to 15 minutes.",
      "",
      "Worth knowing:",
      "· We drive in light rain; the weather covers go up in about a minute.",
      "· If conditions become unsafe we will be in touch in good time and offer another slot or a full refund.",
      "· Free cancellation up to 24 hours before departure.",
      "· Children under 135 cm or 14 years need a child seat — let us know and it will be in the car.",
      "",
      "If anything changes, simply reply to this email.",
      "",
      "See you in Vienna",
      SITE.name,
      contactEmail,
      ...(phone ? [phone] : []),
    ].join("\n"),
  };
}

export type OwnerNotice = "paid" | "held";

/** Email to the business owner about a new booking, in English. Pure. */
export function buildOwnerNotification(booking: ConfirmationBooking, notice: OwnerNotice) {
  const date = formatDate(booking.date, "en");
  const time = booking.time.slice(0, 5);
  const narration =
    NARRATION_LANGUAGE_LABELS[booking.language as NarrationLanguage] ?? booking.language;
  const headline =
    notice === "paid"
      ? "Paid online — confirmed. The guest has been sent their confirmation email."
      : "Not paid yet — online payment is off, so the booking is held. Send the guest a payment link, then mark it Confirmed in the admin (that emails them their confirmation).";

  return {
    subject: `New booking: ${booking.name} · ${date} ${time} · ${booking.guest_count} guests${
      notice === "held" ? " (awaiting payment)" : ""
    }`,
    text: [
      headline,
      "",
      `Guest: ${booking.name}`,
      `Email: ${booking.email}`,
      `Phone: ${booking.phone || "—"}`,
      "",
      `Tour: ${tourLabel(booking.tour_type, "en")}`,
      `Date: ${date}`,
      `Departure: ${time}`,
      `Guests: ${booking.guest_count}`,
      `Language: ${narration}`,
      `Notes: ${booking.notes?.trim() || "—"}`,
      "",
      `Booking reference: ${booking.id}`,
      `Admin: ${SITE_URL.replace(/\/+$/, "")}/admin/bookings`,
      "",
      "Reply to this email to write to the guest directly.",
    ].join("\n"),
  };
}

async function loadBooking(bookingId: string): Promise<ConfirmationBooking | null> {
  const supabase = supabaseConfigured() ? getSupabaseServer() : null;
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("bookings")
    .select("id, name, email, phone, tour_type, date, time, guest_count, language, notes")
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !data) {
    console.error("[booking-email] booking not found:", bookingId, error?.message);
    return null;
  }
  return data as ConfirmationBooking;
}

function logFailure(what: string, bookingId: string, result: SendResult) {
  if (!result.sent && result.reason !== "not_configured") {
    console.error(`[booking-email] ${what} for ${bookingId} not sent: ${result.reason}`);
  }
}

/**
 * Look up a booking and email the guest their confirmation. The recipient
 * always comes from the stored booking, never from a request body, so this
 * can't be abused to send mail to arbitrary addresses. Never throws.
 */
export async function sendBookingConfirmation(
  bookingId: string,
  opts: { locale?: string } = {},
): Promise<SendResult> {
  try {
    const booking = await loadBooking(bookingId);
    if (!booking) return { sent: false, reason: "booking_not_found" };

    const settings = await getSiteSettings();
    const locale = resolveEmailLocale(opts.locale, booking.language);
    const mail = buildConfirmationEmail(booking, locale, settings);

    const result = await sendEmail({
      to: booking.email,
      subject: mail.subject,
      text: mail.text,
      replyTo: settings.contact_email || SITE.email,
    });
    logFailure("confirmation", bookingId, result);
    return result;
  } catch (err) {
    console.error("[booking-email] unexpected error:", err);
    return { sent: false, reason: "error" };
  }
}

/**
 * Tell the owner about a new booking, at the contact email from
 * /admin/settings (falling back to SITE.email). Reply-To is the guest, so a
 * reply goes straight to them. Never throws.
 */
export async function sendOwnerNotification(
  bookingId: string,
  notice: OwnerNotice,
): Promise<SendResult> {
  try {
    const booking = await loadBooking(bookingId);
    if (!booking) return { sent: false, reason: "booking_not_found" };

    const settings = await getSiteSettings();
    const mail = buildOwnerNotification(booking, notice);

    const result = await sendEmail({
      to: settings.contact_email || SITE.email,
      subject: mail.subject,
      text: mail.text,
      replyTo: booking.email,
    });
    logFailure("owner notification", bookingId, result);
    return result;
  } catch (err) {
    console.error("[booking-email] unexpected error:", err);
    return { sent: false, reason: "error" };
  }
}

/** Guest confirmation + owner notice after a payment, sent in parallel. */
export async function sendPaidBookingEmails(bookingId: string, opts: { locale?: string } = {}) {
  await Promise.all([
    sendBookingConfirmation(bookingId, opts),
    sendOwnerNotification(bookingId, "paid"),
  ]);
}
