import { NextRequest, NextResponse } from "next/server";
import { SITE } from "@/lib/tours";

type Locale = "en" | "de";

/**
 * Final confirmation-email copy. The template is ready to send; only the
 * provider call below is still stubbed (see the wiring note in POST).
 */
function buildEmail(locale: Locale, name: string, bookingId: string) {
  if (locale === "de") {
    return {
      subject: `${SITE.name} — Ihre Buchung ist bestätigt (${bookingId})`,
      text: [
        `Guten Tag ${name},`,
        "",
        `vielen Dank für Ihre Buchung bei ${SITE.name}. Ihre Fahrt ist reserviert; die Buchungsnummer lautet ${bookingId}.`,
        "",
        "Treffpunkt und genaue Abfahrtszeit finden Sie unten. Bitte seien Sie fünf Minuten vorher da — wir warten bis zu 15 Minuten.",
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
        SITE.email,
      ].join("\n"),
    };
  }

  return {
    subject: `${SITE.name} — your booking is confirmed (${bookingId})`,
    text: [
      `Hello ${name},`,
      "",
      `thank you for booking with ${SITE.name}. Your ride is reserved and your booking reference is ${bookingId}.`,
      "",
      "The meeting point and exact departure time are below. Please arrive five minutes early — we can wait up to 15 minutes.",
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
      SITE.email,
    ].join("\n"),
  };
}

/**
 * Confirmation email trigger.
 *
 * DEV TODO: connect an email provider (Resend, Postmark, Nodemailer + SMTP).
 * Called after a booking is created; keep it non-blocking from the client.
 *
 * Example with Resend:
 *   await fetch('https://api.resend.com/emails', {
 *     method: 'POST',
 *     headers: {
 *       Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
 *       'Content-Type': 'application/json',
 *     },
 *     body: JSON.stringify({
 *       from: process.env.EMAIL_FROM,
 *       to: email,
 *       subject: mail.subject,
 *       text: mail.text,
 *     }),
 *   });
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.email || !body?.bookingId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const locale: Locale = body.locale === "de" ? "de" : "en";
  const mail = buildEmail(locale, String(body.name || "").trim() || "there", body.bookingId);

  if (!process.env.EMAIL_API_KEY) {
    console.info("[confirm-email] provider not configured; email not sent", {
      bookingId: body.bookingId,
      email: body.email,
      subject: mail.subject,
    });

    return NextResponse.json({
      ok: true,
      sent: false,
      message: "Email provider not configured — set EMAIL_API_KEY to send confirmations",
    });
  }

  return NextResponse.json({ ok: true, sent: false, subject: mail.subject });
}
