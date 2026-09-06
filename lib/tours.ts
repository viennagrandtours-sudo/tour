export type TourType = "bronze" | "silver" | "gold" | "diamond";

export type Tour = {
  id: TourType;
  durationMinutes: number;
  /** Price per person, euro. */
  pricePerPerson: number;
  minGuests: number;
  /** Seats per car (not a hard cap on the whole booking). */
  maxGuests: number;
};

/**
 * next-intl treats "." as a nesting separator. Current tour ids have none;
 * keep the helper so lookups stay `tours.tiers.${tourTierKey(id)}`.
 */
export function tourTierKey(id: TourType): string {
  return id.replaceAll(".", "_");
}

/**
 * Routes follow Ring Tours Vienna sights, named Bronze · Silver · Gold · Diamond.
 * Prices are per person, minimum 3 guests per booking.
 * Each car seats up to 7; larger groups ride in multiple cars.
 */
export const TOURS: Tour[] = [
  { id: "bronze", durationMinutes: 30, pricePerPerson: 25, minGuests: 3, maxGuests: 7 },
  { id: "silver", durationMinutes: 60, pricePerPerson: 39, minGuests: 3, maxGuests: 7 },
  { id: "gold", durationMinutes: 90, pricePerPerson: 49, minGuests: 3, maxGuests: 7 },
  { id: "diamond", durationMinutes: 120, pricePerPerson: 69, minGuests: 3, maxGuests: 7 },
];

/** Minimum guests for any booking (total, not per car). */
export const MIN_GUESTS = 3;
/** Seats available for guests in one car (guide rides separately). */
export const MAX_GUESTS_PER_CAR = 7;
/**
 * Soft online-booking cap (4 cars). Larger parties can still enquire by email;
 * we confirm fleet availability after the request.
 */
export const MAX_GUESTS = 28;

/** Cars required for a party size (ceil of guests ÷ seats per car). */
export function carsNeeded(guestCount: number): number {
  if (!Number.isFinite(guestCount) || guestCount <= 0) return 1;
  return Math.ceil(guestCount / MAX_GUESTS_PER_CAR);
}

/** Tour narration / guide language codes offered at booking. */
export const NARRATION_LANGUAGES = [
  "en",
  "de",
  "es",
  "it",
  "ar",
  "zh",
  "pt",
  "tr",
] as const;

export type NarrationLanguage = (typeof NARRATION_LANGUAGES)[number];

/** Native endonyms for the booking language step and admin dropdown. */
export const NARRATION_LANGUAGE_LABELS: Record<NarrationLanguage, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  ar: "العربية",
  zh: "中文",
  pt: "Português",
  tr: "Türkçe",
};

export const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
] as const;

export function getTour(id: TourType): Tour {
  const tour = TOURS.find((t) => t.id === id);
  if (!tour) throw new Error(`Unknown tour: ${id}`);
  return tour;
}

export function calculateTotal(tourType: TourType, guestCount: number): number {
  return getTour(tourType).pricePerPerson * guestCount;
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://viennagrandtours.com";

/**
 * Values in square brackets are unfilled and must be completed by the owner
 * before go-live (see the "Legal fill-ins" table in README.md). `isFillIn()`
 * lets the UI hide anything still bracketed instead of showing it to visitors;
 * the legal pages deliberately render them so the gaps stay obvious.
 */
export function isFillIn(value: string): boolean {
  return value.trim().startsWith("[");
}

export const SITE = {
  name: "Vienna Grand Tours",
  /** Two-line typographic wordmark used in the header and footer. */
  wordmark: {
    top: "Vienna",
    bottom: "Grand Tours",
  },
  tagline: {
    en: "Private guided tours in a fleet of vintage-style electric vehicles",
    de: "Private Stadtrundfahrten in einer Flotte elektrischer Oldtimer-Fahrzeuge",
  },
  email: "hello@viennagrandtours.com",
  phone: "[Telefonnummer]",
  address: {
    street: "Rüdigergasse 18/5",
    city: "1050 Wien",
    country: "Österreich",
  },
  googleBusinessUrl: "https://www.google.com/maps?cid=[Google-Business-ID]",
  social: {
    instagram: "https://instagram.com/[instagram-handle]",
    facebook: "https://facebook.com/[facebook-handle]",
  },
  legal: {
    companyName: "Ahmed Wezza",
    legalForm: "Einzelunternehmen (Privatperson / Inhaber)",
    owner: "Ahmed Wezza",
    /** Einzelunternehmen not entered in the Firmenbuch — GISA is the register reference. */
    firmenbuch: "Nicht im Firmenbuch eingetragen (Einzelunternehmen)",
    court: "—",
    gisa: "33978789",
    /**
     * No UID — Kleinunternehmer (§ 6 Abs. 1 Z 27 UStG): no VAT charged.
     * Leave empty; Impressum shows the exemption note instead.
     */
    uid: "",
    vatExempt: true,
    chamber: "Wirtschaftskammer Wien, Fachgruppe Hotellerie und Tourismus",
    tradeAuthorityDistrict: "5",
  },
} as const;
