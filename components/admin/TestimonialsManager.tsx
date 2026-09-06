"use client";

import { useState } from "react";
import {
  createTestimonialAction,
  deleteTestimonialAction,
  reorderTestimonialAction,
  toggleTestimonialFlagAction,
  updateTestimonialAction,
} from "@/lib/admin/content-actions";
import type { AdminTestimonial } from "@/lib/admin/types";
import { formatTimestamp } from "@/lib/admin/format";
import { ConfirmButton, Dialog, Feedback, useActionFeedback } from "./client-ui";
import { EmptyState, Pill } from "./ui";
import {
  btnGhost,
  btnGold,
  btnPrimary,
  btnTiny,
  input,
  label,
  select,
  textarea,
} from "./styles";

const LOCALES = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
  { value: "it", label: "Italiano" },
  { value: "ar", label: "العربية" },
  { value: "zh", label: "中文" },
  { value: "pt", label: "Português" },
  { value: "tr", label: "Türkçe" },
];

export function TestimonialsManager({
  testimonials,
  readOnly,
}: {
  testimonials: AdminTestimonial[];
  readOnly: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const sampleCount = testimonials.filter((t) => t.is_sample).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-navy/60">
          {testimonials.length} testimonial{testimonials.length === 1 ? "" : "s"}
          {sampleCount > 0 ? ` · ${sampleCount} seeded sample${sampleCount === 1 ? "" : "s"}` : ""}
          {" · "}
          {testimonials.filter((t) => t.published).length} published
        </p>
        <button
          type="button"
          className={btnGold}
          onClick={() => setAddOpen(true)}
          disabled={readOnly}
        >
          Add testimonial
        </button>
      </div>

      {testimonials.length === 0 ? (
        <EmptyState
          title="No testimonials yet"
          hint="Add a quote from a happy guest. Only published ones show on the public site."
        />
      ) : (
        <ul className="space-y-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCardRow
              key={testimonial.id}
              testimonial={testimonial}
              readOnly={readOnly}
              isFirst={index === 0}
              isLast={index === testimonials.length - 1}
            />
          ))}
        </ul>
      )}

      <TestimonialDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a testimonial"
        submitLabel="Add testimonial"
        onSubmit={createTestimonialAction}
        resetOnSuccess
      />
    </div>
  );
}

