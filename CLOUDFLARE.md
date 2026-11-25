# Moving the site from Netlify to Cloudflare

The code is ready: it builds and runs on Cloudflare Workers (via the OpenNext adapter,
config in `wrangler.jsonc` and `open-next.config.ts`). Netlify keeps working until you switch
the domain over in step 6, so nothing goes offline while you set this up.

Do the steps in order. Steps 1–5 happen on a temporary `…workers.dev` address; only step 6
touches your real domain.

---

## 1. Plan (recommended: Workers Paid, $5/month)

Cloudflare dashboard → **Workers & Pages** → **Plans** → **Workers Paid**.

The free plan allows only 10 ms of CPU time per request. Cached pages fit, but the booking API
and the admin area often need more, and requests over the limit fail. The paid plan removes
that worry.

## 2. Create the page-cache bucket

Dashboard → **R2 Object Storage** → **Create bucket** → name it exactly:

```
vienna-grand-tours-cache
```

(R2 may ask you to add a payment method; this site stays well inside the free allowance.)

## 3. Connect the GitHub repository

Dashboard → **Workers & Pages** → **Create** → **Import a repository** → pick
`viennagrandtours-sudo/tour`, branch `main`, then:

| Setting | Value |
|---|---|
| Project / Worker name | `vienna-grand-tours` (must match `wrangler.jsonc`) |
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |

Under **Build variables** (these are baked into the site when it is built), add:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | same as in Netlify |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as in Netlify |
| `NEXT_PUBLIC_SITE_URL` | `https://viennagrandtours.com` |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` or `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | only if you use analytics |

Save and deploy. When it finishes, Cloudflare shows an address like
`https://vienna-grand-tours.<your-account>.workers.dev`.

## 4. Add the server settings

Worker → **Settings** → **Variables and Secrets** → add each one. Use **Secret** for keys and
passwords, **Text** for the rest. Copy the values from Netlify (Site configuration →
Environment variables):

| Name | Type |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Text (yes, again — the server reads it too) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Text |
| `NEXT_PUBLIC_SITE_URL` | Text — `https://viennagrandtours.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret |
| `SUMUP_API_KEY` | Secret |
| `SUMUP_MERCHANT_CODE` | Text |
| `SUMUP_WEBHOOK_SECRET` | Secret (only if you set one on Netlify) |
| `EMAIL_API_KEY` | Secret — the Resend `re_…` key |
| `EMAIL_FROM` | Text — `Vienna Grand Tours <bookings@viennagrandtours.com>` |

Do not add `GMAIL_USER` / `GMAIL_APP_PASSWORD`: sending through Gmail does not work on
Cloudflare. Resend does.

Then **Deployments** → **Retry/Redeploy** the latest build so the settings apply.

## 5. Test on the workers.dev address

On `https://vienna-grand-tours.<your-account>.workers.dev`:

- Open a few pages in English and German.
- Sign in at `/admin`, then make a €1 test booking at `/en/book?test=1` and pay it.
- You should get the "New booking" email at office@viennagrandtours.com and the guest
  confirmation; the booking shows as Confirmed in `/admin/bookings`.
- Cancel the test booking and refund the €1 in SumUp.

If emails don't arrive, check Resend → **Logs**, and the Worker's **Logs** tab in Cloudflare.

## 6. Move the domain

Your domain's DNS is currently run by Netlify. To serve the site from Cloudflare, Cloudflare
must run it instead. **Two sets of email records live in that DNS and must come along:** the
Resend records (or booking emails stop) and the records of your mailbox provider for
office@viennagrandtours.com — MX, plus usually SPF/DKIM TXT records (or that inbox stops
receiving mail).

1. Dashboard → **Add a domain** → `viennagrandtours.com` → Free plan is fine. Cloudflare scans
   and copies the existing records.
2. Before continuing, open Resend → **Domains** → `viennagrandtours.com` → **Records**, and
   check that every record listed there (the `resend._domainkey` TXT, the SPF TXT and MX on
   `send`) also appears in Cloudflare's DNS list with the same value. Do the same with the
   records your mailbox provider (where you created office@viennagrandtours.com) told you to
   add — at least the MX records for `viennagrandtours.com`. Add any that are missing.
3. In the Cloudflare DNS list, delete the records that point the website at Netlify (the
   `viennagrandtours.com` and `www` entries pointing to Netlify / `*.netlify.app`). Leave every
   email record alone.
4. Cloudflare shows two nameservers. At the company where you bought the domain, replace the
   current (Netlify / NS1) nameservers with those two. Wait until Cloudflare says the domain is
   **Active** (minutes to a few hours).
5. Worker → **Settings** → **Domains & Routes** → **Add** → **Custom domain** →
   `viennagrandtours.com`, then again for `www.viennagrandtours.com`.
6. Check in Resend that the domain still shows **Verified**, and send a test email to
   office@viennagrandtours.com from another account to make sure it still arrives.

## 7. Clean up (after a few calm days)

- In Netlify, delete the site (or at least turn off its auto-deploys) so two copies don't run.
- Tell your developer to remove `netlify.toml` and the Netlify notes from the docs.

---

### For developers

- Local Workers preview: `npm run cf:preview` (builds, then `wrangler dev` on :8787).
- Deploy by hand instead of Workers Builds: `npx wrangler login`, then `npm run cf:deploy`.
- Pages are prerendered and stored in R2 (`NEXT_INC_CACHE_R2_BUCKET`); stale pages regenerate
  in the background via the `WORKER_SELF_REFERENCE` binding; `next/image` uses the `IMAGES`
  binding (Cloudflare Images). See `open-next.config.ts` and `wrangler.jsonc`.
- `next dev`, `next build` and Netlify keep working unchanged.
