import type { TourType } from "@/lib/tours";

export const BOOKING_STATUSES = [
  "pending",
  "awaiting_payment",
  "confirmed",
  "completed",
  "cancelled",
] as const;

export type AdminBookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<AdminBookingStatus, string> = {
  pending: "Pending",
  awaiting_payment: "Awaiting payment",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export type AdminBooking = {
  id: string;
  name: string;
  email: string;
  phone: string;
  tour_type: string;
  date: string;
  time: string;
  guest_count: number;
  language: string;
  notes: string | null;
  status: AdminBookingStatus;
  created_at: string;
};

export type AdminTestimonial = {
  id: string;
  author_name: string;
  rating: number;
  quote: string;
  locale: string;
  published: boolean;
  featured: boolean;
  sort_order: number;
  is_sample: boolean;
  created_at: string;
};

export const MESSAGE_STATUSES = ["new", "read", "handled"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export type AdminMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: MessageStatus;
  created_at: string;
};

export type BlockedSlot = {
  id: string;
  date: string;
  /** null start+end means the whole day is blocked */
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
};

export type TourSettingRow = {
  tour_type: TourType;
  price_eur: number;
  active: boolean;
  min_guests: number;
  updated_at: string;
};

export type SiteSettingRow = {
  key: string;
  value: string | null;
  updated_at: string;
};

/**
 * One row of public.site_photos. `slot_key` is null for extra gallery photos
 * the owner added beyond the planned shot list; a null `storage_path` means the
 * row only carries text and the public site still shows the placeholder.
 */
export type SitePhotoRow = {
  id: string;
  slot_key: string | null;
  category: string;
  storage_path: string | null;
  title: string | null;
  alt_en: string | null;
  alt_de: string | null;
  alt_es: string | null;
  alt_tr: string | null;
  caption_en: string | null;
  caption_de: string | null;
  caption_es: string | null;
  caption_tr: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Every read path returns this so pages can tell the owner whether they are
 * looking at live data, seeded demo data, or a failed query.
 */
export type DataSource = "live" | "demo";

export type AdminResult<T> = {
  data: T;
  source: DataSource;
  error: string | null;
};

export type ActionResult = {
  ok: boolean;
  message: string;
};
