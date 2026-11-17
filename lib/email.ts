import nodemailer from "nodemailer";
import { SITE } from "@/lib/tours";

/**
 * Transactional email. Server-only: none of these secrets may reach the
 * browser. Two ways to send, checked in this order:
 *
 * 1. A normal Gmail account over SMTP (no domain needed):
 *      GMAIL_USER         — the Gmail address, e.g. viennagrandtours@gmail.com
 *      GMAIL_APP_PASSWORD — a 16-character Google *app password*, not the
 *                           normal login password (needs 2-Step Verification)
 *
 * 2. Resend (https://resend.com), sending from the business's own domain:
 *      EMAIL_API_KEY — Resend API key (re_…)
 *      EMAIL_FROM    — sender on a domain verified in Resend
 */

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export type SendResult = { sent: true; id?: string } | { sent: false; reason: string };

function gmailCredentials() {
  const user = process.env.GMAIL_USER?.trim();
  // Google shows app passwords in groups of four ("abcd efgh ijkl mnop");
  // accept them pasted either way.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  return user && pass ? { user, pass } : null;
}

export function emailConfigured(): boolean {
  return Boolean(
    gmailCredentials() || (process.env.EMAIL_API_KEY?.trim() && process.env.EMAIL_FROM?.trim()),
  );
}

async function sendViaGmail(
  mail: OutgoingEmail,
  auth: { user: string; pass: string },
): Promise<SendResult> {
  try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth,
      // Serverless functions have a hard time limit; fail fast instead.
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });

    const info = await transport.sendMail({
      // Gmail always sends as the signed-in account; only the display name is ours.
      from: { name: SITE.name, address: auth.user },
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
    });

    return { sent: true, id: info.messageId };
  } catch (err) {
    console.error("[email] Gmail send failed:", err);
    return { sent: false, reason: "gmail_error" };
  }
}

async function sendViaResend(
  mail: OutgoingEmail,
  apiKey: string,
  from: string,
): Promise<SendResult> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[email] Resend rejected the email (${res.status}):`, detail);
      return { sent: false, reason: `provider_${res.status}` };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { sent: true, id: data.id };
  } catch (err) {
    console.error("[email] Resend send failed:", err);
    return { sent: false, reason: "network" };
  }
}

/** Never throws — a failed email must not fail the booking it belongs to. */
export async function sendEmail(mail: OutgoingEmail): Promise<SendResult> {
  const gmail = gmailCredentials();
  if (gmail) return sendViaGmail(mail, gmail);

  const apiKey = process.env.EMAIL_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (apiKey && from) return sendViaResend(mail, apiKey, from);

  console.info("[email] no email account configured; email not sent", {
    to: mail.to,
    subject: mail.subject,
  });
  return { sent: false, reason: "not_configured" };
}
