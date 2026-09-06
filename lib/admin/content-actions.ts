"use server";

import { revalidatePath } from "next/cache";
import { bool, dbFailure, failure, num, requireAdmin, str, success } from "./guard";
import {
  MESSAGE_STATUSES,
  type ActionResult,
  type MessageStatus,
} from "./types";

const LOCALES = ["en", "de", "es", "it", "ar", "zh", "pt", "tr"];

function refreshTestimonials() {
  revalidatePath("/admin/testimonials");
  revalidatePath("/", "layout");
}

function validateTestimonial(formData: FormData): string | null {
  if (!str(formData, "author_name")) return "Enter the guest's name.";
  if (!str(formData, "quote")) return "Enter the quote.";

  const rating = num(formData, "rating");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return "Rating must be a whole number from 1 to 5.";
  }
  if (!LOCALES.includes(str(formData, "locale"))) return "Choose a language.";
  return null;
}

export async function createTestimonialAction(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  const invalid = validateTestimonial(formData);
  if (invalid) return failure(invalid);

  const { error } = await gate.supabase.from("testimonials").insert({
    author_name: str(formData, "author_name"),
    quote: str(formData, "quote"),
    rating: num(formData, "rating"),
    locale: str(formData, "locale"),
    published: bool(formData, "published"),
    featured: bool(formData, "featured"),
    sort_order: Number.isFinite(num(formData, "sort_order")) ? num(formData, "sort_order") : 0,
    is_sample: false,
  });

  if (error) return dbFailure("Could not add the testimonial", error);

  refreshTestimonials();
  return success("Testimonial added.");
}

export async function updateTestimonialAction(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  const id = str(formData, "id");
  if (!id) return failure("Missing testimonial id.");

  const invalid = validateTestimonial(formData);
  if (invalid) return failure(invalid);

  const { error } = await gate.supabase
    .from("testimonials")
    .update({
      author_name: str(formData, "author_name"),
      quote: str(formData, "quote"),
      rating: num(formData, "rating"),
      locale: str(formData, "locale"),
      published: bool(formData, "published"),
      featured: bool(formData, "featured"),
      sort_order: Number.isFinite(num(formData, "sort_order")) ? num(formData, "sort_order") : 0,
    })
    .eq("id", id);

  if (error) return dbFailure("Could not save the testimonial", error);

  refreshTestimonials();
  return success("Testimonial saved.");
}

export async function toggleTestimonialFlagAction(
  id: string,
  field: "published" | "featured",
  value: boolean,
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  if (!id) return failure("Missing testimonial id.");
  if (field !== "published" && field !== "featured") return failure("Unknown field.");

  const { error } = await gate.supabase
    .from("testimonials")
    .update({ [field]: value })
    .eq("id", id);

  if (error) return dbFailure(`Could not update ${field}`, error);

  refreshTestimonials();
  return success(value ? `Marked as ${field}.` : `Removed from ${field}.`);
}

/** Swaps sort_order with the neighbouring row so the list can be reordered. */
export async function reorderTestimonialAction(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  const { data, error } = await gate.supabase
    .from("testimonials")
    .select("id, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return dbFailure("Could not reorder", error);

  const rows = data as { id: string; sort_order: number }[];
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return failure("That testimonial no longer exists.");

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= rows.length) return success("Already at the end.");

  // Rewrite the whole list so duplicate/zeroed sort_order values self-heal.
  const reordered = [...rows];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];

  for (let i = 0; i < reordered.length; i += 1) {
    const { error: updateError } = await gate.supabase
      .from("testimonials")
      .update({ sort_order: i + 1 })
      .eq("id", reordered[i].id);
    if (updateError) return dbFailure("Could not reorder", updateError);
  }

  refreshTestimonials();
  return success("Order updated.");
}

export async function deleteTestimonialAction(id: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  if (!id) return failure("Missing testimonial id.");

  const { error } = await gate.supabase.from("testimonials").delete().eq("id", id);
  if (error) return dbFailure("Could not delete the testimonial", error);

  refreshTestimonials();
  return success("Testimonial deleted.");
}

export async function setMessageStatusAction(
  id: string,
  status: MessageStatus,
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  if (!id) return failure("Missing message id.");
  if (!MESSAGE_STATUSES.includes(status)) return failure("Unknown status.");

  const { error } = await gate.supabase
    .from("contact_submissions")
    .update({ status })
    .eq("id", id);

  if (error) return dbFailure("Could not update the message", error);

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return success(`Marked as ${status}.`);
}

export async function deleteMessageAction(id: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.result;

  if (!id) return failure("Missing message id.");

  const { error } = await gate.supabase.from("contact_submissions").delete().eq("id", id);
  if (error) return dbFailure("Could not delete the message", error);

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return success("Message deleted.");
}
