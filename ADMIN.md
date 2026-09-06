# Admin dashboard

Internal, staff-facing dashboard for running the tour business: bookings, availability,
testimonials, the contact inbox, photos, pricing, and business details.

It lives at **`/admin`**, outside the `[locale]` routing segment, so it is never translated,
never crawled, and never mixed up with the public marketing site. All admin copy is inline
English — deliberately **not** in `messages/*.json`.

---

## 1. Getting in

### Create your admin user

There is no sign-up form. You create the account once in Supabase:

1. Open your project at [app.supabase.com](https://app.supabase.com).
2. Go to **Authentication → Users → Add user → Create new user**.
3. Enter your email and a strong password.
4. Tick **Auto Confirm User** so you can sign in immediately without a confirmation email.
5. Go to `https://your-site.example/admin/login` and sign in.

> **Anyone with a Supabase Auth user on this project is an admin.** The site has no public
> sign-up, so the users table only contains people you added by hand. If you ever add
> customer-facing auth, tighten the RLS policies described in section 4 first.

To add a second staff member, repeat the steps above. To remove access, delete the user in
the same screen. To reset a forgotten password, use **Authentication → Users → … → Send
password recovery** (or just set a new password directly).

### How the protection works

Two independent locks:

1. **Middleware** (`middleware.ts`) intercepts every `/admin/*` request, refreshes the
   Supabase session cookie via `@supabase/ssr`, and redirects to `/admin/login?next=…` when
   there is no valid session. If the session lookup fails for any reason — bad URL, paused
   project, network error — it fails **closed** and sends you to the login page.
2. **Server-side check** in `app/admin/(dashboard)/layout.tsx` re-verifies the session on
   every render, and `requireAdmin()` in `lib/admin/guard.ts` re-verifies it inside every
   Server Action. This matters because Server Actions are reachable by direct POST, so
   middleware alone would not be enough.

The route group `app/admin/(dashboard)/` holds everything that requires a session;
`app/admin/login/` sits outside it so the login page itself stays reachable.

Sign out is a Server Action (`signOutAction`) wired to a plain form in the sidebar.

### Demo mode

If `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing — or still hold
the `YOUR_PROJECT` placeholders from `.env.example` — the whole admin area drops into **demo
mode**: it renders with obviously fake data, shows a gold "Demo data" banner on every screen,
disables writes, and skips the login wall. This mirrors the existing demo fallback in
`app/api/bookings/route.ts` so a fresh clone runs without a backend.

---

## 2. Route map

| Route | What it does |
| --- | --- |
| `/admin/login` | Email + password sign-in. Redirects to `/admin` when already signed in. |
| `/admin` | Overview: key numbers, next six tours, 14-day booking chart, status breakdown, upcoming blocks. |
| `/admin/bookings` | Full booking table: filter, search, sort, expand, edit, change status, delete, add manually, export CSV. |
| `/admin/availability` | Block whole days or time ranges, and see exactly what the public booking form will receive. |
| `/admin/messages` | Contact-form inbox: new / read / handled, reply by mail, delete. |
| `/admin/testimonials` | CRUD reviews, publish/feature toggles, reordering, sample-row labelling. |
| `/admin/photos` | Every image slot on the site: upload/replace/remove, per-locale alt and caption, reorder, hide, add extra gallery photos. |
| `/admin/tours` | Read-only view of the code defaults plus editable Supabase price/active overrides. |
| `/admin/settings` | Business info overrides and an environment-variable health check. |
| `GET /api/availability` | **Public.** Blocked dates/slots for the booking form. Optional `?from=&to=`. |
| `POST /api/admin/photos/upload` | **Admin.** JPEG/PNG/WebP upload into the `photos` Storage bucket (max 10 MB). Auth is `requireAdmin()`, same as the Server Actions. |

### A short tour of each screen

**Overview** — Upcoming tours, this week, this month, all time; revenue split into
confirmed/completed versus still-to-be-confirmed (guests × tier price — an estimate, not
accounting); unread message count; the next six tours; a hand-rolled inline SVG bar chart of
bookings per day for the past week and the week ahead. No charting library was added.

**Bookings** — Search by name, email or phone; filter by status and date range; sort by tour
date or by when the booking came in. The row count, guest count and estimated value update
with the filters, and **Export CSV** downloads exactly what is on screen. Expanding a row
shows phone, email, booking id and the full notes, plus Edit and Delete. Status changes
happen inline and apply optimistically, rolling back with an explanation if the write fails.
**Add booking** covers phone and walk-up guests; it accepts 1–8 guests, wider than the 3–6
the public form enforces.

**Availability** — Block a single day, a date range (one submission blocks the whole holiday),
or a time window within a day. A panel at the bottom shows the live JSON that
`GET /api/availability` returns, so you can see exactly what the booking form will hide.

**Inbox** — Contact submissions with a `new` → `read` → `handled` triage flow, a mailto reply
button, and delete behind a confirm step.

**Testimonials** — Add, edit and delete reviews; toggle published and featured; reorder with
the arrow buttons (which rewrite `sort_order` for the whole list, so duplicate or zeroed
values self-heal). Rows created by the seed block in `supabase/schema.sql` are tagged
**Sample row** — delete them once you have real reviews.

**Photos** — Every slot from `lib/photo-shots.ts` is listed whether or not it has been shot,
grouped by where it appears (hero, gallery by category, About, tours map, social). Upload a
JPEG, PNG or WebP (max 10 MB); replace or remove it later; edit the internal shot title and
the guest-facing alt text and caption per language (EN/DE live, ES/TR stored ready). Gallery
photos can be reordered with the arrows or a numeric position, moved between categories, and
hidden without deleting the file. **Add a gallery photo** is for shots that are not on the
planned list. Removing an upload on a planned slot brings back the titled placeholder (or
the city-view image that ships in `public/gallery/`). Binary uploads go through
`POST /api/admin/photos/upload` so a 10 MB file is not stuffed into a Server Action body;
wording, visibility, reorder and delete are Server Actions in `lib/admin/photo-actions.ts`.

**Tours & pricing** — Prices ship in `lib/tours.ts`. Each tier here writes an override row to
`tour_settings`, which wins over the code value, so you can change a price or hide a tier
without a deploy. **Reset to code default** deletes the override row.

**Settings** — Contact email, phone, meeting point and social links, stored as overrides in
`site_settings`. Values still in `[Platzhalter]` form are flagged, because they are visible on
the public site. The Environment panel reports which env vars are set (never their values).

---

## 3. Environment variables

No new secrets. The admin area reuses what the site already has:

| Variable | Needed for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth + all reads. Without it, admin runs in demo mode. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth + all reads. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required in production.** Admin reads and writes use it to bypass RLS. Server-only — never prefix it with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | Sitemap and email links (already used by the public site). |

The service role key is only ever read in `lib/supabase-server.ts` (`createSupabaseAdmin()`)
and in the pre-existing `lib/supabase.ts` (`getSupabaseServer()`), both of which are
server-only modules. It is never imported into a `"use client"` file and never reaches the
browser bundle.

> **Netlify note:** `NEXT_PUBLIC_*` values are inlined at build time, so set them in
> **Site settings → Environment variables** before triggering a deploy. Changing them
> afterwards requires a rebuild, not just a restart.

---

## 4. Database

All SQL lives in **`supabase/schema.sql`**, appended below the original tables under the
`ADMIN DASHBOARD ADDITIONS` heading. Every statement is idempotent, so paste the whole file
into the Supabase SQL editor and run it — existing tables and data are untouched.

### New tables

| Table | Purpose |
| --- | --- |
| `blocked_slots` | Dates and time ranges you are not taking bookings. `id, date, start_time, end_time, reason, created_at`. Both times `null` = the whole day is blocked; otherwise the half-open range `[start_time, end_time)`. |
| `tour_settings` | Per-tier price overrides. `tour_type` (PK), `price_eur`, `active`, `min_guests`, `updated_at`. A missing row means "use the code default". |
| `site_settings` | Business info overrides as key/value, so adding a field later needs no migration. Known keys: `contact_email`, `contact_phone`, `meeting_point_street`, `meeting_point_city`, `meeting_point_country`, `instagram_url`, `facebook_url`, `google_business_url`. |
| `site_photos` | One row per image slot (and extras with `slot_key` null). `storage_path` in the `photos` bucket; `alt_*` / `caption_*` per locale; `title` is internal; `sort_order`, `published`. A missing row, or a row with no file, means the public site keeps the titled placeholder from `lib/photo-shots.ts`. |

### Changes to existing tables

- `bookings.status` — the check constraint now also allows `completed`.
- `bookings.guest_count` — widened from 3–6 to 1–8 so you can record phone and walk-up
  bookings outside the public rule. The public API in `app/api/bookings/route.ts` still
  enforces 3–6 in code, so nothing changes for website visitors.
- `testimonials` — added `featured` (boolean), `sort_order` (integer) and `is_sample`
  (boolean, set to `true` for the three seeded rows).
- `contact_submissions` — added `status` (`new` / `read` / `handled`, default `new`).

### Storage bucket for photos

Uploads go into a **public** Supabase Storage bucket named `photos`. The schema file creates it
and the read/write policies; if your project blocks writes to `storage.buckets` from the SQL
editor, create it by hand:

1. Supabase dashboard → **Storage → New bucket**.
2. Name: `photos`. Turn **Public bucket** on.
3. Re-run the storage policy block at the bottom of `supabase/schema.sql` if the policies
   did not apply.

Files are meant to be public (they are marketing photos served through `next/image`). Nothing
private belongs here. Uploads and deletes only happen on the server with the service role key
(`app/api/admin/photos/upload/route.ts` and `lib/admin/photo-actions.ts`).

JPEG, PNG and WebP only, max 10 MB. Netlify's function request body is typically **6 MB**, so
a very large master may need compressing before upload even though the form allows 10 MB.

The admin screens tolerate a database that has not had these applied yet: missing columns
fall back to sensible defaults, and query errors are shown as a readable message telling you
to re-run the schema file.

### RLS posture

Row Level Security is on for every table. The policies are written out in full in
`supabase/schema.sql`; the intent is:

- **anon** (the public marketing site) may `insert` bookings and contact messages, and
  `select` published testimonials, blocked slots, tour settings, site settings and published
  site photos. Those last four are already displayed on the public pages, so read access
  leaks nothing.
- **authenticated** (your admin login) gets full read/write on everything, including the
  bookings and contact submissions that anon can only write to.
- The admin Server Actions use the **service role key**, which bypasses RLS entirely. The
  policies are the safety net for the case where that key is missing, and the reason the
  admin still works (read-only-ish, subject to policy) without it.

Because "authenticated" means "any Supabase Auth user", do not create Supabase Auth users for
anyone who should not be an admin.

---

## 5. Public-site wiring

All three wirings are applied and live: the public pages read the merged values, so a price
change, a new phone number or a blocked day takes effect without a deploy. Every merge helper
swallows its own errors and falls back to the code defaults, so a Supabase outage degrades to
the hard-coded content rather than a broken page.

### 5a. Merged tour prices

`lib/tour-settings.ts` merges `tour_settings` override rows over the `TOURS` array in
`lib/tours.ts`. `getActiveTours()` is awaited in the two Server Components that show prices:
`app/[locale]/page.tsx` (line ~58, feeding the home-page tour cards) and
`app/[locale]/tours/page.tsx` (line ~30). `components/PricingTable.tsx` does not fetch anything
itself — it takes the resolved tiers as its `tours` prop.

`getActiveTours()` returns the code shape (`id`, `durationMinutes`, `pricePerPerson`,
`minGuests`) plus `active` and `overridden`, and drops the tiers switched off in `/admin/tours`.
`getResolvedTours()` keeps the hidden ones and is what the admin screen itself reads.

The same module exports `calculateResolvedTotal(tourType, guests)`, the merged-price equivalent
of `calculateTotal()`, for whenever the server needs to price a booking itself.

### 5b. Merged business info

`lib/site-settings.ts` merges `site_settings` rows over the `SITE` constant: a stored value
wins, the code default is the fallback. `components/Footer.tsx` calls `getSiteSettings()`
(line ~13) and renders `contact_email`, `contact_phone`, the `meeting_point_*` fields and the
social links from it.

Each of those is gated by `isFillIn()` from `lib/tours.ts`, so a value still in `[Telefonnummer]`
form is hidden rather than printed — guests never see a bracketed placeholder. That is the same
check behind the "still a placeholder" flags on `/admin/settings`.

`SITE.name`, `SITE.wordmark`, `SITE.tagline` and `SITE.legal` are intentionally *not*
overridable — a legal notice should not be editable from a web form.

### 5c. Blocked dates in the booking form

Two layers, and the second one is what actually enforces the block.

**Client.** `components/BookingForm.tsx` fetches `GET /api/availability` once on mount, filters
`TIME_SLOTS` through `isSlotAvailable()`, greys out blocked slots, and moves the selection off a
slot that has since been closed. A failed lookup leaves everything bookable: availability must
never be the reason someone cannot book.

**Server.** `app/api/bookings/route.ts` (line ~68) re-runs the same check before inserting:

```ts
const availability = await getAvailability({ from: date, to: date });
if (!isSlotAvailable(availability, date, time)) {
  return NextResponse.json({ error: "That time is no longer available" }, { status: 409 });
}
```

This is the part that matters. The client-side filter is a courtesy — it can be skipped entirely
by POSTing to the API by hand, and it is already stale in any tab that was open before you
blocked the day. The route check cannot be bypassed, so a blocked slot is genuinely closed.

The pure helpers (`isSlotAvailable`, `EMPTY_AVAILABILITY`, `toAvailabilityPayload`) live in
`lib/availability.ts` so the client component can import them safely. `lib/blocked-slots.ts` is
the server-only half that reads Supabase (`getBlockedSlots()`, `getAvailability()`) and
re-exports the pure ones for server callers.

### 5d. Merged photos

`lib/photos.ts` merges `site_photos` rows over the shot list in `lib/photo-shots.ts`. A row
wins; a missing row (or a row with no `storage_path`) leaves the titled placeholder — or, for
the three city views, the image that already ships in `public/gallery/`. `getSitePhotos(locale)`
is awaited in:

- `app/[locale]/page.tsx` — hero, homepage teasers (v1, l1, g1, c1), Open Graph image
- `app/[locale]/gallery/page.tsx` — the filterable grid, including extra photos the owner added
- `app/[locale]/about/page.tsx` — founder portrait and vehicle detail
- `app/[locale]/tours/page.tsx` — route map

Guest-facing titles and hints still come from `messages/*.json`. Owner-written alt text and
captions overlay those when present. Hidden planned slots fall back to the placeholder;
hidden extra gallery photos drop out of the grid.

Supabase Storage hostnames are allow-listed for `next/image` in `next.config.mjs` from
`NEXT_PUBLIC_SUPABASE_URL`, with a `*.supabase.co` fallback so a clone without a project ref
still builds.

---

## 6. What was and was not touched

**Added:**

- `app/admin/**` — the whole dashboard
- `components/admin/**` — admin-only UI
- `lib/admin/**` — data access, Server Actions, stats, demo data, formatting
- `lib/supabase-server.ts`, `lib/supabase-env.ts` — cookie-bound and service-role clients
- `lib/tour-settings.ts`, `lib/site-settings.ts`, `lib/blocked-slots.ts` — merge helpers
- `lib/availability.ts` — the pure availability helpers, importable from client components
- `app/api/availability/route.ts` — public read of blocked slots
- `ADMIN.md`

**Modified (small, additive):**

- `middleware.ts` — branches `/admin/*` to the Supabase session gate; the public site still
  goes through the unchanged next-intl middleware
- `supabase/schema.sql` — appended below the existing tables
- `.env.example` — appended at the end
- `app/robots.ts` — added `disallow: ["/admin", "/admin/"]`
- `package.json` — added `@supabase/ssr`

`app/sitemap.ts` needed no change: it only enumerates locale-prefixed marketing paths, so
`/admin` was never in it.

**Modified later, when the wirings in section 5 went in:**

- `components/Footer.tsx` — reads `getSiteSettings()`
- `components/BookingForm.tsx` — fetches `/api/availability`, filters slots
- `components/PricingTable.tsx` — takes resolved tiers as a prop instead of importing `TOURS`
- `app/[locale]/page.tsx`, `app/[locale]/tours/page.tsx` — await `getActiveTours()`
- `app/api/bookings/route.ts` — server-side availability check

**Modified later, for owner-managed photos (section 5d):**

- `app/admin/(dashboard)/photos/page.tsx`, `components/admin/PhotosManager.tsx`
- `lib/photos.ts`, `lib/admin/photo-actions.ts`, `app/api/admin/photos/upload/route.ts`
- `app/[locale]/page.tsx`, `gallery/page.tsx`, `about/page.tsx`, `tours/page.tsx` — await `getSitePhotos()`
- `next.config.mjs` — `images.remotePatterns` for Supabase Storage
- `supabase/schema.sql` — `site_photos` table + `photos` bucket
- `middleware.ts` — refreshes the session cookie on `/api/admin/*` (no HTML redirect)

**Deliberately untouched:** `messages/*.json`, `lib/tours.ts`, and
`components/Header.tsx` / `components/Wordmark.tsx`.

---

## 7. Operating notes

- **Delete is permanent.** Every delete sits behind a confirm dialog that spells out what
  goes. For bookings, prefer setting the status to `cancelled` if you might want the record.
- **Revenue figures are estimates.** Guests × the current tier price. They do not know about
  discounts, refunds, or cash taken on the day.
- **The CSV exports the filtered view**, not the whole table — filter first, then export.
- **Blocked dates in the past disappear** from `/admin/availability` automatically, but the
  rows stay in the database. Clear them out occasionally if you like a tidy table.
- **The dashboard is mobile-usable.** The booking table scrolls horizontally on a phone; the
  nav collapses to a scrollable row of pills.
- **Every screen is `force-dynamic`.** Nothing about the admin area is cached or prerendered.
- **Never run `npm run build` while `npm run dev` is running.** Both write to the same `.next`
  directory, so the build deletes chunks the dev server is still serving. The result is a flood
  of `Cannot find module './chunks/vendor-chunks/next.js'` errors that look like a broken
  codebase but are pure cache corruption. Stop the dev server first; delete `.next` if it
  already happened.
