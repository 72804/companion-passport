import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "./config";
import type { Database } from "./types";

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  return createBrowserClient<Database>(getSupabaseUrl()!, getSupabaseAnonKey()!);
}

export function createClientIfConfigured() {
  if (!isSupabaseConfigured()) return null;
  return createClient();
}
