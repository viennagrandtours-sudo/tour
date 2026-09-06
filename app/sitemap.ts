import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { languageAlternates } from "@/i18n/seo";
import { SITE_URL } from "@/lib/tours";

const siteUrl = SITE_URL;

const paths = [
  "",
  "/tours",
  "/book",
  "/about",
  "/gallery",
  "/faq",
  "/impressum",
  "/agb",
  "/datenschutz",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of paths) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" || path === "/book" ? "weekly" : "monthly",
        priority: path === "" ? 1 : path === "/book" || path === "/tours" ? 0.9 : 0.6,
        alternates: {
          languages: languageAlternates(path),
        },
      });
    }
  }

  return entries;
}
