import { getAnonymousId } from "@/lib/analytics/anonymousId";
import { createClientIfConfigured } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEMO_AI_MESSAGE_LIMIT_LOGGED_OUT,
  getPlan,
  type PlanDefinition,
  type PlanId,
} from "./plans";
import { loadLocalUsage, saveLocalUsage, type MonthlyUsage } from "./usageLocal";

export type UsageEventType =
  | "ai_message_sent"
  | "memory_approved"
  | "companion_created"
  | "passport_exported";

export type { MonthlyUsage } from "./usageLocal";

function monthStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

function bumpLocalUsage(eventType: UsageEventType, quantity = 1): MonthlyUsage {
  const usage = loadLocalUsage();
  switch (eventType) {
    case "ai_message_sent":
      usage.aiMessages += quantity;
      break;
    case "memory_approved":
      usage.memoriesApproved += quantity;
      break;
    case "companion_created":
      usage.companionsCreated += quantity;
      break;
    case "passport_exported":
      usage.passportExports += quantity;
      break;
  }
  saveLocalUsage(usage);
  return usage;
}

export async function fetchUserSubscription(
  userId: string
): Promise<{ planId: PlanId; status: string }> {
  if (!isSupabaseConfigured()) return { planId: "free", status: "active" };

  const supabase = createClientIfConfigured();
  if (!supabase) return { planId: "free", status: "active" };

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("plan_id, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return { planId: "free", status: "active" };
  return { planId: data.plan_id as PlanId, status: data.status };
}

export async function fetchMonthlyUsage(userId: string): Promise<MonthlyUsage> {
  if (!isSupabaseConfigured()) return loadLocalUsage();

  const supabase = createClientIfConfigured();
  if (!supabase) return loadLocalUsage();

  const since = monthStart();
  const { data, error } = await supabase
    .from("usage_events")
    .select("event_type, quantity")
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error || !data) return loadLocalUsage();

  const usage: MonthlyUsage = {
    aiMessages: 0,
    memoriesApproved: 0,
    companionsCreated: 0,
    passportExports: 0,
  };

  for (const row of data) {
    const qty = row.quantity ?? 1;
    switch (row.event_type) {
      case "ai_message_sent":
        usage.aiMessages += qty;
        break;
      case "memory_approved":
        usage.memoriesApproved += qty;
        break;
      case "companion_created":
        usage.companionsCreated += qty;
        break;
      case "passport_exported":
        usage.passportExports += qty;
        break;
    }
  }

  return usage;
}

export async function recordUsageEvent(
  eventType: UsageEventType,
  options?: { userId?: string | null; quantity?: number; metadata?: Record<string, string> }
): Promise<MonthlyUsage> {
  const quantity = options?.quantity ?? 1;
  const userId = options?.userId ?? null;
  const anonymousId = getAnonymousId();

  if (userId && isSupabaseConfigured()) {
    const supabase = createClientIfConfigured();
    if (supabase) {
      await supabase.from("usage_events").insert([
        {
          user_id: userId,
          anonymous_id: anonymousId,
          event_type: eventType,
          quantity,
          metadata: options?.metadata ?? {},
        },
      ]);
      return fetchMonthlyUsage(userId);
    }
  }

  return bumpLocalUsage(eventType, quantity);
}

export type LimitCheckResult =
  | { allowed: true }
  | { allowed: false; reason: "ai_limit" | "memory_limit" | "companion_limit" | "demo_limit" };

export function checkAiMessageLimit(
  plan: PlanDefinition,
  usage: MonthlyUsage,
  isMockMode: boolean,
  isLoggedIn: boolean
): LimitCheckResult {
  if (isMockMode) return { allowed: true };
  if (!isLoggedIn) {
    if (usage.aiMessages >= DEMO_AI_MESSAGE_LIMIT_LOGGED_OUT) {
      return { allowed: false, reason: "demo_limit" };
    }
    return { allowed: true };
  }
  if (usage.aiMessages >= plan.limits.aiMessagesPerMonth) {
    return { allowed: false, reason: "ai_limit" };
  }
  return { allowed: true };
}

export function checkMemoryLimit(
  plan: PlanDefinition,
  approvedMemoryCount: number
): LimitCheckResult {
  if (approvedMemoryCount >= plan.limits.approvedMemories) {
    return { allowed: false, reason: "memory_limit" };
  }
  return { allowed: true };
}

export function checkCompanionLimit(
  plan: PlanDefinition,
  companionCount: number
): LimitCheckResult {
  if (companionCount >= plan.limits.companions) {
    return { allowed: false, reason: "companion_limit" };
  }
  return { allowed: true };
}

export function getUsageSummary(planId: PlanId, usage: MonthlyUsage) {
  const plan = getPlan(planId);
  return {
    plan,
    usage,
    aiRemaining: Math.max(0, plan.limits.aiMessagesPerMonth - usage.aiMessages),
    aiPercent: Math.min(
      100,
      Math.round((usage.aiMessages / plan.limits.aiMessagesPerMonth) * 100)
    ),
  };
}
