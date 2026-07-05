import { verifyAdminRequest } from "@/lib/admin/verifyAdmin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const verified = await verifyAdminRequest(request);
  if ("error" in verified && verified.error) return verified.error;

  const { supabase } = verified;

  const { data, error } = await supabase!
    .from("robot_waitlist")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}
