import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-env";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.name || !body?.email || !body?.message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Placeholder env values behave like "no backend", matching /api/bookings.
  const supabase = supabaseConfigured() ? getSupabaseServer() : null;
  if (!supabase) {
    return NextResponse.json({
      id: `demo_contact_${Date.now().toString(36)}`,
      demo: true,
    });
  }

  const { data, error } = await supabase
    .from("contact_submissions")
    .insert({
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      message: String(body.message).trim(),
    })
    .select("id")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not save message" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
