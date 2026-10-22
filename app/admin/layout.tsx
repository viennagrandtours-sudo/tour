import type { Metadata } from "next";
import type { ReactNode } from "react";
import { bodyFontClasses } from "@/app/fonts";
import "../globals.css";

/**
 * Root of the staff-facing admin area. It sits outside app/[locale] on purpose:
 * the dashboard is English-only and must never be crawled or localised.
 * It is its own root layout, so it renders <html> itself.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyFontClasses("en")}>
        <div className="min-h-screen bg-cream text-navy">{children}</div>
      </body>
    </html>
  );
}
