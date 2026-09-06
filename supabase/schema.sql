-- Vienna Grand Tours — Supabase schema
-- Run this in the Supabase SQL editor for your project.

-- Bookings from the multi-step form
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  tour_type text not null check (tour_type in ('bronze', 'silver', 'gold', 'diamond')),
  date date not null,
  time text not null,
  guest_count integer not null check (guest_count >= 3 and guest_count <= 7),
  language text not null check (language in ('en', 'de', 'es', 'it', 'ar', 'zh', 'pt', 'tr')),
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'awaiting_payment', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_date_idx on public.bookings (date);
create index if not exists bookings_email_idx on public.bookings (email);

-- SumUp Hosted Checkout id (online pay-at-booking). Safe to re-run.
alter table public.bookings add column if not exists sumup_checkout_id text;
create index if not exists bookings_sumup_checkout_idx
  on public.bookings (sumup_checkout_id)
  where sumup_checkout_id is not null;

-- Testimonials (homepage carousel)
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  rating integer not null default 5 check (rating >= 1 and rating <= 5),
  quote text not null,
  locale text not null default 'en',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists testimonials_published_idx
  on public.testimonials (published, locale);

-- Contact form submissions (optional future form)
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.bookings enable row level security;
alter table public.testimonials enable row level security;
alter table public.contact_submissions enable row level security;

-- Public can insert bookings (anon key from the booking API / client)
create policy "Allow public insert bookings"
  on public.bookings
  for insert
  to anon, authenticated
  with check (true);

-- Public can read published testimonials only
create policy "Allow public read published testimonials"
  on public.testimonials
  for select
  to anon, authenticated
  using (published = true);

