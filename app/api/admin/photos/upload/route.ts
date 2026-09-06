import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultSortOrder,
  isGalleryCategory,
  photoSlot,
  PHOTO_BUCKET,
  PHOTO_EXTENSIONS,
  PHOTO_MAX_BYTES,
  PHOTO_MIME_TYPES,
  PHOTO_SLOTS,
} from "@/lib/photos";
import { requireAdmin } from "@/lib/admin/guard";
import type { SitePhotoRow } from "@/lib/admin/types";

/**
 * Photo upload for /admin/photos.
 *
 * A route handler rather than a Server Action: Server Action bodies are capped
 * at 1 MB by default, and an XHR upload here gives the owner a real progress
 * bar. Auth is the same requireAdmin() gate the actions use, re-checked here
 * because this endpoint is reachable by direct POST.
 *
 * Body: multipart/form-data with
 *   file      — jpeg / png / webp, max 10 MB
 *   ref       — `slot:<key>` for a predefined slot, a row id to replace, or
 *               empty when adding a brand-new gallery photo
 *   category  — required when adding a new gallery photo
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MB = Math.round(PHOTO_MAX_BYTES / (1024 * 1024));

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function safeSegment(value: string): string {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "photo";
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, message: gate.result.message }, { status: 403 });
  }
  const supabase = gate.supabase;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return bad("That upload did not arrive intact. Try again.");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return bad("Choose a photo to upload.");
  }

  if (!(PHOTO_MIME_TYPES as readonly string[]).includes(file.type)) {
    return bad("Photos must be JPEG, PNG or WebP.");
  }

  if (file.size > PHOTO_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return bad(`That file is ${mb} MB. Please keep photos under ${MAX_MB} MB.`);
  }

  const ref = String(formData.get("ref") ?? "").trim();
  const requestedCategory = String(formData.get("category") ?? "").trim();

  const slotKey = ref.startsWith("slot:") ? ref.slice("slot:".length) : null;
  const rowId = ref && !slotKey ? ref : null;

  if (slotKey && !photoSlot(slotKey)) return bad("Unknown photo slot.");

  // Find the row we are replacing, if any, so its old file can be cleaned up.
  let existing: SitePhotoRow | null = null;
  if (rowId || slotKey) {
    const query = supabase.from("site_photos").select("*").limit(1);
    const { data, error } = rowId
      ? await query.eq("id", rowId)
      : await query.eq("slot_key", slotKey);

    if (error) return bad(`Could not look up that photo: ${error.message}`, 500);
    existing = ((data ?? [])[0] as SitePhotoRow | undefined) ?? null;
    if (rowId && !existing) return bad("That photo no longer exists.", 404);
  }

  const slot = slotKey ? photoSlot(slotKey) : null;
  const category =
    slot?.category ??
    (isGalleryCategory(requestedCategory)
      ? requestedCategory
      : existing && isGalleryCategory(existing.category)
        ? existing.category
        : null);

  if (!category) return bad("Choose which gallery category this photo belongs to.");

  const extension = PHOTO_EXTENSIONS[file.type] ?? "jpg";
  const folder = safeSegment(slotKey ?? `gallery-${category}`);
  const storagePath = `${folder}/${Date.now().toString(36)}-${safeSegment(
    file.name.replace(/\.[^.]+$/, "").slice(0, 40),
  )}.${extension}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    const detail = uploadError.message;
    if (/bucket not found|not found/i.test(detail)) {
      return bad(
        `Supabase Storage has no “${PHOTO_BUCKET}” bucket yet. Create a public bucket with that name (Storage → New bucket) or run supabase/schema.sql.`,
        500,
      );
    }
    return bad(`Upload failed: ${detail}`, 500);
  }

  const now = new Date().toISOString();
  const write = existing
    ? await supabase
        .from("site_photos")
        .update({ storage_path: storagePath, category, updated_at: now })
        .eq("id", existing.id)
    : await supabase.from("site_photos").insert({
        slot_key: slotKey,
        category,
        storage_path: storagePath,
        title: slot?.title ?? null,
        alt_en: String(formData.get("alt_en") ?? "").trim() || slot?.alt || null,
        sort_order: slotKey
          ? defaultSortOrder(slotKey)
          : await nextSortOrder(supabase, category),
        published: true,
        created_at: now,
        updated_at: now,
      });

  if (write.error) {
    // Do not leave the file orphaned if the row could not be written.
    await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
    const detail = write.error.message;
    if (/does not exist|schema cache/i.test(detail)) {
      return bad(
        "The site_photos table is missing. Run supabase/schema.sql in the Supabase SQL editor, then try again.",
        500,
      );
    }
    return bad(`Could not save the photo: ${detail}`, 500);
  }

  if (existing?.storage_path && existing.storage_path !== storagePath) {
    try {
      await supabase.storage.from(PHOTO_BUCKET).remove([existing.storage_path]);
    } catch {
      // An orphaned old file is harmless; the row already points at the new one.
    }
  }

  revalidatePath("/admin/photos");
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, message: "Photo uploaded." });
}

/** Extra gallery photos land after every predefined slot in their category. */
async function nextSortOrder(supabase: SupabaseClient, category: string): Promise<number> {
  const { data } = await supabase
    .from("site_photos")
    .select("sort_order")
    .eq("category", category)
    .order("sort_order", { ascending: false })
    .limit(1);

  const rows = (data ?? []) as { sort_order: number }[];
  return Math.max(rows[0]?.sort_order ?? 0, PHOTO_SLOTS.length) + 1;
}
