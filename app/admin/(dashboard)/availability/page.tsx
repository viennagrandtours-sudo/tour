import { fetchBlockedSlots } from "@/lib/admin/data";
import { toAvailabilityPayload } from "@/lib/blocked-slots";
import { AvailabilityManager } from "@/components/admin/AvailabilityManager";
import { DataNotice, PageHeading, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminAvailabilityPage() {
  const blocked = await fetchBlockedSlots();
  const payload = toAvailabilityPayload(blocked.data);

  return (
    <>
      <PageHeading
        title="Availability"
        description="Days and time slots you are not taking bookings. Past blocks drop off this list automatically."
      />

      <DataNotice source={blocked.source} error={blocked.error} />

      <AvailabilityManager slots={blocked.data} readOnly={blocked.source === "demo"} />

      <div className="mt-5">
        <Panel
          title="What the booking form sees"
          hint="Live output of GET /api/availability — the public form reads this to grey out dates."
        >
          <pre className="overflow-x-auto rounded bg-navy-ink/95 p-3 text-xs leading-relaxed text-cream/90">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </Panel>
      </div>
    </>
  );
}
