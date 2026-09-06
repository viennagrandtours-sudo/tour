"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const ADMIN_LINKS = [
  { href: "/admin", label: "Overview", hint: "Today at a glance" },
  { href: "/admin/bookings", label: "Bookings", hint: "Every reservation" },
  { href: "/admin/availability", label: "Availability", hint: "Block out dates" },
  { href: "/admin/messages", label: "Inbox", hint: "Contact form" },
  { href: "/admin/testimonials", label: "Testimonials", hint: "Reviews on the site" },
  { href: "/admin/photos", label: "Photos", hint: "Images and their wording" },
  { href: "/admin/tours", label: "Tours & pricing", hint: "Tier overrides" },
  { href: "/admin/settings", label: "Settings", hint: "Business info" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="space-y-0.5">
      {ADMIN_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`block rounded px-3 py-2 text-sm transition ${
              active
                ? "bg-gold/20 font-semibold text-gold-pale"
                : "text-cream/70 hover:bg-cream/10 hover:text-cream"
            }`}
          >
            <span className="block">{link.label}</span>
            <span className="block text-[11px] text-cream/40">{link.hint}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminTopNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:hidden"
    >
      {ADMIN_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "border-gold bg-gold/20 text-gold-pale"
                : "border-cream/20 text-cream/70 hover:border-gold/50 hover:text-cream"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
