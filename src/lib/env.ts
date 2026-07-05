/**
 * Production environment validation.
 * Server-only vars (ADMIN_PASSWORD, API keys) are only checked on the server.
 */

import { isSupabaseConfigured } from "./supabase/config";

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export function isSupabaseEnabled(): boolean {
  return isSupabaseConfigured();
}

export function isAdminEnabled(): boolean {
  return isSupabaseEnabled() && Boolean(env("SUPABASE_SERVICE_ROLE_KEY") && env("ADMIN_PASSWORD"));
}

export function isOpenAiEnabled(): boolean {
  return Boolean(env("OPENAI_API_KEY"));
}

export function isAnthropicEnabled(): boolean {
  return Boolean(env("ANTHROPIC_API_KEY"));
}

export function isGeminiEnabled(): boolean {
  return Boolean(env("GEMINI_API_KEY"));
}

export function isOpenAiCompatibleEnabled(): boolean {
  return Boolean(
    env("OPENAI_COMPATIBLE_API_KEY") &&
      env("OPENAI_COMPATIBLE_BASE_URL") &&
      env("OPENAI_COMPATIBLE_MODEL")
  );
}

export function isAnyAiProviderEnabled(): boolean {
  return (
    isOpenAiEnabled() ||
    isAnthropicEnabled() ||
    isGeminiEnabled() ||
    isOpenAiCompatibleEnabled()
  );
}

const isServer = typeof window === "undefined";

/** Warnings safe to show in admin/settings — never includes secret values. */
export function getMissingProductionEnvWarnings(): string[] {
  const warnings: string[] = [];

  if (!env("NEXT_PUBLIC_SUPABASE_URL")) {
    warnings.push("NEXT_PUBLIC_SUPABASE_URL is not set — cloud sync, auth, and analytics disabled.");
  }
  if (!isSupabaseConfigured()) {
    warnings.push(
      "Supabase public key is not set — add NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  if (isServer) {
    if (isSupabaseEnabled() && !env("SUPABASE_SERVICE_ROLE_KEY")) {
      warnings.push(
        "SUPABASE_SERVICE_ROLE_KEY is not set — admin waitlist and metrics will not work."
      );
    }
    if (!env("ADMIN_PASSWORD")) {
      warnings.push("ADMIN_PASSWORD is not set — admin pages will reject requests.");
    }
    if (!isAnyAiProviderEnabled()) {
      warnings.push(
        "No AI provider keys configured — only Mock mode is available for chat."
      );
    }
  } else {
    if (isSupabaseEnabled()) {
      warnings.push(
        "Server keys (SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD, AI keys) are configured on the host — not visible in the browser."
      );
    }
    if (!isSupabaseEnabled()) {
      warnings.push("Running in local demo mode — data stays on this device only.");
    }
  }

  return warnings;
}

/** Client-visible warnings only (public env vars). */
export function getClientEnvWarnings(): string[] {
  const warnings: string[] = [];
  if (!isSupabaseEnabled()) {
    warnings.push(
      "Supabase is not configured — using local demo mode. Cloud sync, auth, analytics, and feedback storage are unavailable."
    );
  }
  return warnings;
}
