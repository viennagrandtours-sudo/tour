import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser, isSupabaseConfigured } from "@/lib/supabase-server";
import { signOutAction } from "@/lib/admin/auth-actions";
import { AdminSidebarNav, AdminTopNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

/**
 * Server-side gate for every /admin screen except the login page. Middleware
 * already redirects signed-out visitors, but this makes the protection hold
 * even if the matcher is ever loosened.
 */
export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const user = configured ? await getAdminUser() : null;

  if (configured && !user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <header className="bg-navy-deep px-4 py-3 lg:hidden">
        <div className="mb-2 flex items-center justify-between gap-3">
          <Link href="/admin" className="font-display text-lg font-semibold text-cream">
            Tour Admin
          </Link>
          <SignOutForm compact />
        </div>
        <AdminTopNav />
      </header>

      <aside className="hidden w-60 shrink-0 flex-col justify-between bg-navy-deep px-3 py-5 lg:flex">
        <div>
          <Link href="/admin" className="block px-3 pb-5">
            <span className="block font-display text-xl font-semibold text-cream">
              Tour Admin
            </span>
            <span className="block text-[11px] uppercase tracking-caption text-gold-muted">
              Staff dashboard
            </span>
          </Link>
          <AdminSidebarNav />
        </div>

        <div className="space-y-2 px-3 pt-6">
          {configured ? (
            <p className="truncate text-[11px] text-cream/45" title={user?.email ?? ""}>
              Signed in as {user?.email ?? "unknown"}
            </p>
          ) : (
            <p className="text-[11px] text-gold-light">Demo mode — Supabase not configured</p>
          )}
          <Link
            href="/en"
            className="block text-[11px] text-cream/50 underline-offset-2 hover:text-cream hover:underline"
          >
            View public site
          </Link>
          <SignOutForm />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

function SignOutForm({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className={
          compact
            ? "rounded border border-cream/25 px-2.5 py-1 text-xs font-semibold text-cream/80 transition hover:border-gold hover:text-cream"
            : "w-full rounded border border-cream/25 px-3 py-2 text-xs font-semibold text-cream/80 transition hover:border-gold hover:text-cream"
        }
      >
        Sign out
      </button>
    </form>
  );
}
