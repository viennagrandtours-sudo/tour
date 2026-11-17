import { afterEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail })) },
}));

import { emailConfigured, sendEmail } from "./email";

const mail = { to: "guest@example.com", subject: "Hi", text: "Body", replyTo: "owner@example.com" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  sendMail.mockReset();
});

describe("sendEmail", () => {
  it("does nothing when no account is configured", async () => {
    vi.stubEnv("GMAIL_USER", "");
    vi.stubEnv("GMAIL_APP_PASSWORD", "");
    vi.stubEnv("EMAIL_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    expect(emailConfigured()).toBe(false);
    expect(await sendEmail(mail)).toEqual({ sent: false, reason: "not_configured" });
  });

  it("sends through Gmail, accepting the app password with spaces", async () => {
    vi.stubEnv("GMAIL_USER", "viennagrandtours@gmail.com");
    vi.stubEnv("GMAIL_APP_PASSWORD", "abcd efgh ijkl mnop");
    sendMail.mockResolvedValue({ messageId: "m1" });

    expect(await sendEmail(mail)).toEqual({ sent: true, id: "m1" });
    const nodemailer = (await import("nodemailer")).default;
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        service: "gmail",
        auth: { user: "viennagrandtours@gmail.com", pass: "abcdefghijklmnop" },
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "guest@example.com", replyTo: "owner@example.com" }),
    );
  });

  it("sends through Resend when Gmail is not set", async () => {
    vi.stubEnv("GMAIL_USER", "");
    vi.stubEnv("GMAIL_APP_PASSWORD", "");
    vi.stubEnv("EMAIL_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Vienna Grand Tours <bookings@viennagrandtours.com>");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "r1" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    expect(await sendEmail(mail)).toEqual({ sent: true, id: "r1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(JSON.parse(init.body)).toMatchObject({
      from: "Vienna Grand Tours <bookings@viennagrandtours.com>",
      to: ["guest@example.com"],
      reply_to: "owner@example.com",
    });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("reports a failed send instead of throwing", async () => {
    vi.stubEnv("GMAIL_USER", "viennagrandtours@gmail.com");
    vi.stubEnv("GMAIL_APP_PASSWORD", "abcdefghijklmnop");
    sendMail.mockRejectedValue(new Error("Invalid login"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await sendEmail(mail)).toEqual({ sent: false, reason: "gmail_error" });
  });
});
