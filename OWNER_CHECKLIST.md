# Owner checklist — everything you personally have to provide before go-live

This is the complete list of things **only you** can supply: accounts, numbers, decisions, photos,
and words. It was written by reading the actual code, not from memory, so every item names the exact
file or screen it belongs in.

## How to read this

- **Blocker** = the site is broken, or you are legally/commercially exposed, if this is missing.
- **Required by law in Austria before you take a single booking** = marked 🔴 **LEGAL**.
- **Deferrable** = launch without it, add it later.
- **You can do it yourself** = there is a screen in your admin dashboard at `/admin`.
- **Needs a code edit** = someone has to change a file and re-publish the site. Group these together
  and hand them over in one go; each redeploy takes a few minutes.

Two bits of jargon you will meet:

- **Environment variable** ("env var"): a named secret or setting stored *outside* the code — for
  example your database password. Locally they live in a file called `.env.local`; on the live site
  they are typed into Netlify's web interface under **Site configuration → Environment variables**.
  Anything whose name starts with `NEXT_PUBLIC_` is visible to visitors' browsers; anything without
  that prefix stays private on the server.
- **Deploy / redeploy**: publishing a new version of the site. Netlify does it automatically when the
  code changes. Important: env vars starting with `NEXT_PUBLIC_` are baked in *at build time*, so
  changing one requires a redeploy, not just a save.

**Current state, verified:** your local `.env.local` still contains the example placeholder values,
so nothing is connected to a real database yet. The site currently runs in "demo mode": bookings
validate and return a fake reference number but are not stored anywhere.

---

## Part 1 — Blockers: without these the site does not really work

### 1.1 Domain name and email address

- [ ] **Buy/confirm the domain.** The code assumes `viennagrandtours.at` in several places
      (`lib/tours.ts` → `SITE_URL` fallback and `SITE.email`, `.env.example` → analytics domain and
      example email addresses). If you register a *different* domain, those have to be changed in
      code. Buy from any Austrian registrar (e.g. world4you, easyname, Hostinger).
- [ ] **Create the mailbox `hello@viennagrandtours.at`** (or whatever address you want). This exact
      address is hard-coded as `SITE.email` in `lib/tours.ts` and appears in the Impressum, the
      privacy policy and the confirmation email template. It must be a real, monitored inbox — the
      AGB tell guests they can cancel by writing to it. *Needs a code edit if you use a different
      address in the Impressum;* the footer address alone can be overridden in `/admin/settings`.
- [ ] **Decide the phone number you are willing to publish.** See 2.2 — a phone number is legally
      required in the Impressum.

### 1.2 Supabase — the database behind bookings and the admin dashboard

Supabase is the free/cheap hosted database that stores your bookings, messages, testimonials, prices
and blocked dates. Without it the booking form saves nothing.

