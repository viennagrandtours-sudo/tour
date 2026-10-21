import {
  Cormorant_Garamond,
  Noto_Naskh_Arabic,
  Noto_Sans_Arabic,
  Noto_Sans_SC,
  Noto_Serif_SC,
  Source_Sans_3,
} from "next/font/google";

/**
 * Shared by the two root layouts (app/[locale] and app/admin). next/font needs
 * the loaders called at module scope, so they live here rather than in either
 * layout.
 */
const display = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const arabicDisplay = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic-display",
  display: "swap",
  fallback: ["Noto Naskh Arabic", "Geeza Pro", "Traditional Arabic", "serif"],
});

const arabicSans = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic-sans",
  display: "swap",
  fallback: ["Noto Sans Arabic", "Geeza Pro", "Tahoma", "sans-serif"],
});

const chineseDisplay = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-zh-display",
  display: "swap",
  fallback: ["Songti SC", "Noto Serif SC", "STSong", "serif"],
});

const chineseSans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-zh-sans",
  display: "swap",
  fallback: ["PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", "sans-serif"],
});

/** Font CSS variables for <body>; Arabic and Chinese faces only load where needed. */
export function bodyFontClasses(locale: string): string {
  const scriptFonts =
    locale === "ar"
      ? `${arabicDisplay.variable} ${arabicSans.variable}`
      : locale === "zh"
        ? `${chineseDisplay.variable} ${chineseSans.variable}`
        : "";

  return `${display.variable} ${sans.variable} ${scriptFonts} font-sans antialiased`;
}
