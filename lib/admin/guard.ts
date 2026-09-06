import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseAdmin,
  getAdminUser,
  isSupabaseConfigured,
} from "@/lib/supabase-server";
import type { ActionResult } from "./types";

export const DEMO_WRITE_MESSAGE =
  "Demo mode — nothing was saved. Add your Supabase environment variables to make this live.";

type Allowed = { ok: true; supabase: SupabaseClient };
type Denied = { ok: false; result: ActionResult };

/**
 * Gate for every admin mutation. Confirms a Supabase Auth session before
 * handing back the service-role client, which bypasses RLS. Middleware already
 * redirects signed-out visitors; this is the second lock, because Server
 * Actions are reachable by direct POST.
 */
export async function requireAdmin(): Promise<Allowed | Denied> {
  if (!isSupabaseConfigured()) {
    return { ok: false, result: { ok: false, message: DEMO_WRITE_MESSAGE } };
  }

  const user = await getAdminUser();
  if (!user) {
    return {
      ok: false,
      result: { ok: false, message: "Your session expired. Please sign in again." },
    };
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return {
      ok: false,
      result: { ok: false, message: "Supabase is not configured on the server." },
    };
  }

  return { ok: true, supabase };
}

export function failure(message: string): ActionResult {
  return { ok: false, message };
}

export function success(message: string): ActionResult {
  return { ok: true, message };
}

/** Turns a Supabase error into something an owner can act on. */
export function dbFailure(prefix: string, error: { message: string } | null): ActionResult {
  const detail = error?.message ?? "unknown error";
  if (/does not exist|schema cache/i.test(detail)) {
    return failure(`${prefix}: the table or column is missing. Re-run supabase/schema.sql.`);
  }
  return failure(`${prefix}: ${detail}`);
}

export function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function num(formData: FormData, key: string): number {
  return Number(str(formData, key));
}

export function bool(formData: FormData, key: string): boolean {
  const value = str(formData, key);
  return value === "on" || value === "true" || value === "1";
}