- [ ] **Create a Supabase project** at [supabase.com](https://supabase.com). Choose an **EU region**
      (Frankfurt) — your privacy policy states the booking database is hosted in the EU, so this is
      not a free choice.
- [ ] **Run the database setup script.** In Supabase: **SQL Editor → New query**, paste the entire
      contents of `supabase/schema.sql`, run it. It is safe to run more than once. It creates the
      tables `bookings`, `testimonials`, `contact_submissions`, `blocked_slots`, `tour_settings`,
      `site_settings` and `site_photos`, plus a public Storage bucket named `photos`.
- [ ] **Copy three keys** from Supabase **Project Settings → API** and keep them somewhere safe:
      the Project URL, the `anon` public key, and the `service_role` secret key.
- [ ] **Never publish the `service_role` key.** It bypasses all security rules. It goes into an env
      var called `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix, ever). *Note: `README.md`
      calls this key "optional but preferred" — that is out of date. `ADMIN.md` and the code are
      right: it is **required in production**, because your admin dashboard uses it for every save.*
- [ ] **Delete the three sample testimonials.** `supabase/schema.sql` inserts three invented reviews
      ("Anna K.", "James R.", "Elena M.") so the homepage has something to show during development.
      They are labelled `[SAMPLE]` / `[MUSTER]`. Delete them in `/admin/testimonials` (they are tagged
      **Sample row**), or run in the SQL editor:
      `delete from public.testimonials where author_name in ('Anna K.', 'James R.', 'Elena M.');`
      Publishing invented reviews as if they were real is misleading advertising — see also 3.3.
- [ ] **Create your admin login.** Supabase → **Authentication → Users → Add user → Create new
      user**. Use your email and a strong password and tick **Auto Confirm User**. Then sign in at
      `yourdomain.at/admin/login`. There is no sign-up form; this is the only way an account is made.
- [ ] **Understand the access rule:** *anyone* with a Supabase Auth user on this project is a full
      admin. Only create accounts for people who should see every booking.

### 1.3 Netlify — where the website is published

- [ ] **Create the Netlify site** (connect the code repository, or use the Netlify CLI). Build
      settings come from `netlify.toml` automatically.
- [ ] **Add the env vars in Netlify** under **Site configuration → Environment variables**. The full
      list is in Part 6. At minimum: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] **Set `NEXT_PUBLIC_SITE_URL` to your real address**, e.g. `https://viennagrandtours.at`, with
      no trailing slash. This one value drives your sitemap, your `robots.txt`, and the business data
      Google reads. If it is wrong or missing, the code falls back to `https://viennagrandtours.at`
      and search engines get sent to a domain you may not own.
- [ ] **Connect the custom domain** in Netlify → **Domain management**, and point your registrar's
      DNS at Netlify. HTTPS is issued automatically.
- [ ] **Redeploy after changing any `NEXT_PUBLIC_…` variable.** Saving it is not enough.

### 1.4 Payment — SumUp Online Checkout (pay at booking)

The booking flow creates the booking as `awaiting_payment`, opens SumUp **Hosted Checkout**,
then confirms the booking when SumUp reports `PAID` (`/book/complete` + `/api/sumup/webhook`).

- [ ] **Open / verify your SumUp merchant account** at [sumup.com](https://sumup.com).
- [ ] **Set env vars** in Netlify (and `.env.local`): `SUMUP_API_KEY`, `SUMUP_MERCHANT_CODE`.
      Optional: `SUMUP_PAY_TO_EMAIL` (your login email, reference only).
- [ ] **Run the schema snippet** in Supabase SQL editor that adds `sumup_checkout_id`
      (see `supabase/schema.sql`).
- [ ] **Set `NEXT_PUBLIC_SITE_URL`** to your live HTTPS origin so SumUp redirect/return URLs work.
- [ ] **Test a real € checkout** on staging, then refund it in the SumUp dashboard.
- [ ] **Refunds:** AGB § 5 / § 7 — issue refunds by hand in SumUp until automation exists.

Until `SUMUP_*` is set, bookings are saved as `awaiting_payment` and the guest sees an honest
“payment pending / held” screen (no fake checkout URL).

### 1.5 Confirmation email — no email is sent today

`app/api/confirm-email/route.ts` contains the finished email text in English and German, but there is
no email provider connected, so **nothing is actually sent**. The success screen tells the guest "a
confirmation is on its way to your inbox". Until this is wired, that is not true.

- [ ] **Choose an email provider.** [Resend](https://resend.com) is the easiest (free tier ~3,000
      emails/month, the code comments are written for it); Postmark or Brevo also work. You will need
      to verify your domain with them by adding two or three DNS records at your registrar.
- [ ] **Get the API key**, and decide the "from" address (e.g. `bookings@viennagrandtours.at`). These
      become the env vars `EMAIL_API_KEY` and `EMAIL_FROM` (both are commented out in `.env.example`
      — uncomment them).
- [ ] **Have the provider call added** in `app/api/confirm-email/route.ts` — the example code is
      already written in the comment block above the `POST` function. *Needs a code edit.*
- [ ] **Interim plan if you launch without it:** watch `/admin/bookings`, and reply to each new
      booking by hand from your own mailbox. Set an expectation you can keep.
- [ ] **Add the meeting point to the email.** The template says "the meeting point and exact
      departure time are below" but no address is inserted. Whoever wires the provider must add it,
      or the guest gets a promise with nothing after it. *Needs a code edit.*

---

## Part 2 — 🔴 Legally required in Austria before taking bookings

The three legal pages (`/impressum`, `/agb`, `/datenschutz`) are written and complete in structure,
but they carry a visible banner reading *"Draft text. Before this site goes live, an Austrian lawyer
must review this page and every bracketed field must be completed."* Every unknown value is written
as a placeholder in square brackets — nothing was invented.

### 2.1 Get a lawyer to read it

- [ ] 🔴 **Have an Austrian lawyer (or the WKO Wien legal service, included in your chamber
      membership) review Impressum, AGB and Datenschutz.** Ask specifically about: the § 108 (3) GewO
      wording in the Impressum, the § 18 (1) (10) FAGG statement in AGB § 5 (the "no 14-day
      withdrawal right for date-bound leisure services" claim), the liability caps in AGB § 10, and
      whether the processor list in the privacy policy matches what you actually use.
- [ ] 🔴 **Remove the draft banner afterwards** — key `legal.reviewNotice` in all four
      `messages/*.json` files. *Needs a code edit.* Leaving it up tells every visitor your terms are
      not final.
- [ ] 🔴 **Set the "last updated" date** — key `legal.lastUpdated` in all four `messages/*.json`
      files. Currently `[date]` / `[Datum]` / `[fecha]` / `[tarih]`. *Needs a code edit.*

### 2.2 The business facts — all in `lib/tours.ts` (🔴 all needed for the Impressum)

Every one of these is currently a bracketed placeholder in `lib/tours.ts`. They are printed on the
Impressum page on purpose, so the gaps stay obvious; the site *hides* them from the footer and from
the data Google reads, so guests never see a stray `[Telefonnummer]`. **All of these need a code
edit** — the legal pages deliberately do not read from the admin dashboard, because a legal notice
should not be editable from a web form.

- [x] ✅ `Ahmed Wezza` — Firmenwortlaut / registered name (`SITE.legal.companyName`). Also filled in
      **AGB § 1** in all `messages/*.json` files.
- [x] ✅ `Einzelunternehmen (Privatperson / Inhaber)` — legal form (`SITE.legal.legalForm`).
- [x] ✅ `Ahmed Wezza` — owner / content-responsible person (`SITE.legal.owner`).
- [x] ✅ `Rüdigergasse 18/5` · `1050 Wien` — business address (`SITE.address`).
- [ ] 🔴 `[Telefonnummer]` — a contact phone number in international format, e.g. `+43 1 234 5678`
      (`SITE.phone`). Legally required as a direct means of contact.
- [ ] 🔴 `[Firmenbuchnummer]` — company register number, e.g. `FN 123456a` (`SITE.legal.firmenbuch`).
      **Only if you are registered in the Firmenbuch** (e.U., GmbH). A plain Einzelunternehmen is
      not, in which case the whole "Register" block should be removed rather than left bracketed —
      ask your lawyer.
- [ ] 🔴 `[Firmenbuchgericht]` — the register court, for Vienna usually
      *Handelsgericht Wien* (`SITE.legal.court`). Same caveat as above.
- [x] ✅ `33978789` — GISA number filled in `SITE.legal.gisa` (issued with Gewerbeanmeldung;
      searchable at [gisa.gv.at](https://www.gisa.gv.at)).
- [ ] 🔴 `[UID-Nummer]` — your VAT ID, e.g. `ATU12345678`, issued by the Finanzamt
      (`SITE.legal.uid`). If you are a small business below the VAT threshold
      (*Kleinunternehmer*) you may not have one — then the VAT block must be replaced with the
      Kleinunternehmer note, **and** the AGB claim that prices "include Austrian value added tax"
      must be corrected. Ask your tax adviser; do not leave this bracketed.
- [ ] 🔴 `Wirtschaftskammer Wien, [Fachgruppe]` — your WKO chamber and the specialist group your
      trade falls under (`SITE.legal.chamber`). WKO Wien will tell you which one; it depends on how
      your tour service is licensed.
- [ ] 🔴 `[Bezirk]` — the Vienna district whose Magistratisches Bezirksamt is your trade authority.
      Key `legal.impressum.authorityBody` in all four `messages/*.json` files. It is the district of
      your business address.

### 2.3 Things the legal text already promises that you must actually have

The AGB and privacy policy make factual claims about your business. If any of these is not true, fix
the business or fix the text.

- [ ] 🔴 **A valid trade licence (Gewerbeberechtigung)** for carrying paying passengers on sightseeing
      tours. Which licence applies (and whether a *Konzession* is needed) depends on the vehicle and
      the service — confirm with WKO Wien before selling a single ticket. The site's Impressum
      structure assumes you have a GISA registration.
- [ ] 🔴 **Commercial passenger transport insurance.** AGB § 10 states *"The vehicle is insured as
      required by Austrian law."* Private car insurance does not cover paying passengers.
- [ ] 🔴 **Child seats.** The FAQ and AGB § 8 promise a suitable child seat for children under 135 cm
      or 14 years when notified 24 hours ahead. Buy them, or change the copy.
- [ ] 🔴 **Weather covers on the vehicle.** Several places promise the side covers go up "in about a
      minute" and that you drive in light rain.
- [ ] 🔴 **A written photo-consent process.** The privacy policy and AGB § 11 state that guest
      photographs are published only with express consent, withdrawable at any time. Before you post
      any picture with a recognisable face, get that consent in writing and keep it.
- [ ] 🔴 **Seven-year record retention.** The privacy policy commits you to keeping booking and
      invoicing data for seven years (§ 132 BAO, § 212 UGB) and deleting enquiries after twelve
      months. Nothing in the software deletes anything — this is a manual process you own.
- [ ] 🔴 **A data processing agreement (Art. 28 GDPR) with each provider you actually use.** The
      policy names Netlify, Supabase, SumUp and "our email provider". All of them publish a standard
      DPA you accept in their dashboard. If you skip SumUp or use a different email provider, that
      list must be edited in `messages/*.json` → `legal.datenschutz` section 6. *Needs a code edit.*
- [ ] **Check the cookie banner still matches reality.** It is correct today: analytics load only
      after the visitor clicks "Accept analytics" (`components/CookieConsent.tsx`), and nothing loads
      at all while the analytics env vars are empty. If anyone later adds a tracking pixel — Meta,
      Google Ads — outside that consent gate, you are in breach.

### 2.4 Prices in the terms must match prices on the site

- [ ] 🔴 **If you change a price, change it in three places.** You can change prices yourself in
      `/admin/tours` and the tour cards and booking form update immediately — but **AGB § 4
      hard-codes "30 minutes €25, 1 hour €39, 1.5 hours €69, 2 hours €79"** in all four
      `messages/*.json` files, and the search-engine descriptions say "From €25". Those are code
      edits. Terms that contradict your prices are a consumer-law problem, so treat a price change as
      a small code task, not a self-service one.

---

## Part 3 — Content that is yours to write and shoot

### 3.1 Photographs

> **Update:** you can now upload, replace, hide and re-word every photograph yourself in
> `/admin/photos` — no code edit. The `photos` Storage bucket and `site_photos` table are created
> when you run `supabase/schema.sql` (see `ADMIN.md` if an upload says the bucket is missing).
> The shot list below is still the brief for what to capture.

Three real photographs are already in place and wired: **Stephansdom rooftops at sunset**, **Rathaus
and Parliament at blue hour**, and **Staatsoper at sunrise** (in `public/gallery/`). Nothing more is
needed for those.

**Sixteen slots are still empty.** They currently render as elegant titled placeholders with a
"photo needed" label — visible to visitors, and there is also a live shot list on your Gallery page.
Each slot is listed in `lib/photo-shots.ts` and on `/admin/photos`. Upload the file there; the
titled placeholder stays until you do. Full shooting notes, locations and lighting hints are in
`PHOTO_SHOT_LIST.md`.

Priority order — the first three are the most visible on the site:

- [ ] **v1 — Vehicle at Ringstrasse, three-quarter front.** This is your **homepage hero**, the first
      thing every visitor sees. Golden hour, dark green bodywork clearly readable.
- [ ] **l1 — Staatsoper with the vehicle in frame.** Gallery and homepage teaser.
- [ ] **about-founder — You with the car.** The About page story section.
- [ ] v2 — Side profile, full length
- [ ] v3 — Front detail: grille, lights, badge
- [ ] v4 — Interior seating, guest perspective
- [ ] v5 — Night / golden-hour parked glow
- [ ] l2 — Hofburg backdrop, evening
- [ ] l3 — Ringstrasse cruise, open avenue
- [ ] l4 — St. Stephen's Cathedral area
- [ ] g1 — Guest boarding *(needs written consent)*
- [ ] g2 — Smiling passengers onboard *(needs written consent)*
- [ ] g3 — Guide narrating *(needs written consent)*
- [ ] about-detail — Vehicle spotlight, polished detail
- [ ] tours-map — Route map of the Ringstrasse / Old Town loop (a designed graphic, not a photo)
- [ ] og-social — A 1200 × 630 crop for social sharing (see 4.3)

### 3.2 Your founder story

- [ ] **Rewrite the founder story in your own words.** The About page currently carries an *invented*
      three-paragraph story — it says you grew up a few tram stops from the Ring, worked in another
      industry, found the car and had it finished in forest green. It reads well, but it is fiction
      written as a placeholder, and it is written in the first person as if it were you. Keys
      `about.story1`, `about.story2`, `about.story3` in `messages/en.json` and `de.json` (and
      `es.json` / `tr.json` if you ever switch those on). *Needs a code edit.*
- [ ] **Check the vehicle description matches your actual car** — `about.vehicle1`, `about.vehicle2`
      and the six bullet points in `about.vehicleSpecs`: fully electric, seats up to six plus guide,
      open sides with weather covers, deep forest green, room for day bags and a folded pram, charged
      overnight. Every one of those is a claim a guest can hold you to.

### 3.3 Testimonials

- [ ] **Collect real reviews.** The homepage currently shows three invented quotes, honestly labelled
      *"Sample reviews shown while we collect the first real ones."* Ask your first guests for a
      sentence and permission to publish it with their first name and last initial.
- [ ] **Add them in `/admin/testimonials`** — you can do this yourself, no code edit. Publish,
      feature and reorder from that screen.
- [ ] **Delete the three sample rows** (see 1.2) and, once you have real reviews, have the fallback
      samples removed from `messages/*.json` → `testimonials.items` so they can never reappear.
      *Needs a code edit.*

### 3.4 Business details you can set yourself in `/admin/settings`

These update the **footer** of the public site without any code change. Note the important limit
below.

- [ ] Contact email
- [ ] Contact phone (international format)
- [ ] Meeting point — street, postcode & city, country
- [ ] Instagram URL, Facebook URL
- [ ] Google Business Profile URL

> ⚠️ **Important limit:** these overrides feed the **footer only**. The **Impressum and privacy
> policy read the values in `lib/tours.ts` directly**, so filling in your phone number in
> `/admin/settings` will *not* fix `[Telefonnummer]` on the Impressum page. The legal pages always
> need a code edit. Do both.

### 3.5 Meeting point

- [ ] **Decide and write down the exact meeting point.** The site says only "Meeting point on the
      Ringstrasse, Vienna — the exact pin arrives with your booking confirmation." Since the
      confirmation email is not wired yet (1.5), nobody currently receives that pin. Set it in
      `/admin/settings` and make sure whatever you send by hand includes it.

---

## Part 4 — Brand, analytics and the deferrable rest

### 4.1 Logo and favicon

- [ ] **Commission a Vienna Grand Tours logo.** The business was previously called *Golden Wheels
      Vienna*. The old seal is still on disk at `public/logo.png` and visibly reads "GOLDEN WHEELS
      VIENNA" — it is **not shown anywhere on the site**; the header and footer use a typographic
      wordmark instead, which looks deliberate and fine. Export a square transparent PNG of at least
      512 × 512 px.
- [ ] **Replace the favicon.** `app/favicon.ico` — the little icon in the browser tab — is still
      derived from the old *Golden Wheels* seal. This one is visible to every visitor. *Needs a code
      edit.*
- [ ] **Switch the header and footer to the image logo** if you want one — `components/Header.tsx`
      and `components/Footer.tsx` are the only two places. *Needs a code edit; optional, the wordmark
      is a legitimate final choice.*

### 4.2 Google Business Profile and social accounts

- [ ] **Create a Google Business Profile** (free, at business.google.com). It is the single biggest
      source of walk-up bookings for a local tour business, and it is where guests will leave the
      reviews you need for 3.3. Paste the resulting link into `/admin/settings` → Google Business
      Profile URL — **no code edit needed**. Until you do, that footer link stays hidden.
- [ ] **Create the Instagram and Facebook accounts** and paste the URLs into `/admin/settings`. The
      social icons in the footer stay hidden until then. No code edit needed.

### 4.3 Social sharing image

- [ ] **Provide a 1200 × 630 px sharing image** (shot `og-social`) and have it saved as
      `public/og.png` and referenced in the page metadata. Right now, when someone pastes your link
      into WhatsApp or Facebook, there is **no preview image at all**. *Needs a code edit.* Note that
      `README.md` says to add it to `app/[locale]/layout.tsx`, but that file has no metadata block —
      the Open Graph settings actually live in `app/[locale]/page.tsx`, `tours/page.tsx` and
      `book/page.tsx`, and no `metadataBase` is set. Mention this to whoever does the edit.

### 4.4 Analytics — optional, decide deliberately

Nothing is tracked today. The banner already asks for consent and no script loads until a visitor
clicks "Accept analytics", so you are compliant either way.

- [ ] **Pick one, or none.**
      **Plausible** (~€9/month, EU-hosted, no personal data, and the friendliest option for your
      privacy policy) → set the env var `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to your domain.
      **Google Analytics 4** (free, but a US transfer and a heavier GDPR story) → set
      `NEXT_PUBLIC_GA4_MEASUREMENT_ID` to your `G-XXXXXXXXXX` ID.
      Set it in Netlify → Environment variables and redeploy. No code edit is needed — the loader in
      `components/CookieConsent.tsx` already handles both.
- [ ] **Beware the example value.** `.env.example` ships `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=viennagrandtours.at`.
      If you copy that file as-is onto the live site, the site tries to load Plausible for a domain
      you may not have an account for. Leave it blank if you are not using Plausible.
- [ ] **If you add analytics, say so in the privacy policy.** Section 5 currently describes analytics
      generically; naming the tool you chose is better practice. *Needs a code edit.*

### 4.5 Spanish and Turkish — a free win you may not know you have

- [ ] **Decide whether to publish the Spanish and Turkish versions of the site.** Complete,
      professional translations of every page already exist in `messages/es.json` and
      `messages/tr.json` — they are simply switched off. Turning them on is a three-line code change
      (`i18n/routing.ts`, `middleware.ts`, `components/LanguageSwitcher.tsx`), *but* it also means the
      legal pages exist in Spanish and Turkish, so the fill-ins in 2.1–2.2 must be completed in those
      two files as well. Your marketing already promises narration in four languages, so this is worth
      doing.

### 4.6 A contact form that does not exist yet

- [ ] **Decide whether you want a contact form.** Your admin dashboard has a **Messages** inbox
      screen and the backend for it is written (`app/api/contact/route.ts`), but **no contact form is
      shown anywhere on the public site**, so that inbox will always be empty. Guests can only reach
      you by email or phone. Either accept that, or ask for a small form to be added on the FAQ or
      About page. *Needs a code edit.*

---

## Part 5 — What you can change yourself vs. what needs a developer

| Thing | Where | You, in `/admin` | Code edit |
| --- | --- | --- | --- |
| Tour prices, min guests, hide a tour tier | `/admin/tours` | ✅ | — |
| Prices as written in the AGB and SEO text | `messages/*.json` | — | ⚠️ yes, and it must match the above |
| Contact email, phone, meeting point, social links **in the footer** | `/admin/settings` | ✅ | — |
| The same details **in the Impressum / privacy policy** | `lib/tours.ts` | — | ⚠️ yes |
| Days and time slots you are not available | `/admin/availability` | ✅ | — |
| Testimonials: add, edit, publish, feature, reorder | `/admin/testimonials` | ✅ | — |
| Bookings: view, edit, change status, add by phone, export CSV | `/admin/bookings` | ✅ | — |
| Contact messages triage | `/admin/messages` | ✅ | — |
| Any page text, headings, FAQ answers, legal text | `messages/*.json` | — | yes |
| Founder story, vehicle description | `messages/*.json` | — | yes |
| Photos | `/admin/photos` | ✅ | — |
| Logo, favicon, social share image | `public/`, `components/` | — | yes |
| Env vars (Supabase, SumUp, email, analytics, site URL) | Netlify UI | ✅ (Netlify, not `/admin`) | redeploy needed |
| SumUp checkout, confirmation email sending | `app/api/…` | — | yes |
| Turning on Spanish / Turkish | `i18n/routing.ts` | — | yes |

`/admin/settings` also has an **Environment** panel that shows, without revealing any values, whether
Supabase and your site URL are configured. Check it after your first deploy — three green ticks means
the plumbing is right.

---

## Part 6 — Every environment variable, in one table

From `.env.example`. On the live site these go in Netlify → **Site configuration → Environment
variables**; locally they go in a file called `.env.local` (copy `.env.example` and fill it in). Never
commit real values to the code repository.

| Variable | Needed? | What it is | Where you get it |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Blocker** | Address of your database | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Blocker** | Public read/write key, safe in the browser | Same screen |
| `SUPABASE_SERVICE_ROLE_KEY` | **Blocker** | Secret key your admin dashboard writes with. Server-only — never add `NEXT_PUBLIC_` | Same screen. Treat like a password |
| `NEXT_PUBLIC_SITE_URL` | **Blocker** | Your public address, e.g. `https://viennagrandtours.at` | You decide; must match the live domain |
| `SUMUP_API_KEY` / `SUMUP_MERCHANT_CODE` | Required for Hosted Checkout | SumUp dashboard → Developer |
| `SUMUP_PAY_TO_EMAIL` | Optional reference | Your SumUp login email |
| `NEXT_PUBLIC_SUMUP_PUBLIC_KEY` | Only for embedded widget (not used for Hosted Checkout) | SumUp dashboard |
| `EMAIL_API_KEY` | For confirmation emails | Sending key (commented out in `.env.example` — uncomment) | Resend / Postmark dashboard |
| `EMAIL_FROM` | For confirmation emails | The "from" address, e.g. `bookings@yourdomain.at` | Must be a domain you verified with the provider |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Optional | Turns on Plausible analytics after consent | Plausible account; leave blank if unused |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Optional | Turns on Google Analytics after consent | GA4 property; leave blank if unused |

---

## Part 7 — Final pre-launch pass

- [ ] Book a tour yourself on the live site, end to end, and check it appears in `/admin/bookings`.
- [ ] Open the Impressum, AGB and Datenschutz pages on your phone and confirm **no square brackets
      remain anywhere** and the draft banner is gone.
- [ ] Confirm the footer shows your real email, phone and meeting point (if any of them is missing,
      the value is still bracketed somewhere — that is the site protecting you).
- [ ] Confirm the homepage shows a real photograph, not a "photo needed" placeholder.
- [ ] Confirm the testimonials on the homepage are real, and the "sample reviews" label is gone.
- [ ] Confirm `yourdomain.at/admin` asks you to log in when signed out, and that Google is not
      indexing it (`robots.txt` already blocks `/admin`).
- [ ] Confirm the cookie banner appears, and that choosing "Essential only" loads no analytics.
- [ ] Have someone run `npm run check:messages` after the text edits — it verifies all four language
      files still match and that no placeholder wording crept back in.

---

**Absolute minimum to legally and honestly take your first online booking:** Supabase project +
schema, admin user, Netlify site with the four core env vars and your domain, every bracketed legal
field completed, a lawyer's sign-off with the draft banner removed, the sample testimonials deleted,
an honest answer on payment (SumUp wired, or the copy changed), and a confirmation email that either
sends itself or that you send by hand.
