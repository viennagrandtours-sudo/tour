"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import TestimonialCard from "./TestimonialCard";
import type { Testimonial } from "@/lib/supabase";

type Props = {
  /** Published rows from the Supabase `testimonials` table */
  remote?: Testimonial[] | null;
};

const ROTATE_MS = 6000;

export default function TestimonialCarousel({ remote }: Props) {
  const t = useTranslations("testimonials");
  const items =
    remote && remote.length > 0
      ? remote.map((r) => ({
          author: r.author_name,
          quote: r.quote,
          rating: r.rating,
        }))
      : [];

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [items.length, paused]);

  if (items.length === 0) return null;

  const current = items[index] ?? items[0];

  // A manual pick should stick for a full rotation, not get overridden by the
  // in-flight interval a moment later — bump `paused` off and back on so the
  // effect above tears down and restarts its timer from zero.
  function goTo(i: number) {
    setIndex(i);
    setPaused(true);
    window.setTimeout(() => setPaused(false), 0);
  }

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      <div className="mx-auto animate-fade-in" key={index}>
        <TestimonialCard
          author={current.author}
          quote={current.quote}
          rating={current.rating}
        />
      </div>
      {items.length > 1 && (
        <div className="mt-8 flex justify-center gap-3" role="group" aria-label={t("carouselLabel")}>
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-current={i === index}
              aria-label={t("carouselGoTo", { number: i + 1 })}
              className={`h-px transition-all duration-500 ease-elegant ${
                i === index ? "w-8 bg-gold" : "w-4 bg-navy/20 hover:bg-navy/40"
              }`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
