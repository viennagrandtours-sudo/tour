"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAction, isSupabaseConfigured } from "@/lib/supabase-server";

export type SignInState = { error: string | null };

const SAFE_NEXT = /^\/admin(\/[\w\-/]*)?$/;

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const requested = String(formData.get("next") ?? "");
  const next = SAFE_NEXT.test(requested) ? requested : "/admin";

  if (!email || !password) {
    return { error: "Enter both your email and password." };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured, so there is no account to sign in to. The dashboard is running in demo mode — go straight to /admin.",
    };
  }

  const supabase = createSupabaseAction();
  if (!supabase) {
    return { error: "Supabase is not configured on the server." };
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Supabase returns the same error for wrong password and unknown user,
      // which is what we want to surface — no account enumeration.
      return { error: "That email and password combination did not work." };
    }
  } catch {
    return {
      error: "Could not reach Supabase. Check your connection and NEXT_PUBLIC_SUPABASE_URL.",
    };
  }

  revalidatePath("/admin", "layout");
  redirect(next);
}

export async function signOutAction(): Promise<void> {
  const supabase = createSupabaseAction();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Cookie is cleared by the redirect either way.
    }
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}
