"use server";

import { revalidatePath } from "next/cache";
import { TOURS, type TourType } from "@/lib/tours";
import { SITE_SETTING_KEYS } from "@/lib/site-settings";
import { bool, dbFailure, failure, num, requireAdmin, str, success } from "./guard";
import type { ActionResult } from "./types";

/** Writes one tour_settings row, creating it if the tier has no override yet. */
export async function saveTourSettingAction(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  const tourType = str(formData, "tour_type") as TourType;
  if (!TOURS.some((t) => t.id === tourType)) return failure("Unknown tour tier.");

  const price = num(formData, "price_eur");
  if (!Number.isFinite(price) || price < 0) return failure("Enter a price of 0 or more.");

  const minGuests = num(formData, "min_guests");
  if (!Number.isInteger(minGuests) || minGuests < 1 || minGuests > 8) {
    return failure("Minimum guests must be between 1 and 8.");
  }

  const { error } = await gate.supabase.from("tour_settings").upsert(
    {
      tour_type: tourType,
      price_eur: price,
      min_guests: minGuests,
      active: bool(formData, "active"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tour_type" },
  );

  if (error) return dbFailure("Could not save the tier", error);

  revalidatePath("/admin/tours");
  revalidatePath("/", "layout");
  return success(`${tourType} saved.`);
}

/** Drops the override so the tier falls back to the value in lib/tours.ts. */
export async function resetTourSettingAction(tourType: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  if (!TOURS.some((t) => t.id === tourType)) return failure("Unknown tour tier.");

  const { error } = await gate.supabase
    .from("tour_settings")
    .delete()
    .eq("tour_type", tourType);

  if (error) return dbFailure("Could not reset the tier", error);

  revalidatePath("/admin/tours");
  revalidatePath("/", "layout");
  return success(`${tourType} reset to the code default.`);
}

export async function saveSiteSettingsAction(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  const now = new Date().toISOString();
  const rows = SITE_SETTING_KEYS.map((key) => ({
    key,
    value: str(formData, key) || null,
    updated_at: now,
  }));

  const email = str(formData, "contact_email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return failure("That contact email does not look valid.");
  }

  for (const key of ["instagram_url", "facebook_url", "google_business_url"] as const) {
    const value = str(formData, key);
    if (value && !/^https?:\/\//i.test(value)) {
      return failure("Links must start with http:// or https://.");
    }
  }

  const { error } = await gate.supabase
    .from("site_settings")
    .upsert(rows, { onConflict: "key" });

  if (error) return dbFailure("Could not save your settings", error);

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return success("Business info saved.");
}
