import { fetchSiteSettings } from "@/lib/admin/data";
import { codeDefaults, SITE_SETTING_FIELDS } from "@/lib/site-settings";
import { hasServiceRole, isSupabaseConfigured } from "@/lib/supabase-server";
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm";
import { DataNotice, PageHeading, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await fetchSiteSettings();
  const defaults = codeDefaults();

  const checks = [
    {
      label: "Supabase URL and anon key",
      ok: isSupabaseConfigured(),
      detail: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    },
    {
      label: "Service role key",
      ok: hasServiceRole(),
      detail: "SUPABASE_SERVICE_ROLE_KEY — server-only, needed for admin writes",
    },
    {
      label: "Public site URL",
      ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      detail: "NEXT_PUBLIC_SITE_URL — used in sitemap and email links",
    },
  ];

  return (
    <>
      <PageHeading
        title="Settings"
        description="Business details that the public site shows. Saving here stores an override in Supabase; empty fields fall back to the values in the code."
      />

      <DataNotice source={settings.source} error={settings.error} />

      <Panel title="Business info">
        <SiteSettingsForm
          fields={SITE_SETTING_FIELDS}
          values={settings.data}
          defaults={defaults}
          readOnly={settings.source === "demo"}
        />
      </Panel>

      <div className="mt-5">
        <Panel
          title="Environment"
          hint="What this deployment can currently do. Values are never shown, only whether they are set."
        >
          <ul className="space-y-2">
            {checks.map((check) => (
              <li key={check.label} className="flex items-start gap-3 text-sm">
                <span
                  aria-hidden
                  className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    check.ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {check.ok ? "✓" : "!"}
                </span>
                <span>
                  <span className="font-semibold text-navy">
                    {check.label}: {check.ok ? "configured" : "missing"}
                  </span>
                  <span className="block text-xs text-navy/70">{check.detail}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs text-navy/70">
            Set these in Netlify under Site settings → Environment variables, or in{" "}
            <code className="rounded bg-cream-warm px-1">.env.local</code> for local development.
            See ADMIN.md.
          </p>
        </Panel>
      </div>
    </>
  );
}
