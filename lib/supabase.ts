import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type BookingStatus =
  | "pending"
  | "awaiting_payment"
  | "confirmed"
  | "cancelled";

export type Booking = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  tour_type: string;
  date: string;
  time: string;
  guest_count: number;
  language: string;
  notes?: string | null;
  status: BookingStatus;
  /** SumUp Hosted Checkout id (optional column — see schema.sql). */
  sumup_checkout_id?: string | null;
  created_at?: string;
};

export type Testimonial = {
  id: string;
  author_name: string;
  rating: number;
  quote: string;
  locale: string;
  published: boolean;
  created_at?: string;
};

export type ContactSubmission = {
  id?: string;
  name: string;
  email: string;
  message: string;
  created_at?: string;
};

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  if (!browserClient) {
    browserClient = createClient(url, key);
  }
  return browserClient;
}

export function getSupabaseServer(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
}
