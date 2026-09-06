"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const STORAGE_KEY = "vgt-cookie-consent";

export type ConsentValue = "all" | "essential";

function loadAnalytics() {
  // Analytics (Plausible or GA4) load only after explicit consent.
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const ga4 = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  if (plausibleDomain && !document.getElementById("plausible-script")) {
    const s = document.createElement("script");
    s.id = "plausible-script";
    s.defer = true;
    s.setAttribute("data-domain", plausibleDomain);
    s.src = "https://plausible.io/js/script.js";
    document.head.appendChild(s);
  }

  if (ga4 && !document.getElementById("ga4-script")) {
    const s = document.createElement("script");
    s.id = "ga4-script";
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4}`;
    document.head.appendChild(s);
    const inline = document.createElement("script");
    inline.id = "ga4-inline";
    inline.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');`;
    document.head.appendChild(inline);
  }
}

export default function CookieConsent() {
  const t = useTranslations("cookies");
  const [visible, setVisible] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentValue | null;
    if (!stored) {
      setVisible(true);
      return;
    }
    if (stored === "all") loadAnalytics();
  }, []);

  // Non-blocking banner (no backdrop, page stays usable) — so we move focus to
  // it once for keyboard/screen-reader users to notice it, but don't trap Tab.
  useEffect(() => {
    if (visible) acceptRef.current?.focus();
  }, [visible]);

  function choose(value: ConsentValue) {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
    if (value === "all") loadAnalytics();
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-body"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl animate-fade-up rounded-lg border border-navy/10 bg-cream p-5 text-start shadow-xl shadow-navy/20 sm:inset-x-auto sm:end-6 sm:bottom-6"
    >
      <h2 id="cookie-title" className="font-display text-xl text-navy">
        {t("title")}
      </h2>
      <p id="cookie-body" className="mt-2 font-sans text-sm leading-relaxed text-navy/75">
        {t("body")}{" "}
        <Link href="/datenschutz" className="underline decoration-gold underline-offset-2">
          {t("privacy")}
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          ref={acceptRef}
          type="button"
          className="btn-primary !py-2.5"
          onClick={() => choose("all")}
        >
          {t("accept")}
        </button>
        <button type="button" className="btn-ghost !py-2.5" onClick={() => choose("essential")}>
          {t("essential")}
        </button>
      </div>
    </div>
  );
}
