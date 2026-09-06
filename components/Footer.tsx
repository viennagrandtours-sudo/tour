import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import Wordmark from "./Wordmark";
import { SITE, isFillIn } from "@/lib/tours";
import { getSiteSettings } from "@/lib/site-settings";

export default async function Footer() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const year = new Date().getFullYear();
  // Business info from /admin/settings, falling back to the SITE defaults.
  const settings = await getSiteSettings();
  // Contact details still bracketed are hidden rather than shown to guests.
  const showEmail = !isFillIn(settings.contact_email);
  const showPhone = !isFillIn(settings.contact_phone);
  const showAddress = !isFillIn(settings.meeting_point_street);
  const showGoogle = !isFillIn(settings.google_business_url.split("cid=")[1] ?? "");
  const showSocial = !isFillIn(settings.instagram_url.split(".com/")[1] ?? "");

  return (
    <footer className="relative mt-28 overflow-hidden border-t border-gold/15 bg-navy-ink text-cream">
      <div className="pointer-events-none absolute inset-0 bg-forest-depth opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-pattern-lines opacity-30" />
      <div className="glow-inline-start pointer-events-none absolute inset-0 opacity-40" />

      <div className="section-shell relative grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Link href="/" className="inline-block transition hover:opacity-90" aria-label={SITE.name}>
            {/* Image logo is dark-on-black and vanishes on the forest footer — use the light wordmark. */}
            <Wordmark tone="light" size="md" />
          </Link>
          <div className="mt-6">
            <LanguageSwitcher tone="dark" />
          </div>
        </div>

        <div>
          <p className="section-kicker text-gold/90">{t("quickLinks")}</p>
          <ul className="mt-5 space-y-2.5 font-sans text-sm text-cream/75">
            {(
              [
                { href: "/tours", key: "tours" },
                { href: "/book", key: "book" },
                { href: "/about", key: "about" },
                { href: "/gallery", key: "gallery" },
                { href: "/faq", key: "faq" },
              ] as const
            ).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition hover:text-gold-light"
                >
                  {nav(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="section-kicker text-gold/90">{t("legal")}</p>
          <ul className="mt-5 space-y-2.5 font-sans text-sm text-cream/75">
            <li>
              <Link href="/impressum" className="transition hover:text-gold-light">
                {t("impressum")}
              </Link>
            </li>
            <li>
              <Link href="/agb" className="transition hover:text-gold-light">
                {t("agb")}
              </Link>
            </li>
            <li>
              <Link href="/datenschutz" className="transition hover:text-gold-light">
                {t("datenschutz")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="section-kicker text-gold/90">{t("contact")}</p>
          <ul className="mt-5 space-y-2.5 font-sans text-sm text-cream/75">
            {showEmail && (
              <li>
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="transition hover:text-gold-light"
                >
                  {settings.contact_email}
                </a>
              </li>
            )}
            {showPhone && (
              <li>
                <a
                  href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}
                  className="transition hover:text-gold-light"
                >
                  {settings.contact_phone}
                </a>
              </li>
            )}
            {showAddress && (
              <li className="leading-relaxed">
                {settings.meeting_point_street}
                <br />
                {settings.meeting_point_city}
              </li>
            )}
            <li className="leading-relaxed text-cream/60">{t("meetingPoint")}</li>
            {showGoogle && (
              <li>
                <a
                  href={settings.google_business_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-gold-light"
                >
                  {t("googleBusiness")}
                </a>
              </li>
            )}
          </ul>
          <div className={`mt-6 flex gap-5 ${showSocial ? "" : "hidden"}`}>
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream/55 transition hover:text-gold-light"
              aria-label="Instagram"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5a5 5 0 100 10 5 5 0 000-10zm6.5-.9a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2zM12 9a3 3 0 110 6 3 3 0 010-6z" />
              </svg>
            </a>
            <a
              href={settings.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream/55 transition hover:text-gold-light"
              aria-label="Facebook"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="relative border-t border-cream/10 py-5 text-center font-sans text-[11px] tracking-wide text-cream/45">
        <p>{t("rights", { year })}</p>
        <p className="mt-1.5 text-cream/55">
          {t.rich("madeBy", {
            name: (chunks) => (
              <a
                href="https://besaweb.studio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold/80 transition hover:text-gold-light"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>
    </footer>
  );
}
