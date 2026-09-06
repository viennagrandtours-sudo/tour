import { notFound } from "next/navigation";

/**
 * Without this catch-all, an unknown path under `/en` or `/de` falls through to
 * Next's unstyled root 404 instead of the translated one in `[locale]/not-found`.
 *
 * Next discards page metadata for a `notFound()` response and marks it noindex,
 * so there is deliberately no `generateMetadata` here.
 */
export default function CatchAllNotFound() {
  notFound();
}
