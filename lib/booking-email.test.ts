import { describe, expect, it } from "vitest";
import { buildConfirmationEmail, resolveEmailLocale, type ConfirmationBooking } from "./booking-email";
import { codeDefaults } from "./site-settings";

const booking: ConfirmationBooking = {
  id: "b1a2c3",
  name: "Anna Gruber",
  email: "anna@example.com",
  tour_type: "gold",
  date: "2026-10-03",
  time: "14:00:00",
  guest_count: 4,
  language: "de",
};

const settings = {
  ...codeDefaults(),
  meeting_point_street: "Schubertring 1",
  meeting_point_city: "1010 Wien",
  meeting_point_country: "Austria",
  contact_phone: "[Telefonnummer]",
};

describe("resolveEmailLocale", () => {
  it("prefers the site locale hint", () => {
    expect(resolveEmailLocale("en", "de")).toBe("en");
    expect(resolveEmailLocale("de", "en")).toBe("de");
  });

  it("falls back to the narration language, then English", () => {
    expect(resolveEmailLocale(undefined, "de")).toBe("de");
    expect(resolveEmailLocale(undefined, "it")).toBe("en");
    expect(resolveEmailLocale("es", "de")).toBe("en");
  });
});

describe("buildConfirmationEmail", () => {
  it("includes the booking details and meeting point in English", () => {
    const mail = buildConfirmationEmail({ ...booking, language: "en" }, "en", settings);
    expect(mail.subject).toContain("b1a2c3");
    expect(mail.text).toContain("Hello Anna Gruber,");
    expect(mail.text).toContain("Tour: Gold · 90 minutes");
    expect(mail.text).toContain("Date: Saturday, 3 October 2026");
    expect(mail.text).toContain("Departure: 14:00");
    expect(mail.text).toContain("Guests: 4");
    expect(mail.text).toContain("Language: English");
    expect(mail.text).toContain("Meeting point: Schubertring 1, 1010 Wien, Austria");
  });

  it("writes German copy", () => {
    const mail = buildConfirmationEmail(booking, "de", settings);
    expect(mail.subject).toContain("Ihre Buchung ist bestätigt");
    expect(mail.text).toContain("Guten Tag Anna Gruber,");
    expect(mail.text).toContain("Datum: Samstag, 3. Oktober 2026");
    expect(mail.text).toContain("Abfahrt: 14:00 Uhr");
    expect(mail.text).toContain("Treffpunkt: Schubertring 1, 1010 Wien, Austria");
  });

  it("never prints unfilled [placeholder] values", () => {
    const mail = buildConfirmationEmail(booking, "en", {
      ...settings,
      meeting_point_street: "[Straße]",
      meeting_point_city: "[PLZ Ort]",
      meeting_point_country: "[Land]",
    });
    expect(mail.text).not.toContain("[");
    expect(mail.text).toContain("we will send you the exact meeting point separately");
  });
});
