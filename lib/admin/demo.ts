import type {
  AdminBooking,
  AdminMessage,
  AdminTestimonial,
  BlockedSlot,
  SitePhotoRow,
} from "./types";

/**
 * Stand-in data used when Supabase env vars are missing, mirroring the demo
 * fallback in app/api/bookings/route.ts. Every screen labels this clearly so
 * nobody mistakes it for real business data.
 */

function isoDay(offsetDays: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function isoStamp(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

export const DEMO_BOOKINGS: AdminBooking[] = [
  {
    id: "demo-1",
    name: "Anna Kaufmann",
    email: "anna.kaufmann@example.com",
    phone: "+43 660 1234567",
    tour_type: "gold",
    date: isoDay(1),
    time: "10:00",
    guest_count: 4,
    language: "de",
    notes: "Anniversary trip — would love a photo stop at the Rathaus.",
    status: "confirmed",
    created_at: isoStamp(-3),
  },
  {
    id: "demo-2",
    name: "James Rowe",
    email: "j.rowe@example.com",
    phone: "+44 7700 900123",
    tour_type: "silver",
    date: isoDay(2),
    time: "14:00",
    guest_count: 3,
    language: "en",
    notes: null,
    status: "pending",
    created_at: isoStamp(-2),
  },
  {
    id: "demo-3",
    name: "Elena Moreno",
    email: "elena.moreno@example.com",
    phone: "+34 600 112233",
    tour_type: "diamond",
    date: isoDay(5),
    time: "16:00",
    guest_count: 6,
    language: "es",
    notes: "Two guests have limited mobility.",
    status: "awaiting_payment",
    created_at: isoStamp(-1),
  },
  {
    id: "demo-4",
    name: "Mehmet Yılmaz",
    email: "m.yilmaz@example.com",
    phone: "+90 532 000 0000",
    tour_type: "bronze",
    date: isoDay(9),
    time: "11:00",
    guest_count: 3,
    language: "tr",
    notes: null,
    status: "confirmed",
    created_at: isoStamp(-1),
  },
  {
    id: "demo-5",
    name: "Sophie Bauer",
    email: "sophie.bauer@example.com",
    phone: "+43 664 9988776",
    tour_type: "silver",
    date: isoDay(-4),
    time: "09:00",
    guest_count: 5,
    language: "de",
    notes: "Paid in cash on the day.",
    status: "completed",
    created_at: isoStamp(-12),
  },
  {
    id: "demo-6",
    name: "Tomás Silva",
    email: "tomas.silva@example.com",
    phone: "+351 910 000 000",
    tour_type: "gold",
    date: isoDay(-9),
    time: "15:00",
    guest_count: 4,
    language: "en",
    notes: "Cancelled due to heavy rain, offered a reschedule.",
    status: "cancelled",
    created_at: isoStamp(-18),
  },
  {
    id: "demo-7",
    name: "Klara Novak",
    email: "klara.novak@example.com",
    phone: "+420 601 000 000",
    tour_type: "diamond",
    date: isoDay(-1),
    time: "13:00",
    guest_count: 6,
    language: "en",
    notes: null,
    status: "completed",
    created_at: isoStamp(-6),
  },
];

export const DEMO_TESTIMONIALS: AdminTestimonial[] = [
  {
    id: "demo-t1",
    author_name: "Anna K.",
    rating: 5,
    quote: "Warm, personal, and the perfect way to see Vienna without rushing.",
    locale: "en",
    published: true,
    featured: true,
    sort_order: 1,
    is_sample: true,
    created_at: isoStamp(-40),
  },
  {
    id: "demo-t2",
    author_name: "James R.",
    rating: 5,
    quote:
      "Beautiful vehicle, great stories in English — felt like a local friend was driving.",
    locale: "en",
    published: true,
    featured: false,
    sort_order: 2,
    is_sample: true,
    created_at: isoStamp(-30),
  },
  {
    id: "demo-t3",
    author_name: "Elena M.",
    rating: 5,
    quote:
      "Wir haben die 1,5-Stunden-Tour gebucht und wünschten, sie wäre länger.",
    locale: "de",
    published: false,
    featured: false,
    sort_order: 3,
    is_sample: true,
    created_at: isoStamp(-20),
  },
];

export const DEMO_MESSAGES: AdminMessage[] = [
  {
    id: "demo-m1",
    name: "Hotel Sacher Concierge",
    email: "concierge@example.com",
    message:
      "Do you offer a standing arrangement for hotel guests? We would send roughly two groups a week.",
    status: "new",
    created_at: isoStamp(-1),
  },
  {
    id: "demo-m2",
    name: "Peter Gruber",
    email: "p.gruber@example.com",
    message: "Is the vehicle wheelchair accessible? Asking for my mother.",
    status: "read",
    created_at: isoStamp(-4),
  },
  {
    id: "demo-m3",
    name: "Laura Fischer",
    email: "laura.f@example.com",
    message: "Could we book a private tour for a company offsite in September?",
    status: "handled",
    created_at: isoStamp(-11),
  },
];

/**
 * Two example photo rows so /admin/photos shows what an edited slot and an
 * owner-added gallery photo look like. Neither has a storage_path, because demo
 * mode has no Supabase Storage to upload to.
 */
export const DEMO_SITE_PHOTOS: SitePhotoRow[] = [
  {
    id: "demo-p1",
    slot_key: "c1",
    category: "city",
    storage_path: null,
    title: "Stephansdom rooftops at sunset",
    alt_en: "Sunset over Vienna's rooftops with the spire of St. Stephen's Cathedral",
    alt_de: "Sonnenuntergang über den Dächern Wiens mit dem Turm des Stephansdoms",
    alt_es: "",
    alt_tr: "",
    caption_en: "The Old Town roofline, ten minutes before the lights come on.",
    caption_de: "Die Dächer der Altstadt, zehn Minuten vor dem Einschalten der Lichter.",
    caption_es: "",
    caption_tr: "",
    sort_order: 13,
    published: true,
    created_at: isoStamp(-14),
    updated_at: isoStamp(-2),
  },
  {
    id: "demo-p2",
    slot_key: null,
    category: "landmarks",
    storage_path: null,
    title: "Schönbrunn gates at opening time",
    alt_en: "The dark green vintage electric car outside the gates of Schönbrunn Palace",
    alt_de: "Der dunkelgrüne Oldtimer-Elektrowagen vor den Toren von Schloss Schönbrunn",
    alt_es: "",
    alt_tr: "",
    caption_en: "",
    caption_de: "",
    caption_es: "",
    caption_tr: "",
    sort_order: 30,
    published: false,
    created_at: isoStamp(-5),
    updated_at: isoStamp(-5),
  },
];

export const DEMO_BLOCKED_SLOTS: BlockedSlot[] = [
  {
    id: "demo-b1",
    date: isoDay(7),
    start_time: null,
    end_time: null,
    reason: "Vehicle service",
    created_at: isoStamp(-2),
  },
  {
    id: "demo-b2",
    date: isoDay(12),
    start_time: "09:00",
    end_time: "13:00",
    reason: "Private event",
    created_at: isoStamp(-2),
  },
];
