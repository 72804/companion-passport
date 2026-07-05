import { createClientIfConfigured } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAnonymousId } from "./anonymousId";
import {
  sanitizeEventProperties,
  type AnalyticsEventName,
  type SafeEventProperties,
} from "./events";

let cachedUserId: string | null = null;

export type AnalyticsInsertPayload = {
  event_name: string;
  event_properties: Record<string, string | number | boolean>;
  page_path: string;
  anonymous_id: string;
  user_id: string | null;
};

export type TrackResult =
  | { ok: true; payload: AnalyticsInsertPayload }
  | {
      ok: false;
      reason:
        | "server_side"
        | "supabase_not_configured"
        | "client_unavailable"
        | "insert_failed";
      error?: string;
      payload?: AnalyticsInsertPayload;
    };

export function setAnalyticsUserId(userId: string | null): void {
  cachedUserId = userId;
}

function logAnalyticsFailure(message: string, detail?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[analytics] ${message}`, detail);
  }
}

export async function trackAsync(
  eventName: AnalyticsEventName,
  properties?: SafeEventProperties,
  pagePath?: string
): Promise<TrackResult> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "server_side" };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, reason: "supabase_not_configured" };
  }

  const supabase = createClientIfConfigured();
  if (!supabase) {
    return { ok: false, reason: "client_unavailable" };
  }

  const anonymousId = getAnonymousId();
  const path = pagePath ?? window.location.pathname;
  const eventProperties = sanitizeEventProperties(properties);

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUserId = sessionData.session?.user.id ?? null;

    if (sessionUserId !== null) {
      cachedUserId = sessionUserId;
    } else if (cachedUserId === null) {
      const { data: userData } = await supabase.auth.getUser();
      cachedUserId = userData.user?.id ?? null;
    }

    const userId = sessionUserId ?? cachedUserId;

    const payload: AnalyticsInsertPayload = {
      event_name: eventName,
      event_properties: eventProperties,
      page_path: path,
      anonymous_id: anonymousId,
      user_id: userId,
    };

    const { error } = await supabase.from("analytics_events").insert([payload]);

    if (error) {
      logAnalyticsFailure("insert failed", { error: error.message, payload });
      return {
        ok: false,
        reason: "insert_failed",
        error: error.message,
        payload,
      };
    }

    return { ok: true, payload };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown analytics error";
    logAnalyticsFailure("unexpected error", message);
    return { ok: false, reason: "insert_failed", error: message };
  }
}

/** Fire-and-forget — never throws; logs failures in development only. */
export function track(
  eventName: AnalyticsEventName,
  properties?: SafeEventProperties,
  pagePath?: string
): void {
  void trackAsync(eventName, properties, pagePath).then((result) => {
    if (!result.ok) {
      logAnalyticsFailure(`track(${eventName})`, result);
    }
  });
}
