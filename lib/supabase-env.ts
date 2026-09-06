/**
 * Shared, dependency-free env checks. Middleware cannot import anything that
 * pulls in `next/headers`, so this lives apart from lib/supabase-server.ts.
 */

/**
 * .env.example ships with `YOUR_PROJECT` / `your_anon_key` style values. Treat
 * those as "not configured" so a fresh clone lands in the labelled demo mode
 * instead of failing against a hostname that does not resolve.
 */
function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  return /YOUR_PROJECT|^your_|_here$|changeme/i.test(value.trim());
}

export function supabaseUrl(): string | undefined {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return isPlaceholder(value) ? undefined : value;
}

export function supabaseAnonKey(): string | undefined {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return isPlaceholder(value) ? undefined : value;
}

export function supabaseServiceKey(): string | undefined {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return isPlaceholder(value) ? undefined : value;
}

export function supabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}
