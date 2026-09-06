"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  deletePhotoAction,
  removePhotoImageAction,
  reorderPhotoAction,
  savePhotoAction,
  togglePhotoPublishedAction,
} from "@/lib/admin/photo-actions";
import type { ActionResult } from "@/lib/admin/types";
import type { AdminPhoto, GalleryCategory, PhotoLocale } from "@/lib/photos";
import { ConfirmButton, Dialog, Feedback, useActionFeedback } from "./client-ui";
import { EmptyState, Panel, Pill } from "./ui";
import { btnGhost, btnGold, btnPrimary, btnTiny, input, label, select, textarea } from "./styles";

/**
 * Photo library screen. Every slot on the site is listed whether or not it has
 * been shot yet, so this doubles as the shoot checklist the owner works from.
 */

export type PhotoGroup = {
  key: string;
  title: string;
  hint: string;
  /** Set for the four gallery groups: enables reordering and category moves */
  category: GalleryCategory | null;
  photos: AdminPhoto[];
};

export type PhotosConfig = {
  maxBytes: number;
  mimeTypes: string[];
  locales: PhotoLocale[];
  localeLabels: Record<PhotoLocale, string>;
  liveLocales: PhotoLocale[];
  categories: { value: GalleryCategory; label: string }[];
};

export function PhotosManager({
  groups,
  config,
  readOnly,
}: {
  groups: PhotoGroup[];
  config: PhotosConfig;
  readOnly: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const all = groups.flatMap((g) => g.photos);
  const filled = all.filter((p) => p.previewSrc).length;
  const uploaded = all.filter((p) => p.uploaded).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-navy/60">
          {all.length} slots · {filled} showing an image ({uploaded} uploaded by you) ·{" "}
          {all.length - filled} still waiting for a photo
        </p>
        <button
          type="button"
          className={btnGold}
          onClick={() => setAddOpen(true)}
          disabled={readOnly}
        >
          Add a gallery photo
        </button>
      </div>

      {groups.map((group) => (
        <Panel key={group.key} title={group.title} hint={group.hint}>
          {group.photos.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              hint="Use “Add a gallery photo” to put your own photo in this category."
            />
          ) : (
            <ul className="space-y-3">
              {group.photos.map((photo, index) => (
                <PhotoCard
                  key={photo.ref}
                  photo={photo}
                  group={group}
                  config={config}
                  readOnly={readOnly}
                  isFirst={index === 0}
                  isLast={index === group.photos.length - 1}
                />
              ))}
            </ul>
          )}
        </Panel>
      ))}

      <AddPhotoDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        config={config}
        readOnly={readOnly}
      />
    </div>
  );
}

