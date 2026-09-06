import { fetchResolvedTours } from "@/lib/admin/data";
import { TOURS } from "@/lib/tours";
import { formatEur } from "@/lib/admin/format";
import { TourSettingsManager } from "@/components/admin/TourSettingsManager";
import { DataNotice, PageHeading, Panel } from "@/components/admin/ui";
import { table, tableWrap, td, th } from "@/components/admin/styles";

export const dynamic = "force-dynamic";

export default async function AdminToursPage() {
  const tours = await fetchResolvedTours();

  return (
    <>
      <PageHeading
        title="Tours & pricing"
        description="Prices ship in the code. Anything you change here is stored in Supabase and wins over the code value, so you can adjust a price or pull a tier without waiting on a deploy."
      />

      <DataNotice source={tours.source} error={tours.error} />

      <TourSettingsManager
        tours={tours.data}
        defaults={[...TOURS]}
        readOnly={tours.source === "demo"}
      />

      <div className="mt-5">
        <Panel
          title="Code defaults"
          hint="Read-only — these come from lib/tours.ts and are the fallback if an override is removed."
        >
          <div className={tableWrap}>
            <table className={`${table} min-w-[440px]`}>
              <caption className="sr-only">Tour tier defaults from the codebase</caption>
              <thead>
                <tr>
                  <th scope="col" className={th}>
                    Tier
                  </th>
                  <th scope="col" className={th}>
                    Duration
                  </th>
                  <th scope="col" className={th}>
                    Price / person
                  </th>
                  <th scope="col" className={th}>
                    Min guests
                  </th>
                  <th scope="col" className={th}>
                    Currently live
                  </th>
                </tr>
              </thead>
              <tbody>
                {TOURS.map((tour) => {
                  const resolved = tours.data.find((t) => t.id === tour.id);
                  return (
                    <tr key={tour.id}>
                      <td className={`${td} font-semibold`}>{tour.id}</td>
                      <td className={td}>{tour.durationMinutes} min</td>
                      <td className={`${td} tabular-nums`}>{formatEur(tour.pricePerPerson)}</td>
                      <td className={`${td} tabular-nums`}>{tour.minGuests}</td>
                      <td className={`${td} tabular-nums`}>
                        {resolved
                          ? `${formatEur(resolved.pricePerPerson)}${resolved.active ? "" : " (hidden)"}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-navy/70">
            The public pages still read the code values directly. See ADMIN.md for the one-line
            change that switches them to the merged values from{" "}
            <code className="rounded bg-cream-warm px-1">lib/tour-settings.ts</code>.
          </p>
        </Panel>
      </div>
    </>
  );
}
