import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { tourTierKey, type TourType } from "@/lib/tours";

type Props = {
  tourId: TourType;
  price: number;
  minGuests?: number;
  featured?: boolean;
};

export default function TourCard({ tourId, price, minGuests = 3, featured }: Props) {
  const t = useTranslations("tours");
  const tier = tourTierKey(tourId);
  const groupTotal = price * minGuests;

  return (
    <article
      className={`group flex h-full flex-col border bg-cream-soft/70 p-6 transition duration-500 ease-elegant hover:-translate-y-1 hover:shadow-lift ${
        featured
          ? "border-gold/50 bg-gradient-to-b from-cream-soft to-cream-warm/80 shadow-soft"
          : "border-navy/10 hover:border-gold/35"
      }`}
    >
      <p className="font-sans text-[11px] font-semibold uppercase tracking-caption text-gold-muted">
        {t(`tiers.${tier}.duration`)}
      </p>
      <h3 className="mt-2.5 font-display text-2xl tracking-display text-navy transition group-hover:text-navy-soft">
        {t(`tiers.${tier}.name`)}
      </h3>
      <div className="mt-3 h-px w-8 bg-gold/50 transition duration-500 group-hover:w-14" />
      <p className="mt-4 flex-1 font-sans text-sm leading-relaxed text-navy/65">
        {t(`tiers.${tier}.description`)}
      </p>
      <p className="mt-6 font-display text-3xl tracking-display text-navy">
        €{price}
        <span className="ms-2 font-sans text-sm font-normal tracking-normal text-navy/50">
          {t("perPerson")}
        </span>
      </p>
      <p className="mt-1 font-sans text-sm text-navy/60">
        {t("groupFrom", { total: groupTotal, count: minGuests })}
      </p>
      <p className="mt-1 font-sans text-xs text-navy/45">
        {t("minGuests", { count: minGuests })}
      </p>
      <Link href={`/book?tour=${tourId}`} className="btn-primary mt-5 w-full !py-3">
        {t("book")}
      </Link>
    </article>
  );
}