-- Public can insert contact messages
create policy "Allow public insert contact"
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- SAMPLE DATA — NOT REAL REVIEWS
-- ---------------------------------------------------------------------------
-- The rows below are illustrative placeholders so the homepage carousel has
-- something to render during development. They are NOT genuine guest feedback
-- and must be deleted (or set published = false) before go-live:
--
--   delete from public.testimonials where author_name in ('Anna K.', 'James R.', 'Elena M.');
--
-- Replace them with real, attributable reviews you have permission to publish.
-- The same sample quotes live in messages/*.json under `testimonials.items`
-- and are shown with a "sample reviews" label until this table has rows.
insert into public.testimonials (author_name, rating, quote, locale, published)
values
  ('Anna K.', 5, '[SAMPLE] Warm, personal, and the perfect way to see Vienna without rushing.', 'en', true),
  ('James R.', 5, '[SAMPLE] A beautiful car and genuinely good stories in English — like being driven by a local friend.', 'en', true),
  ('Elena M.', 5, '[MUSTER] Wir haben die 1,5-Stunden-Tour gebucht und hätten gern länger gehabt.', 'de', true);


-- ---------------------------------------------------------------------------
-- ADMIN DASHBOARD ADDITIONS
-- Appended for the /admin area. Safe to re-run: every statement is idempotent.
-- ---------------------------------------------------------------------------

-- 1. Bookings: allow a 'completed' status so finished tours can be archived
--    without losing them in the confirmed pile.
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('pending', 'awaiting_payment', 'confirmed', 'completed', 'cancelled'));

--    Guest count: public form and admin both allow 1–7 (one private car).
alter table public.bookings drop constraint if exists bookings_guest_count_check;
alter table public.bookings add constraint bookings_guest_count_check
  check (guest_count >= 3 and guest_count <= 7);

alter table public.bookings drop constraint if exists bookings_tour_type_check;
alter table public.bookings add constraint bookings_tour_type_check
  check (tour_type in ('bronze', 'silver', 'gold', 'diamond'));

alter table public.bookings drop constraint if exists bookings_language_check;
alter table public.bookings add constraint bookings_language_check
  check (language in ('en', 'de', 'es', 'it', 'ar', 'zh', 'pt', 'tr'));

-- 2. Testimonials: ordering, featuring, and a flag for seeded demo rows.
alter table public.testimonials add column if not exists featured boolean not null default false;
alter table public.testimonials add column if not exists sort_order integer not null default 0;
alter table public.testimonials add column if not exists is_sample boolean not null default false;

create index if not exists testimonials_sort_idx
  on public.testimonials (sort_order, created_at desc);

-- Mark the rows seeded at the bottom of this file as samples.
update public.testimonials
  set is_sample = true
  where author_name in ('Anna K.', 'James R.', 'Elena M.');

-- 3. Contact submissions: triage state for the admin inbox.
alter table public.contact_submissions add column if not exists status text not null default 'new';
alter table public.contact_submissions drop constraint if exists contact_submissions_status_check;
alter table public.contact_submissions add constraint contact_submissions_status_check
  check (status in ('new', 'read', 'handled'));

create index if not exists contact_submissions_status_idx
  on public.contact_submissions (status, created_at desc);

-- 4. Blocked dates / time slots. A row with null start_time+end_time blocks the
--    whole day; otherwise it blocks the half-open range [start_time, end_time).
create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time text,
  end_time text,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists blocked_slots_date_idx on public.blocked_slots (date);

-- 5. Tour pricing overrides. Defaults live in lib/tours.ts; a row here wins so
--    the owner can change a price or retire a tier without a code deploy.
create table if not exists public.tour_settings (
  tour_type text primary key
    check (tour_type in ('bronze', 'silver', 'gold', 'diamond')),
  price_eur numeric(10, 2) not null check (price_eur >= 0),
  active boolean not null default true,
  min_guests integer not null default 3 check (min_guests >= 1),
  updated_at timestamptz not null default now()
);

-- 6. Business info overrides (key/value so new fields need no migration).
--    Known keys: contact_email, contact_phone, meeting_point_street,
--    meeting_point_city, meeting_point_country, instagram_url, facebook_url,
--    google_business_url.
create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS for the new tables
--
-- Posture:
--   * anon (public marketing site) may INSERT bookings + contact messages and
--     SELECT published testimonials, blocked slots, tour settings, site
--     settings and published site_photos. Everything in those last four is
--     already visible on the public pages, so read access leaks nothing.
--   * authenticated (the owner's admin login) gets full read/write on
--     everything. Do not create additional Supabase Auth users unless they
--     should be admins.
--   * The admin server actions use the service role key, which bypasses RLS
--     entirely. These policies are the safety net if that key is ever absent.
-- ---------------------------------------------------------------------------

alter table public.blocked_slots enable row level security;
alter table public.tour_settings enable row level security;
alter table public.site_settings enable row level security;

-- Public read of scheduling/pricing/business info
drop policy if exists "Public read blocked slots" on public.blocked_slots;
create policy "Public read blocked slots"
  on public.blocked_slots for select to anon, authenticated using (true);

drop policy if exists "Public read tour settings" on public.tour_settings;
create policy "Public read tour settings"
  on public.tour_settings for select to anon, authenticated using (true);

drop policy if exists "Public read site settings" on public.site_settings;
create policy "Public read site settings"
  on public.site_settings for select to anon, authenticated using (true);

-- Admin (any signed-in Supabase Auth user) full control
drop policy if exists "Admin manage blocked slots" on public.blocked_slots;
create policy "Admin manage blocked slots"
  on public.blocked_slots for all to authenticated using (true) with check (true);

drop policy if exists "Admin manage tour settings" on public.tour_settings;
create policy "Admin manage tour settings"
  on public.tour_settings for all to authenticated using (true) with check (true);

drop policy if exists "Admin manage site settings" on public.site_settings;
create policy "Admin manage site settings"
  on public.site_settings for all to authenticated using (true) with check (true);

drop policy if exists "Admin manage bookings" on public.bookings;
create policy "Admin manage bookings"
  on public.bookings for all to authenticated using (true) with check (true);

drop policy if exists "Admin manage testimonials" on public.testimonials;
create policy "Admin manage testimonials"
  on public.testimonials for all to authenticated using (true) with check (true);

drop policy if exists "Admin manage contact submissions" on public.contact_submissions;
create policy "Admin manage contact submissions"
  on public.contact_submissions for all to authenticated using (true) with check (true);

-- 7. Seed tour_settings from the current lib/tours.ts defaults (optional — the
--    admin UI treats missing rows as "using the code default").
-- If an earlier schema seeded 30min/1hr ids, drop them and retighten the check.
delete from public.tour_settings
  where tour_type not in ('bronze', 'silver', 'gold', 'diamond');
alter table public.tour_settings drop constraint if exists tour_settings_tour_type_check;
alter table public.tour_settings add constraint tour_settings_tour_type_check
  check (tour_type in ('bronze', 'silver', 'gold', 'diamond'));

insert into public.tour_settings (tour_type, price_eur, active, min_guests)
values
  ('bronze', 25, true, 3),
  ('silver', 39, true, 3),
  ('gold', 49, true, 3),
  ('diamond', 69, true, 3)
on conflict (tour_type) do nothing;


-- ---------------------------------------------------------------------------
-- PHOTO LIBRARY (/admin/photos)
-- Appended for owner-managed photography. Safe to re-run.
-- ---------------------------------------------------------------------------

-- 8. Photos for every image slot on the site, plus free-form gallery additions.
--
--    Defaults live in lib/photo-shots.ts. A row here wins, exactly like
--    tour_settings and site_settings: no row (or no storage_path) means the
--    public site keeps rendering the titled placeholder from the code.
--
--    slot_key  — matches a slot in lib/photos.ts (hero, v1…c3, about-founder,
--                about-detail, tours-map, og-social). NULL for extra gallery
--                photos the owner adds beyond the planned shot list.
--    category  — which gallery filter the photo belongs to; 'site' is for the
--                slots that are not part of the gallery grid.
--    alt_*     — guest-facing accessible description, one column per locale.
--    caption_* — optional guest-facing caption line, one column per locale.
--    title     — internal shoot title (admin + shoot brief only, never shown
--                to guests, so it is deliberately single-language).
create table if not exists public.site_photos (
  id uuid primary key default gen_random_uuid(),
  slot_key text,
  category text not null default 'site'
    check (category in ('vehicle', 'landmarks', 'guests', 'city', 'site')),
  storage_path text,
  title text,
  alt_en text,
  alt_de text,
  alt_es text,
  alt_tr text,
  caption_en text,
  caption_de text,
  caption_es text,
  caption_tr text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Column adds so a table created by an earlier partial run of this file still
-- picks up later fields. create table if not exists above will not alter it.
alter table public.site_photos add column if not exists slot_key text;
alter table public.site_photos add column if not exists category text not null default 'site';
alter table public.site_photos add column if not exists storage_path text;
alter table public.site_photos add column if not exists title text;
alter table public.site_photos add column if not exists alt_en text;
alter table public.site_photos add column if not exists alt_de text;
alter table public.site_photos add column if not exists alt_es text;
alter table public.site_photos add column if not exists alt_tr text;
alter table public.site_photos add column if not exists caption_en text;
alter table public.site_photos add column if not exists caption_de text;
alter table public.site_photos add column if not exists caption_es text;
alter table public.site_photos add column if not exists caption_tr text;
alter table public.site_photos add column if not exists sort_order integer not null default 0;
alter table public.site_photos add column if not exists published boolean not null default true;
alter table public.site_photos add column if not exists created_at timestamptz not null default now();
alter table public.site_photos add column if not exists updated_at timestamptz not null default now();

alter table public.site_photos drop constraint if exists site_photos_category_check;
alter table public.site_photos add constraint site_photos_category_check
  check (category in ('vehicle', 'landmarks', 'guests', 'city', 'site'));

-- One row per predefined slot. Postgres treats NULLs as distinct, so the extra
-- gallery photos (slot_key null) are unlimited. Drop-then-add keeps this
-- idempotent for a table created by an earlier run of this file.
alter table public.site_photos drop constraint if exists site_photos_slot_key_key;
alter table public.site_photos add constraint site_photos_slot_key_key unique (slot_key);

create index if not exists site_photos_category_idx
  on public.site_photos (category, sort_order, created_at);

alter table public.site_photos enable row level security;

-- Public site reads published rows only; unpublished rows fall back to the
-- titled placeholder in the code.
drop policy if exists "Public read published site photos" on public.site_photos;
create policy "Public read published site photos"
  on public.site_photos for select to anon, authenticated using (published = true);

drop policy if exists "Admin manage site photos" on public.site_photos;
create policy "Admin manage site photos"
  on public.site_photos for all to authenticated using (true) with check (true);

-- 9. Storage bucket for the uploaded files.
--
--    The bucket is PUBLIC on purpose: these are marketing photos served through
--    next/image, so the URLs are meant to be shared. Nothing private goes here.
--    Uploads and deletes only ever happen server-side with the service role key
--    (app/api/admin/photos/upload/route.ts and lib/admin/photo-actions.ts).
--
--    If your Supabase project blocks direct writes to storage.* from the SQL
--    editor, create the bucket in the dashboard instead:
--      Storage → New bucket → name: photos → Public bucket: on.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

-- Anyone may read the files (needed for next/image and social previews).
drop policy if exists "Public read photos bucket" on storage.objects;
create policy "Public read photos bucket"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'photos');

-- Signed-in admins may upload/replace/delete. The service role bypasses RLS,
-- so this is the safety net for a deployment without the service role key.
drop policy if exists "Admin write photos bucket" on storage.objects;
create policy "Admin write photos bucket"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos');

drop policy if exists "Admin update photos bucket" on storage.objects;
create policy "Admin update photos bucket"
  on storage.objects for update to authenticated
  using (bucket_id = 'photos') with check (bucket_id = 'photos');

drop policy if exists "Admin delete photos bucket" on storage.objects;
create policy "Admin delete photos bucket"
  on storage.objects for delete to authenticated
  using (bucket_id = 'photos');
