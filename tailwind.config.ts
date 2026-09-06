import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand primary: deep forest / British racing green (token kept as `navy` for existing classes)
        navy: {
          DEFAULT: "#1B3A2F",
          soft: "#2D5244",
          mist: "#3D6B58",
          deep: "#0E221C",
          ink: "#071512",
        },
        gold: {
          DEFAULT: "#C4A35A",
          light: "#D4BC7E",
          muted: "#A8894A",
          deep: "#8F7340",
          pale: "#E8D9B0",
          // Text-safe gold for captions/kickers on cream surfaces — `muted` only
          // clears ~3:1 there (fails WCAG 4.5:1 for small text); this clears ~6.4:1.
          ink: "#6B552C",
        },
        cream: {
          DEFAULT: "#F7F3EB",
          soft: "#FBF9F4",
          warm: "#EFE8D9",
          deep: "#E4D9C4",
          mist: "#FAF6EE",
        },
        ink: "#1A1A1A",
      },
      fontFamily: {
        display: [
          "var(--font-display)",
          "var(--font-arabic-display)",
          "var(--font-zh-display)",
          "Georgia",
          "serif",
        ],
        sans: [
          "var(--font-sans)",
          "var(--font-arabic-sans)",
          "var(--font-zh-sans)",
          "ui-sans-serif",
          "sans-serif",
        ],
      },
      letterSpacing: {
        brand: "0.04em",
        display: "0.01em",
        wideish: "0.08em",
        caption: "0.18em",
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 6vw, 4.75rem)", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
        "display-lg": ["clamp(2.25rem, 4.5vw, 3.5rem)", { lineHeight: "1.1" }],
        "display-md": ["clamp(1.75rem, 3vw, 2.5rem)", { lineHeight: "1.15" }],
      },
      backgroundImage: {
        "hero-veil":
          "linear-gradient(165deg, rgba(7,21,18,0.55) 0%, rgba(14,34,28,0.42) 35%, rgba(27,58,47,0.55) 68%, rgba(14,34,28,0.82) 100%), linear-gradient(90deg, rgba(14,34,28,0.55) 0%, transparent 45%)",
        "hero-vignette":
          "radial-gradient(ellipse 85% 70% at 50% 40%, transparent 40%, rgba(7,21,18,0.55) 100%)",
        "page-glow":
          "radial-gradient(ellipse 80% 50% at 8% 0%, rgba(196,163,90,0.14), transparent 55%), radial-gradient(ellipse 60% 45% at 92% 18%, rgba(27,58,47,0.08), transparent 50%), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(196,163,90,0.06), transparent 55%)",
        "section-glow":
          "radial-gradient(ellipse 70% 60% at 20% 0%, rgba(196,163,90,0.1), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(27,58,47,0.06), transparent 50%)",
        "pattern-lines":
          "repeating-linear-gradient(90deg, transparent, transparent 56px, rgba(196,163,90,0.05) 56px, rgba(196,163,90,0.05) 57px)",
        "pattern-grid":
          "linear-gradient(rgba(196,163,90,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(196,163,90,0.04) 1px, transparent 1px)",
        "paper-wash":
          "linear-gradient(180deg, rgba(251,249,244,0.95) 0%, rgba(247,243,235,0.9) 45%, rgba(239,232,217,0.85) 100%)",
        "forest-depth":
          "linear-gradient(160deg, #0E221C 0%, #1B3A2F 45%, #243F34 75%, #1B3A2F 100%)",
        "gold-sheen":
          "linear-gradient(105deg, transparent 30%, rgba(196,163,90,0.12) 48%, transparent 65%)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
      boxShadow: {
        soft: "0 1px 0 rgba(27,58,47,0.06), 0 12px 40px -24px rgba(14,34,28,0.35)",
        lift: "0 18px 50px -28px rgba(14,34,28,0.4)",
        "inset-soft": "inset 0 1px 0 rgba(255,255,255,0.35)",
        focus: "0 0 0 3px rgba(196,163,90,0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "soft-pan": {
          "0%": { transform: "scale(1.06) translate3d(0, 0, 0)" },
          "100%": { transform: "scale(1.1) translate3d(-1.8%, 0.6%, 0)" },
        },
        "rule-draw": {
          "0%": { transform: "scaleX(0)", opacity: "0" },
          "100%": { transform: "scaleX(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.85s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.9s ease-out both",
        "soft-pan": "soft-pan 22s ease-in-out alternate infinite",
        "rule-draw": "rule-draw 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      transitionTimingFunction: {
        elegant: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
