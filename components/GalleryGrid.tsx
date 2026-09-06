"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
  const [active, setActive] = useState<GalleryTile | null>(null);

  const filters = useMemo(() => {
    const present = new Set(items.map((i) => i.category));
    return ALL_FILTERS.filter((f) => f === "all" || present.has(f));
  }, [items]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [filter, items]
  );

  useEffect(() => {
    if (filter !== "all" && !filters.includes(filter)) setFilter("all");
  }, [filter, filters]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  if (items.length === 0) return null;

  return (
    <div>
      <div
        className="flex flex-wrap justify-start gap-x-1 gap-y-2 border-b border-navy/10 pb-4"
        role="tablist"
        aria-label={t("filtersLabel")}
      >
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 font-sans text-sm font-medium tracking-wide transition ${
              filter === f
                ? "border-b-2 border-gold text-navy"
                : "text-navy/50 hover:text-navy"
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
                onClick={() => setActive(item)}
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
          onClick={() => setActive(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden bg-cream-warm shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex max-h-[78vh] items-center justify-center bg-navy-ink/5">
              <Image
                src={active.src}
                alt={active.alt}
                width={1600}
                height={1200}
                sizes="(max-width: 768px) 100vw, 1200px"
                quality={92}
                className="max-h-[78vh] w-auto max-w-full object-contain"
                priority
              />
            </div>
            {(active.title || active.hint) && (
              <div className="border-t border-navy/8 px-4 py-3 sm:px-5">
                {active.title ? (
                  <p className="font-display text-lg leading-snug text-navy sm:text-xl">
                    {active.title}
                  </p>
                ) : null}
                {active.hint ? (
                  <p className="mt-1 font-sans text-sm leading-relaxed text-navy/60">
                    {active.hint}
                  </p>
                ) : null}
              </div>
            )}
            <button
              type="button"
              className="absolute end-3 top-3 border border-cream/20 bg-navy-deep/80 px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-caption text-cream backdrop-blur-sm transition hover:border-gold/50"
              onClick={() => setActive(null)}
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
