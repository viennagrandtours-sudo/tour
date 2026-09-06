"use client";

import { saveSiteSettingsAction } from "@/lib/admin/settings-actions";
import {
  isUnfilled,
  type ResolvedSiteSettings,
  type SiteSettingField,
} from "@/lib/site-settings";
import { Feedback, useActionFeedback } from "./client-ui";
import { btnPrimary, input, label } from "./styles";

export function SiteSettingsForm({
  fields,
  values,
  defaults,
  readOnly,
}: {
  fields: SiteSettingField[];
  values: ResolvedSiteSettings;
  defaults: ResolvedSiteSettings;
  readOnly: boolean;
}) {
  const { pending, result, run } = useActionFeedback();
  const unfilled = fields.filter((f) => isUnfilled(values[f.key]));

  return (
    <form
      className="space-y-4"
      action={(formData) => run(() => saveSiteSettingsAction(formData))}
    >
      {unfilled.length > 0 ? (
        <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong className="font-semibold">
            {unfilled.length} value{unfilled.length === 1 ? " is" : "s are"} still a placeholder.
          </strong>{" "}
          Anything showing square brackets has never been filled in and is visible on the public
          site: {unfilled.map((f) => f.label).join(", ")}.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((field) => {
          const current = values[field.key];
          const fallback = defaults[field.key];
          const overridden = current !== fallback;
          const needsFilling = isUnfilled(current);

          return (
            <div key={field.key}>
              <label className={label} htmlFor={`setting-${field.key}`}>
                {field.label}
                {overridden ? (
                  <span className="ml-1.5 font-normal normal-case tracking-normal text-gold-deep">
                    (overridden)
                  </span>
                ) : null}
                {needsFilling ? (
                  <span className="ml-1.5 font-normal normal-case tracking-normal text-amber-700">
                    (placeholder)
                  </span>
                ) : null}
              </label>
              <input
                id={`setting-${field.key}`}
                name={field.key}
                type={field.type}
                defaultValue={current}
                placeholder={fallback}
                className={`${input} ${needsFilling ? "border-amber-400 bg-amber-50/50" : ""}`}
                aria-describedby={`setting-${field.key}-hint`}
              />
              <p id={`setting-${field.key}-hint`} className="mt-1 text-[11px] text-navy/50">
                {field.hint}
                {overridden ? ` Code default: ${fallback}` : ""}
              </p>
            </div>
          );
        })}
      </div>

      <Feedback result={result} />

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={btnPrimary} disabled={pending || readOnly}>
          {pending ? "Saving…" : "Save business info"}
        </button>
        <p className="text-xs text-navy/50">
          Clearing a field falls back to the value in the code.
        </p>
      </div>
    </form>
  );
}
