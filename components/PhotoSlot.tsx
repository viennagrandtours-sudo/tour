import Image from "next/image";

type PhotoVariant = "vehicle" | "landmark" | "guest" | "city" | "map";

type Props = {
  /** Shoot title — what the founder should capture */
  title: string;
  /** Framing / landmark / time-of-day hint */
  hint?: string;
  /** Accessible description matching the intended photo */
  alt: string;
  variant?: PhotoVariant;
  className?: string;
  /** Extra badge under the title (e.g. vehicle colour cue) */
  badge?: string;
  /**
   * `card` — titled overlay (gallery, about, teasers)
   * `media` — gradient only; parent can show its own cue (e.g. hero)
   */
  mode?: "card" | "media";
  /** When set, renders the real photo via next/image; empty slots render nothing */
  src?: string;
  /** Override the default responsive sizes hint (e.g. "100vw" for the hero) */
  sizes?: string;
  /** CSS object-position for cover crops (e.g. "center 58%") */
  objectPosition?: string;
  /** Extra classes on the next/image element */
  imageClassName?: string;
  /** Set true only for the single largest above-the-fold image on a page (LCP). */
  priority?: boolean;
  /** 75 (default) suits smaller/below-fold tiles; pass 90 for a true hero shot. */
  quality?: number;
};

/**
 * Photo slot: real next/image when `src` is set.
 * Empty slots render nothing on the public site (placeholders stay in admin only).
 */
export default function PhotoSlot({
  title,
  hint,
  alt,
  className = "",
  badge,
  mode = "card",
  src,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  objectPosition,
  imageClassName = "",
  priority = false,
  quality = 75,
}: Props) {
  if (!src) return null;

  return (
    <div className={`media-frame relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        priority={priority}
        className={`object-cover ${imageClassName}`.trim()}
        style={objectPosition ? { objectPosition } : undefined}
      />
      {mode === "card" && (
        <div className="absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-navy-ink/90 via-navy-deep/45 to-transparent pt-16 p-4 sm:p-5">
          <p className="font-display text-lg leading-snug tracking-display text-cream sm:text-xl">
            {title}
          </p>
          {hint && (
            <p className="mt-1.5 max-w-md font-sans text-xs leading-relaxed text-cream/65">
              {hint}
            </p>
          )}
          {badge && (
            <p className="mt-2.5 border-t border-cream/15 pt-2 font-sans text-xs uppercase tracking-wider text-cream/50">
              {badge}
            </p>
          )}
        </div>
      )}
      {mode === "media" && <span className="sr-only">{title}</span>}
    </div>
  );
}
