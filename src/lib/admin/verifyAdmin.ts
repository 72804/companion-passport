import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

export async function verifyAdminRequest(request: Request) {
  if (!isSupabaseConfigured()) {
    return {
      error: NextResponse.json({ error: "Supabase is not configured" }, { status: 503 }),
    };
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return {
      error: NextResponse.json(
        { error: "ADMIN_PASSWORD is not set on the server" },
        { status: 503 }
      ),
    };
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) };
  }

  if (body.password !== adminPassword) {
    return {
      error: NextResponse.json(
        { error: "Incorrect admin password. Please try again." },
        { status: 401 }
      ),
    };
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return {
      error: NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY is required for admin access" },
        { status: 503 }
      ),
    };
  }

  return { supabase };
}
