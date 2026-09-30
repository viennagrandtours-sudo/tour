/**
 * Transactional email via Resend (https://resend.com), called with plain
 * fetch so there is no SDK dependency. Server-only: EMAIL_API_KEY must never
 * reach the browser.
 *
 * Env:
 *   EMAIL_API_KEY — Resend API key (re_…)
 *   EMAIL_FROM    — sender on a domain verified in Resend,
 *                   e.g. "Vienna Grand Tours <bookings@viennagrandtours.com>"
 */

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export type SendResult = { sent: true; id?: string } | { sent: false; reason: string };

export function emailConfigured(): boolean {
  return Boolean(process.env.EMAIL_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

/** Never throws — a failed email must not fail the booking it belongs to. */
export async function sendEmail(mail: OutgoingEmail): Promise<SendResult> {
  const apiKey = process.env.EMAIL_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    console.info("[email] provider not configured; email not sent", {
      to: mail.to,
      subject: mail.subject,
    });
    return { sent: false, reason: "not_configured" };
  }

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
      // Serverless functions have a hard time limit; don't let a slow
      // provider hold the payment confirmation response hostage.
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
    console.error("[email] send failed:", err);
    return { sent: false, reason: "network" };
  }
}
