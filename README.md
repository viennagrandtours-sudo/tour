# Vienna Grand Tours

Marketing + booking website for a small, owner-operated Vienna sightseeing business: private guided
city tours in a dark green vintage-style electric vehicle, narrated in English, German, Spanish and
Turkish.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · next-intl · Supabase · Netlify

## Features

- Locale-prefixed routes: `/en/*`, `/de/*` (full ES/TR message files ready to switch on)
- Homepage, Tours & Pricing, multi-step Booking, About, Gallery, FAQ, 404
- Austrian legal pages: Impressum, AGB, Datenschutz + GDPR cookie banner
- Booking API with Supabase persistence (demo fallback without env vars)
- SumUp **Hosted Checkout** at booking time (`lib/sumup.ts` + `/book/complete`); confirmation-email
  provider is still optional until `EMAIL_*` is set
- SEO: per-page metadata, Open Graph, `sitemap.xml`, `robots.txt`, LocalBusiness + TouristAttraction JSON-LD

## Brand assets

The business was previously called *Golden Wheels Vienna*. `public/logo.png` is the **old** seal and
visibly contains that name, so it is **no longer used anywhere in the UI** — it is left on disk only
as a reference for the designer.

Until a new logo exists, the header and footer render a typographic wordmark:
`components/Wordmark.tsx` sets “Vienna” as a wide-tracked eyebrow above “Grand Tours” in Cormorant
Garamond, closed by a gold hairline with small diamond terminals. It has `light` and `dark` tones and
three sizes.

**To bring an image logo back:**

1. Export a square logo for Vienna Grand Tours (transparent PNG, ≥ 512 × 512) and save it as
   `public/logo.png`, replacing the old seal.
2. Swap `<Wordmark … />` for a `next/image` in `components/Header.tsx` and `components/Footer.tsx`
   (those are the only two call sites). Keep the `aria-label={SITE.name}` on the surrounding link.
3. Re-export `app/favicon.ico` from the new mark — the current favicon still derives from the old seal.
4. Add a 1200 × 630 social image at `public/og.png` and reference it via `openGraph.images` in
   `app/[locale]/layout.tsx`. Until then, `components/JsonLd.tsx` points at a neutral city photograph
   (`/gallery/city-opera-sunrise.png`) rather than the old logo, and no `og:image` is declared.

## Content status

All guest-facing copy is final in **English, German, Spanish, Italian, Arabic, Chinese, Portuguese
and Turkish** (`messages/*.json`). Two
deliberate exceptions remain visible and are labelled as such in the UI:

- **Titled photo slots.** Shots not yet taken render as titled placeholders with a “photo needed”
  label — see `PHOTO_SHOT_LIST.md` and the shot list on the Gallery page. Upload real files from
  `/admin/photos`. Three city photographs already ship in `public/gallery/`.
- **Sample testimonials.** The homepage carousel shows plausible sample quotes labelled “sample
  reviews” until real ones exist. They are marked as samples in `messages/*.json`
  (`testimonials._comment`), in `components/TestimonialCarousel.tsx` and in the seed rows in
  `supabase/schema.sql`. Delete those seed rows before go-live.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — middleware redirects to `/en` or `/de`.

## Environment variables

See `.env.example`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side inserts (optional but preferred) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (sitemap, JSON-LD) |
| `SUMUP_API_KEY` / `SUMUP_MERCHANT_CODE` | Online pay-at-booking (Hosted Checkout) |
| `SUMUP_PAY_TO_EMAIL` | Optional owner reference |
| `NEXT_PUBLIC_SUMUP_PUBLIC_KEY` | Only if you later embed the card widget |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` / `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Analytics after cookie consent |

Without Supabase env vars, bookings still validate and return a **demo** confirmation ID so you can develop locally.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. SQL Editor → run `supabase/schema.sql`
3. Copy URL + anon key (and optionally service role key) into `.env.local`

Tables: `bookings`, `testimonials`, `contact_submissions` (RLS policies included).

## Deploy to Netlify

This project is configured for Netlify via `netlify.toml`:

| Setting | Value |
|---------|--------|
| Build command | `npm run build` |
| Publish directory | `.next` (handled by Essential Next.js plugin) |
| Plugin | `@netlify/plugin-nextjs` (auto-installed on Netlify) |
| Node | 20 (`NODE_VERSION` in `netlify.toml`) |

Locale routes (`/en/*`, `/de/*`) are handled by next-intl middleware — no extra Netlify redirects needed.

### Environment variables (Netlify UI)

Site configuration → Environment variables. Set at least:

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SITE_URL` | Yes — your Netlify URL (e.g. `https://your-site.netlify.app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | For real bookings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For real bookings |
| `SUPABASE_SERVICE_ROLE_KEY` | Recommended (server-only) |
| `SUMUP_*` / `NEXT_PUBLIC_SUMUP_PUBLIC_KEY` | When payment is wired |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` or `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Optional analytics |

Never commit `.env.local` or secrets. See `.env.example` for the full list.

### Option A — Connect GitHub (recommended)

1. Push this repo to GitHub (commit `netlify.toml` if you haven’t already)
2. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
3. Select the repo; Netlify should detect Next.js and use `netlify.toml`
4. Add env vars (above) → **Deploy**

### Option B — Netlify CLI (no git push required)

