import { createClientIfConfigured } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAnonymousId } from "./anonymousId";
import {
  sanitizeEventProperties,
  type AnalyticsEventName,
  type SafeEventProperties,
} from "./events";

let cachedUserId: string | null = null;

export function setAnalyticsUserId(userId: string | null): void {
  cachedUserId = userId;
}

export function track(
  eventName: AnalyticsEventName,
  properties?: SafeEventProperties,
  pagePath?: string
): void {
  if (typeof window === "undefined") return;
  if (!isSupabaseConfigured()) return;

  const supabase = createClientIfConfigured();
  if (!supabase) return;

  const anonymousId = getAnonymousId();
  const path = pagePath ?? window.location.pathname;
  const eventProperties = sanitizeEventProperties(properties);

  void (async () => {
    try {
      let userId = cachedUserId;
      if (userId === null) {
        const { data } = await supabase.auth.getUser();
        userId = data.user?.id ?? null;
        cachedUserId = userId;
      }

      const row = {
        event_name: eventName,
        event_properties: eventProperties,
        page_path: path,
        anonymous_id: anonymousId,
        user_id: userId,
      };

      await supabase.from("analytics_events").insert([row]);
    } catch {
      // Analytics must never break the app
    }
  })();
}
