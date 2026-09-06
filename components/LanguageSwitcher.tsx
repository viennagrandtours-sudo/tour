"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_NATIVE_NAMES, routing, type Locale } from "@/i18n/routing";

type Tone = "light" | "dark";

export default function LanguageSwitcher({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: Tone;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname, locale]);

  useEffect(() => {
    if (!open) return;

    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = (isSwitcherLocale(locale) ? locale : "en") as Locale;
  const dark = tone === "dark";

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("languageSwitcher")}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex min-w-[6.75rem] items-center justify-between gap-2 border px-2.5 py-1.5 font-sans text-[12px] font-semibold tracking-wide transition ${
          dark
            ? "border-cream/20 bg-navy-ink/40 text-cream/80 hover:border-gold/40 hover:text-cream"
            : "border-navy/12 bg-cream-warm/80 text-navy/70 hover:border-gold/50 hover:text-navy"
        }`}
      >
        <span dir="auto">{LOCALE_NATIVE_NAMES[current]}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          className={`shrink-0 opacity-70 transition ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("languageSwitcher")}
          className="absolute end-0 z-50 mt-1 max-h-[min(70vh,22rem)] min-w-[10.75rem] overflow-auto border border-navy/12 bg-cream-soft py-1 shadow-lift"
        >
          {routing.locales.map((loc) => {
            const active = loc === current;
            return (
              <li key={loc} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setOpen(false);
                    router.replace(pathname, { locale: loc });
                  }}
                  className={`flex w-full items-center px-3 py-2 text-start font-sans text-[13px] transition ${
                    active
                      ? "bg-gold/20 font-semibold text-navy"
                      : "text-navy/70 hover:bg-cream-warm hover:text-navy"
                  }`}
                >
                  <span dir="auto">{LOCALE_NATIVE_NAMES[loc]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function isSwitcherLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}
