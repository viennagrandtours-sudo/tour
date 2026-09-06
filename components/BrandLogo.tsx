import Image from "next/image";

type Size = "sm" | "md" | "lg";

/** Native artboard is ~906×668 (≈ 1.36∶1). Keep that ratio so type stays readable. */
const SIZE: Record<Size, { className: string; width: number; height: number }> = {
  // Header mark — ~40–48px tall
  sm: { className: "h-10 w-[3.4rem] sm:h-11 sm:w-[3.75rem]", width: 120, height: 88 },
  // Slightly larger header / compact placements — ~48–56px
  md: { className: "h-12 w-[4.1rem] sm:h-14 sm:w-[4.75rem]", width: 152, height: 112 },
  lg: { className: "h-20 w-[6.75rem] sm:h-24 sm:w-[8.25rem]", width: 264, height: 194 },
};

export default function BrandLogo({
  size = "md",
  className = "",
  priority = false,
}: {
  size?: Size;
  className?: string;
  priority?: boolean;
}) {
  const s = SIZE[size];
  return (
    <Image
      src="/logo.png"
      alt="Vienna Grand Tours"
      width={s.width}
      height={s.height}
      priority={priority}
      className={`${s.className} object-contain object-left ${className}`.trim()}
    />
  );
}
