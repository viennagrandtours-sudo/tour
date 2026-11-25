import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

/**
 * Cloudflare Workers build (OpenNext). Public pages are prerendered and
 * refreshed every 5 minutes (`revalidate = 300` in app/[locale]/layout.tsx):
 *
 * - incrementalCache: prerendered pages live in the KV namespace bound as
 *   NEXT_INC_CACHE_KV (wrangler.jsonc). KV needs no payment method; its free
 *   tier allows 1,000 writes a day (each deploy + each page refresh writes).
 *   For more traffic, switch to R2 (r2-incremental-cache + an R2 bucket).
 * - queue: background regeneration of stale pages, via the
 *   WORKER_SELF_REFERENCE service binding.
 * - enableCacheInterception: serve cached pages before booting the Next.js
 *   server — faster and much less CPU per request.
 *
 * No tag cache: the app never calls revalidateTag/revalidatePath.
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: memoryQueue,
  enableCacheInterception: true,
});
