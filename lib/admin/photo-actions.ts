"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isGalleryCategory,
  isPhotoCategory,
  photoSlot,
  PHOTO_BUCKET,
  PHOTO_LOCALES,
  PHOTO_SLOTS,
} from "@/lib/photos";
import { bool, dbFailure, failure, num, requireAdmin, str, success } from "./guard";
import type { ActionResult, SitePhotoRow } from "./types";

/**
 * Writes for /admin/photos. Text, ordering, visibility and deletion live here;
 * the binary upload goes through app/api/admin/photos/upload/route.ts because a
 * 10 MB file is a poor fit for a Server Action body.
 *
 * Every action re-checks requireAdmin(): Server Actions are reachable by direct
 * POST, so the screen being behind middleware is not enough.
 */

function refreshPhotos(): void {
  revalidatePath("/admin/photos");
  revalidatePath("/", "layout");
}

/**
 * Cards are addressed by a ref: a row id, or `slot:<key>` for a predefined slot
 * that has no row yet (nothing has been uploaded or edited on it).
 */
type PhotoTarget = { rowId: string | null; slotKey: string | null };

function parseRef(ref: string): PhotoTarget | null {
  if (!ref) return null;

  if (ref.startsWith("slot:")) {
    const slotKey = ref.slice("slot:".length);
    return photoSlot(slotKey) ? { rowId: null, slotKey } : null;
  }

  return { rowId: ref, slotKey: null };
}

async function findRow(
  supabase: SupabaseClient,
  target: PhotoTarget,
): Promise<{ row: SitePhotoRow | null; error: { message: string } | null }> {
  const query = supabase.from("site_photos").select("*").limit(1);
  const { data, error } = target.rowId
    ? await query.eq("id", target.rowId)
    : await query.eq("slot_key", target.slotKey);

  if (error) return { row: null, error };
  return { row: ((data ?? [])[0] as SitePhotoRow | undefined) ?? null, error: null };
}

/** Removes the file behind a row. Storage errors are non-fatal: the row matters more. */
async function removeStorageObject(
  supabase: SupabaseClient,
  storagePath: string | null | undefined,
): Promise<void> {
  if (!storagePath) return;
  try {
    await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
  } catch {
    // The row is what the site reads; an orphaned file is harmless.
  }
}

type PhotoText = Record<string, string | null>;

function textFields(formData: FormData): PhotoText {
  const out: PhotoText = {};
  for (const locale of PHOTO_LOCALES) {
    out[`alt_${locale}`] = str(formData, `alt_${locale}`) || null;
    out[`caption_${locale}`] = str(formData, `caption_${locale}`) || null;
  }
  return out;
}

/**
 * Saves the wording, category, position and visibility of one photo. Creates the
 * row on first edit of a predefined slot; never touches storage_path.
 */
export async function savePhotoAction(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  const target = parseRef(str(formData, "ref"));
  if (!target) return failure("Unknown photo.");

  // A slot that already has a row is addressed by row id, so the slot it
  // belongs to comes from the row rather than the ref.
  let slotKey = target.slotKey;
  if (target.rowId) {
    const { row, error } = await findRow(gate.supabase, target);
    if (error) return dbFailure("Could not load the photo", error);
    if (!row) return failure("That photo no longer exists.");
    slotKey = row.slot_key;
  }

  const slot = slotKey ? photoSlot(slotKey) : null;
  if (slotKey && !slot) return failure("Unknown photo slot.");

  // Extra gallery photos have no code default to fall back on, so their alt
  // text is the only description a screen reader will ever get.
  if (!slot && !str(formData, "alt_en")) {
    return failure("English alt text is required — it is what screen readers and Google read.");
  }

  const sortOrder = num(formData, "sort_order");
  if (!Number.isInteger(sortOrder) || sortOrder < 1 || sortOrder > 9999) {
    return failure("Position must be a whole number between 1 and 9999.");
  }

  const payload: Record<string, unknown> = {
    title: str(formData, "title") || null,
    ...textFields(formData),
    sort_order: sortOrder,
    published: bool(formData, "published"),
    updated_at: new Date().toISOString(),
  };

  // Only gallery photos may change category — moving the hero or a route map
  // into a gallery filter would be meaningless.
  const requested = str(formData, "category");
  const galleryEditable = slot ? slot.inGallery : true;
  if (galleryEditable && requested) {
    if (!isGalleryCategory(requested)) return failure("Choose a gallery category.");
    payload.category = requested;
  } else if (slot) {
    payload.category = slot.category;
  }

  if (target.rowId) {
    const { error } = await gate.supabase
      .from("site_photos")
      .update(payload)
      .eq("id", target.rowId);
    if (error) return dbFailure("Could not save the photo", error);
  } else {
    const { error } = await gate.supabase.from("site_photos").upsert(
      {
        slot_key: slotKey,
        category: payload.category ?? slot?.category ?? "site",
        sort_order: sortOrder,
        ...payload,
      },
      { onConflict: "slot_key" },
    );
    if (error) return dbFailure("Could not save the photo", error);
  }

  refreshPhotos();
  return success("Photo details saved.");
}

