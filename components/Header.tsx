"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import BrandLogo from "./BrandLogo";
import { SITE } from "@/lib/tours";

const LINKS = [
  { href: "/tours" as const, key: "tours" },
  { href: "/about" as const, key: "about" },
  { href: "/gallery" as const, key: "gallery" },
  { href: "/faq" as const, key: "faq" },
];

/**
 * Solid cream sticky header on every page.
 * (Transparent-over-hero was unreliable: contrast on bright hero sky,
 * logo/wordmark swap flash, scroll-state stuck, fixed/sticky layout clash.)
 */
export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-cream-soft shadow-soft">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent rtl:bg-gradient-to-l"
        aria-hidden
      />

      <div className="section-shell flex items-center justify-between gap-3 py-2 sm:gap-4 sm:py-2.5">
        <Link
          href="/"
          className="group relative -ms-1 shrink-0 transition hover:opacity-90"
          aria-label={SITE.name}
        >
          <BrandLogo size="sm" priority className="drop-shadow-[0_2px_10px_rgba(14,34,28,0.16)]" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label={t("mainNav")}>
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.key}
                href={link.href}
                className={`relative font-sans text-[13px] font-medium tracking-wideish transition ${
                  active ? "text-navy" : "text-navy/60 hover:text-navy"
                }`}
              >
                {t(link.key)}
              </Link>
            );
          })}
          <LanguageSwitcher tone="light" />
          <Link
            href="/book"
            className="btn-primary !px-5 !py-2.5 !text-[11px] uppercase tracking-caption"
          >
            {t("bookCta")}
          </Link>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/book"
            className="inline-flex items-center justify-center rounded-sm bg-gold px-3.5 py-2 font-sans text-[11px] font-semibold uppercase tracking-caption text-navy-deep transition hover:bg-gold-light"
          >
            {t("book")}
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-sm border border-navy/20 px-3 py-2 text-navy transition hover:border-gold/60 hover:bg-cream-warm"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{t("menu")}</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="border-t border-navy/10 bg-cream-soft px-5 py-6 lg:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label={t("mobileNav")}>
            {LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  className={`border-b border-navy/8 py-3 text-start font-sans text-base tracking-wide ${
                    active ? "text-navy" : "text-navy/70"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {t(link.key)}
                </Link>
              );
            })}
            <div className="pt-4">
              <LanguageSwitcher tone="light" />
            </div>
            <Link href="/book" className="btn-primary mt-4" onClick={() => setOpen(false)}>
              {t("bookCta")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
