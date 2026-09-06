import { SITE } from "@/lib/tours";

type Props = {
  /** `light` sits on the dark forest chrome, `dark` on cream. */
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: {
    top: "text-[9px] tracking-[0.44em]",
    bottom: "text-[15px] tracking-[0.13em]",
    gap: "mt-1",
    rule: "mt-1.5",
  },
  md: {
    top: "text-[10px] tracking-[0.46em] sm:text-[11px]",
    bottom: "text-[19px] tracking-[0.14em] sm:text-[22px]",
    gap: "mt-1.5",
    rule: "mt-2",
  },
  lg: {
    top: "text-[11px] tracking-[0.48em] sm:text-xs",
    bottom: "text-[24px] tracking-[0.14em] sm:text-[28px]",
    gap: "mt-2",
    rule: "mt-2.5",
  },
} as const;

/**
 * Typographic brand mark for Vienna Grand Tours: "Vienna" set as a wide-tracked
 * eyebrow over "Grand Tours" in the display serif, closed by a gold hairline
 * with a small diamond. Used instead of an image mark — see README → Brand
 * assets for how to swap a real logo back in.
 */
export default function Wordmark({ tone = "dark", size = "md", className = "" }: Props) {
  const s = SIZES[size];
  const top = tone === "light" ? "text-gold-light/90" : "text-gold-muted";
  const bottom = tone === "light" ? "text-cream" : "text-navy";
  const rule = tone === "light" ? "via-gold-light/70" : "via-gold/70";
  const diamond = tone === "light" ? "bg-gold-light" : "bg-gold";

  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span className={`font-display font-medium uppercase ${s.top} ${top}`}>
        {SITE.wordmark.top}
      </span>
      <span
        className={`font-display font-semibold uppercase ${s.gap} ${s.bottom} ${bottom}`}
      >
        {SITE.wordmark.bottom}
      </span>
      <span className={`flex items-center gap-1.5 ${s.rule}`} aria-hidden>
        <span className={`h-[3px] w-[3px] rotate-45 ${diamond}`} />
        <span
          className={`h-px flex-1 bg-gradient-to-r from-transparent ${rule} to-transparent`}
        />
        <span className={`h-[3px] w-[3px] rotate-45 ${diamond} opacity-50`} />
      </span>
    </span>
  );
}
