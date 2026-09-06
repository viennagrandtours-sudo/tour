export default function AdminLoading() {
  return (
    <div className="animate-pulse" aria-busy role="status">
      <span className="sr-only">Loading…</span>
      <div className="mb-5 h-8 w-52 rounded bg-navy/10" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-md bg-navy/5" />
        ))}
      </div>
      <div className="mt-5 h-72 rounded-md bg-navy/5" />
    </div>
  );
}
