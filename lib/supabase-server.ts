import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  supabaseAnonKey,
  supabaseConfigured,
  supabaseServiceKey,
  supabaseUrl,
} from "@/lib/supabase-env";

/**
 * Server-side Supabase clients for the admin area.
 *
 * - `createSupabaseRSC()` / `createSupabaseAction()` read the auth cookie so we
 *   know *who* is signed in. They run under the anon key + RLS.
 * - `createSupabaseAdmin()` uses the service role key and bypasses RLS. Only
 *   ever call it from server code, and only after confirming a session.
 */

const url = supabaseUrl;
const anonKey = supabaseAnonKey;
const serviceKey = supabaseServiceKey;

export function isSupabaseConfigured(): boolean {
  return supabaseConfigured();
}

export function hasServiceRole(): boolean {
  return Boolean(url() && serviceKey());
}

/**
 * Cookie-bound client for Server Components. Next.js forbids writing cookies
 * during render, so token refreshes are swallowed here — middleware already
 * refreshes the session on every admin request.
 */
export function createSupabaseRSC(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const store = cookies();

  return createServerClient(url()!, anonKey()!, {
    cookies: {
      get: (name: string) => store.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  });
}

/** Cookie-bound client for Server Actions and Route Handlers (can write cookies). */
export function createSupabaseAction(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const store = cookies();

  return createServerClient(url()!, anonKey()!, {
    cookies: {
      get: (name: string) => store.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        try {
          store.set({ name, value, ...options });
        } catch {
          // Called from a context that cannot mutate cookies — safe to ignore.
        }
      },
      remove: (name: string, options: CookieOptions) => {
        try {
          store.set({ name, value: "", ...options });
        } catch {
          // Same as above.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS, so never return it or its results to an
 * unauthenticated caller. Falls back to the anon key if no service role key is
 * set, which keeps local dev working (writes then depend on RLS policies).
 */
export function createSupabaseAdmin(): SupabaseClient | null {
  const baseUrl = url();
  const key = serviceKey() || anonKey();
  if (!baseUrl || !key) return null;

  return createClient(baseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AdminUser = {
  id: string;
  email: string | null;
};

/** Returns the signed-in admin user, or null when signed out / not configured. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = createSupabaseRSC();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch (error) {
    // Unreachable Supabase project — fail closed rather than assume a session.
    console.error("Admin session lookup failed:", error);
    return null;
  }
}