```bash
npm install -g netlify-cli   # once
netlify login
netlify init                 # or: netlify sites:create
# set env vars in the Netlify UI (or: netlify env:set KEY value)
netlify deploy --build       # draft URL
netlify deploy --build --prod
```

### Option C — Drag-and-drop

Not ideal for App Router (SSR/middleware need the Next.js runtime). Prefer A or B.

## Project structure

```
app/
  [locale]/          # pages (home, tours, book, about, gallery, faq, legal)
  api/                # bookings, confirm-email stub, contact
components/           # Header, Footer, BookingForm, TourCard, …
i18n/                 # next-intl routing + request config
messages/             # en, de, es, it, ar, zh, pt, tr (identical key structure)
lib/                  # tours config, supabase helpers
supabase/schema.sql
```

## Translations

`messages/*.json` (en, de, es, it, ar, zh, pt, tr) all carry the same key structure and complete
copy. Live locales are listed in `i18n/routing.ts` and shown in the header/footer language menu
under their native names. Arabic (`ar`) is right-to-left: `dir="rtl"` is set on `<html>`.

To add another locale:

1. Duplicate `messages/en.json` as `messages/{code}.json` and translate every string
2. Add the code to `locales` in `i18n/routing.ts` and `LOCALE_NATIVE_NAMES`
3. Widen the middleware matcher in `middleware.ts`
4. Add the code to `scripts/check-messages.mjs` and the testimonial locale list in `/admin`

**Gotcha:** next-intl treats `.` as a path separator, so message keys must not contain dots. The
1.5-hour tier is keyed `1_5hr` (mapped by `tourTierKey()` in `lib/tours.ts`).

Run `npm run check:messages` to verify all locales share one key structure and that no placeholder
wording has crept back in.

## Legal fill-ins the owner must complete

The legal pages carry a visible notice that the text is a draft for an Austrian lawyer to review.
Every genuinely unknown value is written as a bracketed placeholder — nothing is invented. Search the
repo for `[` in these locations:

| Fill-in | Where |
|---------|-------|
| `Ahmed Wezza` (filled) | `lib/tours.ts` → `SITE.legal.companyName`; also in AGB § 1 in all `messages/*.json` |
| `Einzelunternehmen (Privatperson / Inhaber)` (filled) | `lib/tours.ts` → `SITE.legal.legalForm` |
| `Ahmed Wezza` (filled) | `lib/tours.ts` → `SITE.legal.owner` |
| `Rüdigergasse 18/5` · `1050 Wien` (filled) | `lib/tours.ts` → `SITE.address` |
| `[Telefonnummer]` | `lib/tours.ts` → `SITE.phone` |
| `[Firmenbuchnummer]` | `lib/tours.ts` → `SITE.legal.firmenbuch` |
| `[Firmenbuchgericht]` | `lib/tours.ts` → `SITE.legal.court` |
| `33978789` (filled) | `lib/tours.ts` → `SITE.legal.gisa` |
| `[UID-Nummer]` | `lib/tours.ts` → `SITE.legal.uid` |
| `Wirtschaftskammer Wien, [Fachgruppe]` | `lib/tours.ts` → `SITE.legal.chamber` |
| `[Bezirk]` (competent Gewerbebehörde) | `legal.impressum.authorityBody` in every `messages/*.json` |
| `[date]` / `[Datum]` / `[fecha]` / `[tarih]` | `legal.lastUpdated` in every `messages/*.json` (new locales keep `[date]`) |
| `[Google-Business-ID]`, `[instagram-handle]`, `[facebook-handle]` | `lib/tours.ts` → `SITE.googleBusinessUrl`, `SITE.social` |

Bracketed contact details are **hidden** in the footer and omitted from JSON-LD (`isFillIn()` in
`lib/tours.ts`), so guests never see them; the legal pages render them on purpose so the gaps stay
obvious. Also confirm the § 108 (3) GewO wording, the FAGG § 18 (1) (10) reference in the AGB, and
the processor list in the privacy policy (Netlify, Supabase, SumUp, email provider) against what you
actually use.

## Founder checklist

- [ ] Complete every bracketed legal fill-in above, then have an Austrian lawyer review Impressum /
      AGB / Datenschutz and remove the draft notice (`legal.reviewNotice`)
- [ ] Export a Vienna Grand Tours logo, favicon and OG image (see **Brand assets**)
- [ ] Real photos — follow `PHOTO_SHOT_LIST.md`; upload each one in `/admin/photos`
- [ ] Lightly personalise the founder story (`about.story1–3`) and vehicle copy in every locale
- [ ] Replace the sample testimonials with real reviews and delete the seed rows in `schema.sql`
- [ ] Google Business Profile URL + social links
- [ ] Supabase project + `schema.sql`
- [x] SumUp Hosted Checkout in `BookingForm` + `app/api/bookings/route.ts` + `/book/complete`
      (set `SUMUP_API_KEY` + `SUMUP_MERCHANT_CODE` to go live)
- [ ] Confirmation email provider in `app/api/confirm-email/route.ts` (copy is written, EN + DE)
- [ ] Analytics ID (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN` or `NEXT_PUBLIC_GA4_MEASUREMENT_ID`)

## Scripts

```bash
npm run dev             # local development
npm run build           # production build
npm run start           # serve production build
npm run lint            # ESLint
npm run check:messages  # locale key parity + placeholder scan
```
