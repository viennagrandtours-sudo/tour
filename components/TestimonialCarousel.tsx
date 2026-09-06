"use client";

import { useEffect, useState } from "react";
import TestimonialCard from "./TestimonialCard";
import type { Testimonial } from "@/lib/supabase";

type Props = {
  /** Published rows from the Supabase `testimonials` table */
  remote?: Testimonial[] | null;
};

export default function TestimonialCarousel({ remote }: Props) {
  const items =
    remote && remote.length > 0
      ? remote.map((r) => ({
          author: r.author_name,
          quote: r.quote,
          rating: r.rating,
        }))
      : [];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[index] ?? items[0];

  return (
    <div>
      <div className="mx-auto animate-fade-in" key={index}>
        <TestimonialCard
          author={current.author}
          quote={current.quote}
          rating={current.rating}
        />
      </div>
      {items.length > 1 && (
        <div className="mt-8 flex justify-center gap-3" role="tablist" aria-label="Testimonials">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`h-px transition-all duration-500 ease-elegant ${
                i === index ? "w-8 bg-gold" : "w-4 bg-navy/20 hover:bg-navy/40"
              }`}
              onClick={() => setIndex(i)}
            >
              <span className="sr-only">Testimonial {i + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