function PhotoCard({
  photo,
  group,
  config,
  readOnly,
  isFirst,
  isLast,
}: {
  photo: AdminPhoto;
  group: PhotoGroup;
  config: PhotosConfig;
  readOnly: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const { pending, result, run } = useActionFeedback();

  const isExtra = photo.slotKey === null;
  const altPreview = photo.alt.en || photo.codeAlt;

  return (
    <li className="rounded-md border border-navy/10 bg-white/60 p-3 sm:p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <PhotoThumb photo={photo} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg font-semibold text-navy">{photo.title}</span>
            {photo.slotKey ? <Pill tone="muted">{photo.slotKey}</Pill> : <Pill tone="muted">Extra</Pill>}
            {photo.uploaded ? (
              <Pill tone="gold">Uploaded</Pill>
            ) : photo.usingCodeDefault ? (
              <Pill>Built-in image</Pill>
            ) : (
              <Pill>Placeholder — not shot yet</Pill>
            )}
            {photo.published ? null : <Pill>Hidden</Pill>}
            {photo.consentNote ? <Pill tone="muted">Consent needed</Pill> : null}
          </div>

          <p className="mt-1.5 text-xs leading-relaxed text-navy/55">{photo.hint}</p>
          <p className="mt-1 text-[11px] text-navy/45">
            On the site: {photo.appearsOn.join(" · ")}
            {group.category ? ` · position ${photo.sortOrder}` : ""}
          </p>
          {altPreview ? (
            <p className="mt-1.5 line-clamp-2 text-[11px] italic text-navy/50">
              Alt (EN): {altPreview}
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] font-semibold text-amber-700">
              No alt text yet — add one for accessibility and SEO.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              className={btnTiny}
              disabled={readOnly}
              onClick={() => setUploadOpen(true)}
            >
              {photo.uploaded ? "Replace photo" : "Upload photo"}
            </button>
            <button
              type="button"
              className={btnTiny}
              disabled={readOnly}
              onClick={() => setEditOpen(true)}
            >
              Edit wording
            </button>

            {group.category ? (
              <>
                <button
                  type="button"
                  className={btnTiny}
                  disabled={readOnly || pending || isFirst}
                  aria-label={`Move ${photo.title} earlier`}
                  onClick={() =>
                    run(() => reorderPhotoAction(group.category as string, photo.ref, "up"))
                  }
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={btnTiny}
                  disabled={readOnly || pending || isLast}
                  aria-label={`Move ${photo.title} later`}
                  onClick={() =>
                    run(() => reorderPhotoAction(group.category as string, photo.ref, "down"))
                  }
                >
                  ↓
                </button>
              </>
            ) : null}

            {photo.previewSrc || !photo.published ? (
              <button
                type="button"
                className={btnTiny}
                disabled={readOnly || pending}
                title={
                  isExtra
                    ? "Hidden photos are kept but do not appear in the gallery."
                    : "Hidden slots fall back to their titled placeholder."
                }
                onClick={() => run(() => togglePhotoPublishedAction(photo.ref, !photo.published))}
              >
                {photo.published ? "Hide" : "Show"}
              </button>
            ) : null}

            {photo.uploaded ? (
              <ConfirmButton
                label="Remove photo"
                title="Remove this photo?"
                body={
                  isExtra
                    ? "The file is deleted from storage. The entry stays, but it will not appear on the site until you upload a new photo."
                    : "The file is deleted from storage and the slot goes back to its titled placeholder. Your wording is kept."
                }
                confirmLabel="Remove photo"
                onConfirm={() => removePhotoImageAction(photo.ref)}
                className={btnTiny}
                disabled={readOnly}
              />
            ) : null}

            {photo.rowId ? (
              <ConfirmButton
                label={isExtra ? "Delete" : "Reset"}
                title={isExtra ? "Delete this gallery photo?" : "Reset this slot?"}
                body={
                  isExtra
                    ? "The photo and all of its wording are deleted permanently."
                    : "Your uploaded file and wording for this slot are deleted, and the site goes back to the built-in default."
                }
                confirmLabel={isExtra ? "Delete" : "Reset"}
                onConfirm={() => deletePhotoAction(photo.ref)}
                disabled={readOnly}
              />
            ) : null}
          </div>

          <Feedback result={result} />
        </div>
      </div>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title={`Upload — ${photo.title}`}
        ref_={photo.ref}
        category={photo.category}
        config={config}
        readOnly={readOnly}
      />

      <EditPhotoDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        photo={photo}
        group={group}
        config={config}
      />
    </li>
  );
}

function PhotoThumb({ photo }: { photo: AdminPhoto }) {
  return (
    <div className="relative h-24 w-full shrink-0 overflow-hidden rounded border border-navy/15 bg-navy/5 sm:h-[84px] sm:w-32">
      {photo.previewSrc ? (
        <Image
          src={photo.previewSrc}
          alt=""
          fill
          sizes="128px"
          className="object-cover"
          unoptimized={photo.uploaded}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] font-semibold uppercase tracking-wideish text-navy/40">
          No photo
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Upload                                                                      */
/* -------------------------------------------------------------------------- */

type UploadState = { progress: number | null; result: ActionResult | null };

function useUpload() {
  const router = useRouter();
  const [state, setState] = useState<UploadState>({ progress: null, result: null });

  const reset = useCallback(() => setState({ progress: null, result: null }), []);

  const send = useCallback(
    (formData: FormData, onDone: (result: ActionResult) => void) => {
      setState({ progress: 0, result: null });

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/admin/photos/upload");

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        setState((s) => ({ ...s, progress: Math.round((event.loaded / event.total) * 100) }));
      };

      const finish = (result: ActionResult) => {
        setState({ progress: null, result });
        if (result.ok) router.refresh();
        onDone(result);
      };

      xhr.onload = () => {
        let message = "Photo uploaded.";
        let ok = xhr.status >= 200 && xhr.status < 300;
        try {
          const body = JSON.parse(xhr.responseText) as { ok?: boolean; message?: string };
          if (typeof body.message === "string") message = body.message;
          if (typeof body.ok === "boolean") ok = body.ok;
        } catch {
          if (!ok) message = `Upload failed (HTTP ${xhr.status}).`;
        }
        finish({ ok, message });
      };

      xhr.onerror = () =>
        finish({ ok: false, message: "The upload could not reach the server. Try again." });

      xhr.send(formData);
    },
    [router],
  );

  return { ...state, send, reset };
}

function fileProblem(file: File | null, config: PhotosConfig): string | null {
  if (!file) return "Choose a photo to upload.";
  if (!config.mimeTypes.includes(file.type)) return "Photos must be JPEG, PNG or WebP.";
  if (file.size > config.maxBytes) {
    return `That file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Keep photos under ${Math.round(
      config.maxBytes / (1024 * 1024),
    )} MB.`;
  }
  return null;
}

function UploadHint({ config }: { config: PhotosConfig }) {
  return (
    <p className="text-xs text-navy/55">
      JPEG, PNG or WebP · up to {Math.round(config.maxBytes / (1024 * 1024))} MB · landscape
      masters look best. Uploading replaces whatever is there now.
    </p>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="mt-3">
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-navy/10"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Upload progress"
      >
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-navy/55">
        {progress < 100 ? `Uploading… ${progress}%` : "Processing…"}
      </p>
    </div>
  );
}

function UploadDialog({
  open,
  onClose,
  title,
  ref_,
  category,
  config,
  readOnly,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  ref_: string;
  category: string;
  config: PhotosConfig;
  readOnly: boolean;
}) {
  const { progress, result, send, reset } = useUpload();
  const [local, setLocal] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const close = () => {
    reset();
    setLocal(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} title={title}>
      <form
        key={formKey}
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const file = data.get("file");
          const problem = fileProblem(file instanceof File && file.size ? file : null, config);
          if (problem) {
            setLocal(problem);
            return;
          }
          setLocal(null);
          data.set("ref", ref_);
          data.set("category", category);
          send(data, (res) => {
            if (res.ok) {
              setFormKey((k) => k + 1);
              close();
            }
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className={label} htmlFor={`upload-${ref_}`}>
            Photo file
          </label>
          <input
            id={`upload-${ref_}`}
            name="file"
            type="file"
            accept={config.mimeTypes.join(",")}
            className={`${input} py-1.5`}
            required
          />
        </div>

        <UploadHint config={config} />

        {local ? (
          <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {local}
          </p>
        ) : null}

        <Feedback result={result} />
        {progress !== null ? <ProgressBar progress={progress} /> : null}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={btnGhost} onClick={close}>
            Cancel
          </button>
          <button type="submit" className={btnPrimary} disabled={readOnly || progress !== null}>
            {progress !== null ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function AddPhotoDialog({
  open,
  onClose,
  config,
  readOnly,
}: {
  open: boolean;
  onClose: () => void;
  config: PhotosConfig;
  readOnly: boolean;
}) {
  const { progress, result, send, reset } = useUpload();
  const [local, setLocal] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const close = () => {
    reset();
    setLocal(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} title="Add a gallery photo">
      <form
        key={formKey}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const file = data.get("file");
          const problem = fileProblem(file instanceof File && file.size ? file : null, config);
          if (problem) {
            setLocal(problem);
            return;
          }
          if (!String(data.get("alt_en") ?? "").trim()) {
            setLocal("Write the English alt text — it is what screen readers and Google read.");
            return;
          }
          setLocal(null);
          data.set("ref", "");
          send(data, (res) => {
            if (res.ok) {
              setFormKey((k) => k + 1);
              close();
            }
          });
        }}
        className="space-y-3"
      >
        <p className="text-sm text-navy/65">
          This adds a photo to the gallery beyond the planned shot list. You can edit its wording,
          position and visibility afterwards like any other photo.
        </p>

        <div>
          <label className={label} htmlFor="add-photo-file">
            Photo file
          </label>
          <input
            id="add-photo-file"
            name="file"
            type="file"
            accept={config.mimeTypes.join(",")}
            className={`${input} py-1.5`}
            required
          />
        </div>

        <div>
          <label className={label} htmlFor="add-photo-category">
            Gallery category
          </label>
          <select id="add-photo-category" name="category" className={select} defaultValue="vehicle">
            {config.categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label} htmlFor="add-photo-alt">
            Alt text (English)
          </label>
          <textarea
            id="add-photo-alt"
            name="alt_en"
            className={textarea}
            placeholder="Describe what is in the photo, e.g. “The dark green vintage car outside the Hofburg at dusk”."
            required
          />
        </div>

        <UploadHint config={config} />

        {local ? (
          <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {local}
          </p>
        ) : null}

        <Feedback result={result} />
        {progress !== null ? <ProgressBar progress={progress} /> : null}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={btnGhost} onClick={close}>
            Cancel
          </button>
          <button type="submit" className={btnPrimary} disabled={readOnly || progress !== null}>
            {progress !== null ? "Uploading…" : "Add photo"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Wording                                                                     */
/* -------------------------------------------------------------------------- */

function EditPhotoDialog({
  open,
  onClose,
  photo,
  group,
  config,
}: {
  open: boolean;
  onClose: () => void;
  photo: AdminPhoto;
  group: PhotoGroup;
  config: PhotosConfig;
}) {
  const { pending, result, run } = useActionFeedback();
  const prefix = `photo-${photo.ref}`;
  const canChangeCategory = photo.inGallery;

  return (
    <Dialog open={open} onClose={onClose} title={`Wording — ${photo.title}`} width="max-w-2xl">
      <form
        className="space-y-4"
        action={(formData) =>
          run(async () => {
            const res = await savePhotoAction(formData);
            if (res.ok) onClose();
            return res;
          })
        }
      >
        <input type="hidden" name="ref" value={photo.ref} />

        <div>
          <label className={label} htmlFor={`${prefix}-title`}>
            Shot title (internal)
          </label>
          <input
            id={`${prefix}-title`}
            name="title"
            type="text"
            className={input}
            defaultValue={photo.title}
            placeholder={photo.codeTitle}
          />
          <p className="mt-1 text-[11px] text-navy/50">
            Used in this dashboard and your shoot brief only. Guests never see it, so it stays in
            one language.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {canChangeCategory ? (
            <div>
              <label className={label} htmlFor={`${prefix}-category`}>
                Gallery category
              </label>
              <select
                id={`${prefix}-category`}
                name="category"
                className={select}
                defaultValue={photo.category}
              >
                {config.categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className={label} htmlFor={`${prefix}-order`}>
              Position
            </label>
            <input
              id={`${prefix}-order`}
              name="sort_order"
              type="number"
              min={1}
              max={9999}
              className={input}
              defaultValue={photo.sortOrder}
            />
            <p className="mt-1 text-[11px] text-navy/50">
              {group.category ? "Lower numbers come first." : "Not used outside the gallery."}
            </p>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                name="published"
                defaultChecked={photo.published}
                className="h-4 w-4 accent-navy"
              />
              Show on the site
            </label>
          </div>
        </div>

        <fieldset className="space-y-4 rounded border border-navy/15 bg-white px-3 py-3">
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-wideish text-navy/55">
            Guest-facing wording
          </legend>
          <p className="text-[11px] text-navy/55">
            Alt text describes the photo for screen readers and search engines. The caption is the
            small line shown under the photo on the site — leave it empty to keep the wording that
            ships with the site.
          </p>

          {config.locales.map((locale) => (
            <div key={locale} className="space-y-2 border-t border-navy/10 pt-3 first:border-0 first:pt-0">
              <p className="text-xs font-semibold text-navy">
                {config.localeLabels[locale]}
                <span className="ml-1.5 font-normal text-navy/45">
                  {config.liveLocales.includes(locale) ? "live" : "ready for launch"}
                </span>
              </p>
              <div>
                <label className={label} htmlFor={`${prefix}-alt-${locale}`}>
                  Alt text
                </label>
                <textarea
                  id={`${prefix}-alt-${locale}`}
                  name={`alt_${locale}`}
                  className={`${textarea} min-h-[60px]`}
                  defaultValue={photo.alt[locale]}
                  placeholder={locale === "en" ? photo.codeAlt : undefined}
                />
              </div>
              <div>
                <label className={label} htmlFor={`${prefix}-caption-${locale}`}>
                  Caption
                </label>
                <textarea
                  id={`${prefix}-caption-${locale}`}
                  name={`caption_${locale}`}
                  className={`${textarea} min-h-[60px]`}
                  defaultValue={photo.caption[locale]}
                />
              </div>
            </div>
          ))}
        </fieldset>

        <Feedback result={result} />

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={btnGhost} onClick={onClose}>
            Close
          </button>
          <button type="submit" className={btnPrimary} disabled={pending}>
            {pending ? "Saving…" : "Save wording"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
