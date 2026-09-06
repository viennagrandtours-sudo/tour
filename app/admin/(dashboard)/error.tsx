"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin screen failed:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-md border border-red-300 bg-red-50 px-5 py-6 text-center">
      <h1 className="font-display text-2xl font-semibold text-red-900">
        This screen could not load
      </h1>
      <p className="mt-2 text-sm text-red-800">
        Usually this means Supabase is unreachable or the schema is out of date. Try again, and
        if it keeps happening re-run <code className="rounded bg-white px-1">supabase/schema.sql</code>.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-red-700/80">Reference: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex rounded border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
      >
        Try again
      </button>
    </div>
  );
}
