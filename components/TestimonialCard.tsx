type Props = {
  author: string;
  quote: string;
  rating?: number;
};

export default function TestimonialCard({ author, quote, rating = 5 }: Props) {
  return (
    <blockquote className="mx-auto flex max-w-3xl flex-col text-center">
      <div
        className="mx-auto flex gap-1 font-sans text-xs tracking-[0.2em] text-gold"
        aria-label={`${rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} aria-hidden className={i < rating ? "text-gold" : "text-navy/20"}>
            ★
          </span>
        ))}
      </div>
      <p className="mt-6 font-display text-[clamp(1.5rem,3.2vw,2.15rem)] leading-[1.35] tracking-display text-navy text-balance">
        &ldquo;{quote}&rdquo;
      </p>
      <footer className="mt-8">
        <div className="mx-auto mb-4 h-px w-10 bg-gold/50" />
        <cite className="not-italic font-sans text-sm font-semibold tracking-wide text-navy/70">
          {author}
        </cite>
      </footer>
    </blockquote>
  );
}