function TestimonialCardRow({
  testimonial,
  readOnly,
  isFirst,
  isLast,
}: {
  testimonial: AdminTestimonial;
  readOnly: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const { pending, result, run } = useActionFeedback();

  return (
    <li className="rounded-md border border-navy/10 bg-cream-soft p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg font-semibold text-navy">
              {testimonial.author_name}
            </span>
            <span aria-label={`${testimonial.rating} out of 5`} className="text-sm text-gold-deep">
              {"★".repeat(testimonial.rating)}
              <span className="text-navy/20">{"★".repeat(5 - testimonial.rating)}</span>
            </span>
            <Pill tone="muted">{testimonial.locale.toUpperCase()}</Pill>
            {testimonial.published ? <Pill tone="gold">Published</Pill> : <Pill>Draft</Pill>}
            {testimonial.featured ? <Pill tone="gold">Featured</Pill> : null}
            {testimonial.is_sample ? <Pill tone="muted">Sample row</Pill> : null}
          </div>
          <blockquote className="mt-2 max-w-3xl text-sm italic text-navy/80">
            “{testimonial.quote}”
          </blockquote>
          <p className="mt-1.5 text-[11px] text-navy/45">
            Position {testimonial.sort_order || "—"} · added {formatTimestamp(testimonial.created_at)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex gap-1">
            <button
              type="button"
              className={btnTiny}
              disabled={readOnly || pending || isFirst}
              aria-label={`Move ${testimonial.author_name} up`}
              onClick={() => run(() => reorderTestimonialAction(testimonial.id, "up"))}
            >
              ↑
            </button>
            <button
              type="button"
              className={btnTiny}
              disabled={readOnly || pending || isLast}
              aria-label={`Move ${testimonial.author_name} down`}
              onClick={() => run(() => reorderTestimonialAction(testimonial.id, "down"))}
            >
              ↓
            </button>
          </div>

          <div className="flex flex-wrap justify-end gap-1">
            <button
              type="button"
              className={btnTiny}
              disabled={readOnly || pending}
              onClick={() =>
                run(() =>
                  toggleTestimonialFlagAction(
                    testimonial.id,
                    "published",
                    !testimonial.published,
                  ),
                )
              }
            >
              {testimonial.published ? "Unpublish" : "Publish"}
            </button>
            <button
              type="button"
              className={btnTiny}
              disabled={readOnly || pending}
              onClick={() =>
                run(() =>
                  toggleTestimonialFlagAction(testimonial.id, "featured", !testimonial.featured),
                )
              }
            >
              {testimonial.featured ? "Unfeature" : "Feature"}
            </button>
            <button
              type="button"
              className={btnTiny}
              disabled={readOnly}
              onClick={() => setEditOpen(true)}
            >
              Edit
            </button>
            <ConfirmButton
              label="Delete"
              title="Delete this testimonial?"
              body={`“${testimonial.quote.slice(0, 90)}${
                testimonial.quote.length > 90 ? "…" : ""
              }” by ${testimonial.author_name} will be removed permanently.`}
              confirmLabel="Delete"
              onConfirm={() => deleteTestimonialAction(testimonial.id)}
              className="inline-flex items-center rounded border border-red-300 bg-white px-2 py-1 text-xs font-semibold text-red-700 transition hover:border-red-500 hover:bg-red-50 disabled:opacity-50"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      <Feedback result={result} />

      <TestimonialDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit ${testimonial.author_name}`}
        submitLabel="Save changes"
        onSubmit={updateTestimonialAction}
        testimonial={testimonial}
      />
    </li>
  );
}

function TestimonialDialog({
  open,
  onClose,
  title,
  submitLabel,
  onSubmit,
  testimonial,
  resetOnSuccess,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  onSubmit: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
  testimonial?: AdminTestimonial;
  resetOnSuccess?: boolean;
}) {
  const { pending, result, run } = useActionFeedback();
  const [formKey, setFormKey] = useState(0);
  const prefix = testimonial ? `t-${testimonial.id}` : "t-new";

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <form
        key={formKey}
        className="space-y-3"
        action={(formData) => {
          run(async () => {
            const res = await onSubmit(formData);
            if (res.ok) {
              if (resetOnSuccess) setFormKey((k) => k + 1);
              else onClose();
            }
            return res;
          });
        }}
      >
        {testimonial ? <input type="hidden" name="id" value={testimonial.id} /> : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={label} htmlFor={`${prefix}-author`}>
              Guest name
            </label>
            <input
              id={`${prefix}-author`}
              name="author_name"
              type="text"
              required
              defaultValue={testimonial?.author_name}
              className={input}
              placeholder="Anna K."
            />
          </div>
          <div>
            <label className={label} htmlFor={`${prefix}-rating`}>
              Rating
            </label>
            <select
              id={`${prefix}-rating`}
              name="rating"
              defaultValue={String(testimonial?.rating ?? 5)}
              className={select}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={label} htmlFor={`${prefix}-quote`}>
            Quote
          </label>
          <textarea
            id={`${prefix}-quote`}
            name="quote"
            required
            defaultValue={testimonial?.quote}
            className={`${textarea} min-h-[110px]`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor={`${prefix}-locale`}>
              Language
            </label>
            <select
              id={`${prefix}-locale`}
              name="locale"
              defaultValue={testimonial?.locale ?? "en"}
              className={select}
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor={`${prefix}-order`}>
              Position
            </label>
            <input
              id={`${prefix}-order`}
              name="sort_order"
              type="number"
              min={0}
              defaultValue={testimonial?.sort_order ?? 0}
              className={input}
            />
          </div>
        </div>

        <fieldset className="rounded border border-navy/15 bg-white px-3 py-2.5">
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-wideish text-navy/55">
            Visibility
          </legend>
          <label className="flex items-center gap-2 py-1 text-sm">
            <input
              type="checkbox"
              name="published"
              defaultChecked={testimonial?.published ?? false}
              className="h-4 w-4 accent-navy"
            />
            Published — show on the public site
          </label>
          <label className="flex items-center gap-2 py-1 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={testimonial?.featured ?? false}
              className="h-4 w-4 accent-navy"
            />
            Featured — highlight ahead of the others
          </label>
        </fieldset>

        <Feedback result={result} />

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={btnGhost} onClick={onClose}>
            Close
          </button>
          <button type="submit" className={btnPrimary} disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
