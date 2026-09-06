"use client";

import { useState } from "react";

export type FAQItem = {
  q: string;
  a: string;
};

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-navy/10 rounded-xl border border-navy/10 bg-white/70">
      {items.map((item, index) => {
        const open = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;

        return (
          <div key={item.q}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start font-sans text-base font-semibold text-navy transition hover:bg-cream-warm/60 sm:px-6"
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span>{item.q}</span>
                <span
                  className={`text-gold transition ${open ? "rotate-45" : ""}`}
                  aria-hidden
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              className="px-5 pb-5 font-sans text-sm leading-relaxed text-navy/75 sm:px-6"
            >
              {open && <p>{item.a}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
