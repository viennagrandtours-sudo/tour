import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Root of the staff-facing admin area. It sits outside app/[locale] on purpose:
 * the dashboard is English-only and must never be crawled or localised.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-cream text-navy">{children}</div>;
}
