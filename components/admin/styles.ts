/**
 * Class-name constants for the admin area. The public site has its own
 * component classes in globals.css; admin deliberately keeps its denser,
 * more utilitarian styling local so the two can evolve independently.
 */

export const card =
  "rounded-md border border-navy/10 bg-cream-soft shadow-soft";

export const cardPad = "p-4 sm:p-5";

export const label =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wideish text-navy/55";

export const input =
  "w-full rounded border border-navy/20 bg-white px-3 py-2 text-sm text-navy outline-none transition placeholder:text-navy/35 focus:border-gold focus:shadow-focus disabled:cursor-not-allowed disabled:bg-cream-warm/60";

export const select = `${input} appearance-none bg-white pr-8`;

export const textarea = `${input} min-h-[80px] resize-y leading-relaxed`;

export const btnBase =
  "inline-flex items-center justify-center gap-1.5 rounded border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

export const btnPrimary = `${btnBase} border-navy bg-navy text-cream hover:bg-navy-soft`;

export const btnGold = `${btnBase} border-gold bg-gold text-navy-deep hover:bg-gold-light`;

export const btnGhost = `${btnBase} border-navy/20 bg-white text-navy hover:border-gold hover:bg-cream-warm/60`;

export const btnDanger = `${btnBase} border-red-300 bg-white text-red-700 hover:border-red-500 hover:bg-red-50`;

export const btnTiny =
  "inline-flex items-center justify-center gap-1 rounded border border-navy/20 bg-white px-2 py-1 text-xs font-semibold text-navy transition hover:border-gold hover:bg-cream-warm/60 disabled:cursor-not-allowed disabled:opacity-50";

export const tableWrap =
  "w-full overflow-x-auto rounded-md border border-navy/10 bg-cream-soft";

export const table = "w-full min-w-[860px] border-collapse text-sm";

export const th =
  "sticky top-0 z-10 whitespace-nowrap border-b border-navy/15 bg-cream-warm/90 px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wideish text-navy/70 backdrop-blur";

export const td = "border-b border-navy/8 px-3 py-2.5 align-top text-navy/85";

export const kicker =
  "text-[11px] font-semibold uppercase tracking-caption text-gold-deep";
