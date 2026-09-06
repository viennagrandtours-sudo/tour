"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export type GalleryCategory = "vehicle" | "landmarks" | "guests" | "city";

/**
 * One tile, already resolved by the server: a real photo only, with guest-facing
 * wording for the current locale.
 */
export type GalleryTile = {
  key: string;
  category: GalleryCategory;
  variant: "vehicle" | "landmark" | "guest" | "city";
  title: string;
  hint?: string;
  alt: string;
  src?: string;
  /** Kept for callers; grid always uses media + caption below */
  mode: "card" | "media";
};

const ALL_FILTERS: Array<"all" | GalleryCategory> = [
  "all",
  "vehicle",
  "landmarks",
  "guests",
  "city",
];

export default function GalleryGrid({ items }: { items: GalleryTile[] }) {
  const t = useTranslations("gallery");
  const [filter, setFilter] = useState<"all" | GalleryCategory>("all");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const closeRef = useRef<HTMLButtonElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const filters = useMemo(() => {
    const present = new Set(items.map((i) => i.category));
    return ALL_FILTERS.filter((f) => f === "all" || present.has(f));
  }, [items]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [filter, items]
  );

  const activeIndex = activeKey ? visible.findIndex((i) => i.key === activeKey) : -1;
  const active = activeIndex >= 0 ? visible[activeIndex] : null;
  const hasMultiple = visible.length > 1;

  useEffect(() => {
    if (filter !== "all" && !filters.includes(filter)) setFilter("all");
  }, [filter, filters]);

  const openAt = useCallback((key: string, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setActiveKey(key);
  }, []);

  const close = useCallback(() => {
    setActiveKey(null);
    // Return focus to the thumbnail that opened the lightbox, so keyboard and
    // screen-reader users don't lose their place in the grid.
    triggerRef.current?.focus();
    triggerRef.current = null;
  }, []);

  const step = useCallback(
    (delta: 1 | -1) => {
      if (!hasMultiple || activeIndex < 0) return;
      const nextIndex = (activeIndex + delta + visible.length) % visible.length;
      setActiveKey(visible[nextIndex].key);
    },
    [activeIndex, hasMultiple, visible]
  );

  // Focus the dialog on open, and keep Tab cycling within it (close/prev/next)
  // instead of leaking out to the grid underneath.
  useEffect(() => {
    if (!active) return;
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "ArrowRight") {
        step(1);
        return;
      }
      if (e.key === "ArrowLeft") {
        step(-1);
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = [prevRef.current, nextRef.current, closeRef.current].filter(
        (el): el is HTMLButtonElement => Boolean(el)
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close, step]);

  if (items.length === 0) return null;

  return (
    <div>
      <div
        className="flex flex-wrap justify-start gap-x-1 gap-y-2 border-b border-navy/10 pb-4"
        role="group"
        aria-label={t("filtersLabel")}
      >
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`inline-flex min-h-11 items-center px-3 font-sans text-sm font-medium tracking-wide transition ${
              filter === f
                ? "border-b-2 border-gold text-navy"
                : "text-navy/70 hover:text-navy"
            }`}
          >
            {t(`filters.${f}`)}
          </button>
        ))}
      </div>

      <ul className="mt-8 columns-2 gap-3 sm:gap-4 lg:columns-3">
        {visible.map((item) => {
          if (!item.src) return null;
          return (
            <li key={item.key} className="mb-3 break-inside-avoid sm:mb-4">
              <button
                type="button"
                onClick={(e) => openAt(item.key, e.currentTarget)}
                className="group block w-full text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                <figure className="overflow-hidden bg-cream-warm shadow-[inset_0_0_0_1px_rgba(196,163,90,0.12)]">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={1200}
                    height={900}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 400px"
                    quality={90}
                    className="h-auto w-full transition duration-500 ease-elegant group-hover:brightness-[1.04]"
                  />
                  {item.title ? (
                    <figcaption className="px-3 pb-3 pt-2.5 font-display text-[0.95rem] leading-snug text-navy sm:px-3.5 sm:pb-3.5">
                      {item.title}
                    </figcaption>
                  ) : null}
                </figure>
              </button>
            </li>
          );
        })}
      </ul>

      {active?.src && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-ink/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={active.title || active.alt}
          onClick={close}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden bg-cream-warm shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex max-h-[78vh] items-center justify-center bg-navy-ink/5">
              <Image
                key={active.key}
                src={active.src}
                alt={active.alt}
                width={1600}
                height={1200}
                sizes="(max-width: 768px) 100vw, 1200px"
                quality={90}
                className="max-h-[78vh] w-auto max-w-full object-contain"
                priority
              />

              {hasMultiple && (
                <>
                  <button
                    ref={prevRef}
                    type="button"
                    aria-label={t("previous")}
                    onClick={() => step(-1)}
                    className="absolute start-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/25 bg-navy-deep/70 text-cream backdrop-blur-sm transition hover:border-gold/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold rtl:rotate-180"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    ref={nextRef}
                    type="button"
                    aria-label={t("next")}
                    onClick={() => step(1)}
                    className="absolute end-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/25 bg-navy-deep/70 text-cream backdrop-blur-sm transition hover:border-gold/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold rtl:rotate-180"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            {(active.title || active.hint || hasMultiple) && (
              <div className="flex items-start justify-between gap-3 border-t border-navy/8 px-4 py-3 sm:px-5">
                <div>
                  {active.title ? (
                    <p className="font-display text-lg leading-snug text-navy sm:text-xl">
                      {active.title}
                    </p>
                  ) : null}
                  {active.hint ? (
                    <p className="mt-1 font-sans text-sm leading-relaxed text-navy/70">
                      {active.hint}
                    </p>
                  ) : null}
                </div>
                {hasMultiple && (
                  <p className="shrink-0 whitespace-nowrap pt-1 font-sans text-xs text-navy/70">
                    {t("counter", { current: activeIndex + 1, total: visible.length })}
                  </p>
                )}
              </div>
            )}
            <button
              ref={closeRef}
              type="button"
              className="absolute end-3 top-3 flex min-h-11 min-w-11 items-center justify-center border border-cream/20 bg-navy-deep/80 px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-caption text-cream backdrop-blur-sm transition hover:border-gold/50"
              onClick={close}
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
