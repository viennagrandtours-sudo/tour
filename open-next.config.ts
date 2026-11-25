import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

/**
 * Cloudflare Workers build (OpenNext). Public pages are prerendered and
 * refreshed every 5 minutes (`revalidate = 300` in app/[locale]/layout.tsx):
 *
 * - incrementalCache: prerendered pages live in the R2 bucket bound as
 *   NEXT_INC_CACHE_R2_BUCKET (wrangler.jsonc).
 * - queue: background regeneration of stale pages, via the
 *   WORKER_SELF_REFERENCE service binding.
 * - enableCacheInterception: serve cached pages before booting the Next.js
 *   server — faster and much less CPU per request.
 *
 * No tag cache: the app never calls revalidateTag/revalidatePath.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: memoryQueue,
  enableCacheInterception: true,
});
