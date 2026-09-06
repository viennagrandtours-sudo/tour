import type { NextRequest } from "next/server";

/**
 * Best-effort in-memory rate limit for public POST/GET endpoints.
 *
 * This is per-instance, not shared across serverless invocations — on a
 * platform that spins up multiple function instances it under-counts rather
 * than over-blocks. That's an acceptable trade-off for a small tour operator
 * (it still stops a single scripted flood from one warm instance) without
 * adding a Redis/Upstash dependency this project doesn't otherwise need. If
 * traffic ever justifies it, swap the Map below for a shared store.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Prevent unbounded growth from many distinct IPs over a long-running instance.
const MAX_TRACKED_KEYS = 5000;

export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || req.headers.get("cf-connecting-ip")?.trim() || "unknown";
}

/**
 * Returns `{ ok: true }` if `key` is under `limit` requests per `windowMs`,
 * otherwise `{ ok: false, retryAfterSeconds }`. Call once per request.
 */
export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true };
}
