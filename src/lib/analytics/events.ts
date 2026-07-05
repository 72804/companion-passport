/** Privacy-safe analytics event names — never include raw chat or memory text. */
export const ANALYTICS_EVENTS = {
  LANDING_VIEWED: "landing_viewed",
  CREATE_COMPANION_CLICKED: "create_companion_clicked",
  COMPANION_CREATION_STARTED: "companion_creation_started",
  COMPANION_CREATION_COMPLETED: "companion_creation_completed",
  CHAT_OPENED: "chat_opened",
  CHAT_MESSAGE_SENT: "chat_message_sent",
  AI_REPLY_RECEIVED: "ai_reply_received",
  MEMORY_SUGGESTED: "memory_suggested",
  MEMORY_APPROVED: "memory_approved",
  MEMORY_IGNORED: "memory_ignored",
  PASSPORT_VIEWED: "passport_viewed",
  PASSPORT_MEMORY_EDITED: "passport_memory_edited",
  PASSPORT_MEMORY_DELETED: "passport_memory_deleted",
  ROBOT_WAITLIST_VIEWED: "robot_waitlist_viewed",
  ROBOT_WAITLIST_SUBMITTED: "robot_waitlist_submitted",
  ROBOT_INTEREST_CLICKED: "robot_interest_clicked",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  LOGIN_COMPLETED: "login_completed",
  LOCAL_TO_CLOUD_MIGRATION_STARTED: "local_to_cloud_migration_started",
  LOCAL_TO_CLOUD_MIGRATION_COMPLETED: "local_to_cloud_migration_completed",
  EXPORT_DATA_CLICKED: "export_data_clicked",
  CLEAR_DATA_CLICKED: "clear_data_clicked",
  FEEDBACK_SUBMITTED: "feedback_submitted",
  DEBUG_TEST_EVENT: "debug_test_event",
  BETA_PAGE_VIEWED: "beta_page_viewed",
  BETA_START_CLICKED: "beta_start_clicked",
  BETA_CHECKLIST_STEP_COMPLETED: "beta_checklist_step_completed",
  BETA_CHECKLIST_DISMISSED: "beta_checklist_dismissed",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Allowed property keys — blocklist enforced in track.ts */
export type SafeEventProperties = {
  provider?: string;
  mode?: "mock" | "ai";
  companion_type?: string;
  tone?: string;
  language_style?: string;
  memory_category?: string;
  waitlist_price_range?: string;
  deposit_interest?: string;
  desired_behavior_count?: number;
  fallback_used?: boolean;
  message_count_bucket?: "0" | "1-5" | "6-20" | "21+";
  avatar_style?: string;
  step?: number;
  rating?: number;
  has_notes?: boolean;
  migration_choice?: "move" | "keep_local" | "clear_local";
  source?: string;
  checklist_step?: string;
  feedback_category?: string;
};

const FORBIDDEN_PROPERTY_KEYS = new Set([
  "email",
  "name",
  "message",
  "content",
  "text",
  "memory",
  "passport",
  "api_key",
  "raw",
]);

export function sanitizeEventProperties(
  properties?: SafeEventProperties
): Record<string, string | number | boolean> {
  if (!properties) return {};
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (FORBIDDEN_PROPERTY_KEYS.has(key.toLowerCase())) continue;
    if (value === undefined || value === null) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
    }
  }
  return safe;
}

export function messageCountBucket(count: number): SafeEventProperties["message_count_bucket"] {
  if (count <= 0) return "0";
  if (count <= 5) return "1-5";
  if (count <= 20) return "6-20";
  return "21+";
}