/** Removes the uploaded file so the slot falls back to its titled placeholder. */
export async function removePhotoImageAction(ref: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  const target = parseRef(ref);
  if (!target) return failure("Unknown photo.");

  const { row, error } = await findRow(gate.supabase, target);
  if (error) return dbFailure("Could not load the photo", error);
  if (!row) return failure("There is no uploaded photo on this slot yet.");
  if (!row.storage_path) return failure("There is no uploaded photo on this slot yet.");

  await removeStorageObject(gate.supabase, row.storage_path);

  const { error: updateError } = await gate.supabase
    .from("site_photos")
    .update({ storage_path: null, updated_at: new Date().toISOString() })
    .eq("id", row.id);

  if (updateError) return dbFailure("Could not remove the photo", updateError);

  refreshPhotos();
  return success("Photo removed — the slot shows its titled placeholder again.");
}

/**
 * Deletes the row and its file. A predefined slot reverts to the code default;
 * an extra gallery photo disappears for good.
 */
export async function deletePhotoAction(ref: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  const target = parseRef(ref);
  if (!target) return failure("Unknown photo.");

  const { row, error } = await findRow(gate.supabase, target);
  if (error) return dbFailure("Could not load the photo", error);
  if (!row) return failure("Nothing to delete — this slot is still using the code default.");

  await removeStorageObject(gate.supabase, row.storage_path);

  const { error: deleteError } = await gate.supabase
    .from("site_photos")
    .delete()
    .eq("id", row.id);

  if (deleteError) return dbFailure("Could not delete the photo", deleteError);

  refreshPhotos();
  return success(
    row.slot_key
      ? "Reset to the built-in default for that slot."
      : "Gallery photo deleted.",
  );
}

/** Publish / hide without deleting anything. */
export async function togglePhotoPublishedAction(
  ref: string,
  published: boolean,
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  const target = parseRef(ref);
  if (!target) return failure("Unknown photo.");

  const { row, error } = await findRow(gate.supabase, target);
  if (error) return dbFailure("Could not load the photo", error);

  if (!row) {
    if (!target.slotKey) return failure("Unknown photo.");
    const slot = photoSlot(target.slotKey);
    const { error: insertError } = await gate.supabase.from("site_photos").upsert(
      {
        slot_key: target.slotKey,
        category: slot?.category ?? "site",
        published,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slot_key" },
    );
    if (insertError) return dbFailure("Could not update visibility", insertError);
  } else {
    const { error: updateError } = await gate.supabase
      .from("site_photos")
      .update({ published, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (updateError) return dbFailure("Could not update visibility", updateError);
  }

  refreshPhotos();
  return success(published ? "Photo is live on the site." : "Photo hidden from the site.");
}

/**
 * Moves a gallery photo one place up or down inside its category. Rewrites
 * sort_order for the whole category so duplicate and zeroed values self-heal,
 * creating rows for slots that have never been edited.
 */
export async function reorderPhotoAction(
  category: string,
  ref: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  if (!isGalleryCategory(category)) return failure("Only gallery photos can be reordered.");

  const target = parseRef(ref);
  if (!target) return failure("Unknown photo.");

  const { data, error } = await gate.supabase
    .from("site_photos")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return dbFailure("Could not reorder the gallery", error);

  const rows = (data ?? []) as SitePhotoRow[];
  const rowBySlot = new Map(rows.filter((r) => r.slot_key).map((r) => [r.slot_key as string, r]));

  type Entry = { rowId: string | null; slotKey: string | null; order: number; fallback: number };
  const entries: Entry[] = [];

  PHOTO_SLOTS.forEach((slot, index) => {
    if (!slot.inGallery) return;
    const row = rowBySlot.get(slot.key);
    const effective = row && isPhotoCategory(row.category) ? row.category : slot.category;
    if (effective !== category) return;

    entries.push({
      rowId: row?.id ?? null,
      slotKey: slot.key,
      order: row?.sort_order || index + 1,
      fallback: index,
    });
  });

  rows
    .filter((row) => !row.slot_key && row.category === category)
    .forEach((row, index) => {
      entries.push({
        rowId: row.id,
        slotKey: null,
        order: row.sort_order || PHOTO_SLOTS.length + index + 1,
        fallback: PHOTO_SLOTS.length + index,
      });
    });

  entries.sort((a, b) => a.order - b.order || a.fallback - b.fallback);

  const index = entries.findIndex((entry) =>
    target.rowId ? entry.rowId === target.rowId : entry.slotKey === target.slotKey,
  );
  if (index === -1) return failure("That photo is no longer in this category.");

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= entries.length) return success("Already at the end.");

  [entries[index], entries[swapWith]] = [entries[swapWith], entries[index]];

  const now = new Date().toISOString();
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const sortOrder = i + 1;

    if (entry.rowId) {
      const { error: updateError } = await gate.supabase
        .from("site_photos")
        .update({ sort_order: sortOrder, updated_at: now })
        .eq("id", entry.rowId);
      if (updateError) return dbFailure("Could not reorder the gallery", updateError);
    } else {
      const { error: insertError } = await gate.supabase.from("site_photos").upsert(
        {
          slot_key: entry.slotKey,
          category,
          sort_order: sortOrder,
          updated_at: now,
        },
        { onConflict: "slot_key" },
      );
      if (insertError) return dbFailure("Could not reorder the gallery", insertError);
    }
  }

  refreshPhotos();
  return success("Gallery order updated.");
}
