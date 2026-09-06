import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

const SAFE_NEXT = /^\/admin(\/[\w\-/]*)?$/;

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const requested = searchParams?.next ?? "";
  const next = SAFE_NEXT.test(requested) ? requested : "/admin";
  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest-depth px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-caption text-gold-muted">
            Staff dashboard
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-cream">Tour Admin</h1>
          <p className="mt-1 text-sm text-cream/60">Sign in to manage bookings.</p>
        </div>

        <div className="rounded-md border border-cream/15 bg-cream-soft p-5 shadow-lift">
          {configured ? (
            <LoginForm next={next} />
          ) : (
            <div className="space-y-3 text-sm text-navy/75">
              <p className="rounded border border-gold bg-gold/10 px-3 py-2 text-navy">
                <strong className="font-semibold">Demo mode.</strong> No Supabase project is
                configured, so there is nothing to sign in to.
              </p>
              <p>
                Add <code className="rounded bg-cream-warm px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
                and <code className="rounded bg-cream-warm px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
                to enable the login, then create your user in the Supabase dashboard under
                Authentication → Users.
              </p>
              <Link href="/admin" className="inline-block font-semibold text-navy underline">
                Continue to the demo dashboard
              </Link>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-cream/55">
          <Link href="/en" className="underline-offset-2 hover:text-cream hover:underline">
            Back to the public site
          </Link>
        </p>
      </div>
    </div>
  );
}
