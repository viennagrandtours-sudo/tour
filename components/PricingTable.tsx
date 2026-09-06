import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { tourTierKey, type Tour, type TourType } from "@/lib/tours";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

type Props = {
  /** Resolved tiers from getActiveTours() — code defaults with admin overrides merged in. */
  tours: Tour[];
};

export default function PricingTable({ tours }: Props) {
  const t = useTranslations("tours");

  return (
    <div className="space-y-8">
      {tours.map((tour, index) => {
        const id = tour.id as TourType;
        const tier = tourTierKey(id);
        const highlights = asStringArray(t.raw(`tiers.${tier}.highlights`));
        const included = asStringArray(t.raw(`tiers.${tier}.included`));

        return (
          <article
            key={id}
            id={id}
            className="scroll-mt-24 overflow-hidden border border-navy/10 bg-cream-soft/70 shadow-soft"
          >
            <div className="grid gap-0 lg:grid-cols-[1.05fr_1fr]">
              <div className="relative border-b border-navy/8 p-7 sm:p-9 lg:border-b-0 lg:border-e">
                <div
                  className="pointer-events-none absolute inset-0 bg-section-glow opacity-60"
                  aria-hidden
                />
                <div className="relative">
                  <p className="font-sans text-xs font-semibold uppercase tracking-caption text-gold-ink">
                    {t(`tiers.${tier}.duration`)}
                    <span className="mx-2 text-navy/20">·</span>
                    <span className="text-navy/70">0{index + 1}</span>
                  </p>
                  <h2 className="mt-3 font-display text-display-md tracking-display text-navy">
                    {t(`tiers.${tier}.name`)}
                  </h2>
                  <div className="ornament-rule mt-4" />
                  <p className="mt-4 font-sans text-base leading-relaxed text-navy/75">
                    {t(`tiers.${tier}.description`)}
                  </p>
                  <p className="mt-8 font-display text-4xl tracking-display text-navy sm:text-5xl">
                    €{tour.pricePerPerson}
                    <span className="ms-2 font-sans text-base tracking-normal text-navy/70">
                      {t("perPerson")}
                    </span>
                  </p>
                  <p className="mt-1.5 font-sans text-base text-navy/70">
                    {t("groupFrom", {
                      total: tour.pricePerPerson * tour.minGuests,
                      count: tour.minGuests,
                    })}
                  </p>
                  <p className="mt-1 font-sans text-sm text-navy/70">
                    {t("minGuests", { count: tour.minGuests })}
                  </p>
                  <p className="mt-3 font-sans text-sm text-navy/70">{t("payOnArrival")}</p>
                  <Link href={`/book?tour=${id}`} className="btn-primary mt-7">
                    {t("book")}
                  </Link>
                </div>
              </div>

              <div className="space-y-7 bg-cream-warm/40 p-7 sm:p-9">
                <details className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-sans text-xs font-semibold uppercase tracking-caption text-gold-ink marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="section-kicker !mb-0">
                      {t("landmarks")}
                      <span className="ms-2 font-normal tracking-normal text-navy/70">
                        ({highlights.length})
                      </span>
                    </span>
                    <span
                      className="text-base font-normal text-gold transition group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto pe-1">
                    {highlights.map((item) => (
                      <li key={item} className="flex gap-3 font-sans text-sm text-navy/75">
                        <span className="mt-2 h-px w-3 shrink-0 bg-gold rtl:rotate-180" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </details>
                <div className="border-t border-navy/8 pt-6">
                  <h3 className="section-kicker">{t("stops")}</h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-navy/75">
                    {t(`tiers.${tier}.stops`)}
                  </p>
                </div>
                <div className="border-t border-navy/8 pt-6">
                  <h3 className="section-kicker">{t("languages")}</h3>
                  <p className="mt-2 font-sans text-sm text-navy/75">{t("narrationList")}</p>
                </div>
                <div className="border-t border-navy/8 pt-6">
                  <h3 className="section-kicker">{t("included")}</h3>
                  <ul className="mt-3 space-y-2">
                    {included.map((item) => (
                      <li key={item} className="flex gap-2.5 font-sans text-sm text-navy/75">
                        <span aria-hidden className="text-gold">
                          —
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
