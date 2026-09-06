import Image from "next/image";

type Props = {
  title: string;
  subtitle?: string;
  /** Thin photo strip behind the forest wash — keeps interior pages from feeling identical. */
  imageSrc?: string;
  imageAlt?: string;
  /** CSS object-position for the strip (e.g. "center 40%"). */
  objectPosition?: string;
};

export default function PageHero({
  title,
  subtitle,
  imageSrc,
  imageAlt = "",
  objectPosition = "center 45%",
}: Props) {
  return (
    <div className="relative overflow-hidden bg-navy-ink pb-14 pt-12 text-cream sm:pb-16 sm:pt-14">
      {imageSrc ? (
        <div className="pointer-events-none absolute inset-0">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-45"
            style={{ objectPosition }}
          />
          {/* Soft bottom + side wash so type stays readable over the still */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-ink via-navy-ink/75 to-navy-deep/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-ink/50 via-transparent to-navy-ink/30 rtl:bg-gradient-to-l" />
        </div>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 bg-forest-depth" />
          <div className="pointer-events-none absolute inset-0 bg-hero-vignette opacity-70" />
        </>
      )}
      <div className="pointer-events-none absolute inset-0 bg-pattern-lines opacity-20" />
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          background:
            "radial-gradient(ellipse 50% 80% at 90% 0%, rgba(196,163,90,0.14), transparent 55%)",
        }}
      />
      <div className="section-shell relative">
        <div className="ornament-rule mb-5 animate-rule-draw" />
        <h1 className="animate-fade-up font-display text-display-lg tracking-display">{title}</h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl animate-fade-up font-sans text-base leading-relaxed text-cream/70 delay-100 sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
