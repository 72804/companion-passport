"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import {
  checkAiMessageLimit,
  checkCompanionLimit,
  checkMemoryLimit,
  fetchMonthlyUsage,
  fetchUserSubscription,
  getUsageSummary,
  recordUsageEvent,
  type LimitCheckResult,
  type MonthlyUsage,
  type UsageEventType,
} from "@/lib/billing/usage";
import { getPlan, type PlanDefinition, type PlanId } from "@/lib/billing/plans";
import { loadLocalUsage } from "@/lib/billing/usageLocal";

interface BillingContextValue {
  plan: PlanDefinition;
  planId: PlanId;
  usage: MonthlyUsage;
  loading: boolean;
  aiRemaining: number;
  canSendAiMessage: (isMockMode: boolean) => LimitCheckResult;
  canApproveMemory: () => LimitCheckResult;
  canCreateCompanion: () => LimitCheckResult;
  recordUsage: (eventType: UsageEventType) => Promise<void>;
  refreshUsage: () => Promise<void>;
}

const BillingContext = createContext<BillingContextValue | null>(null);

const EMPTY_USAGE: MonthlyUsage = {
  aiMessages: 0,
  memoriesApproved: 0,
  companionsCreated: 0,
  passportExports: 0,
};

export function BillingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data, hydrated } = useApp();
  const [planId, setPlanId] = useState<PlanId>("free");
  const [usage, setUsage] = useState<MonthlyUsage>(EMPTY_USAGE);
  const [loading, setLoading] = useState(true);

  const refreshUsage = useCallback(async () => {
    if (user) {
      const [sub, monthly] = await Promise.all([
        fetchUserSubscription(user.id),
        fetchMonthlyUsage(user.id),
      ]);
      setPlanId(sub.planId);
      setUsage(monthly);
    } else {
      setPlanId("free");
      setUsage(loadLocalUsage());
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!hydrated) return;
    void refreshUsage();
  }, [hydrated, refreshUsage]);

  const plan = useMemo(() => getPlan(planId), [planId]);
  const summary = useMemo(() => getUsageSummary(planId, usage), [planId, usage]);

  const approvedMemoryCount = data.passport.memories.filter((m) => m.approved).length;
  const companionCount = data.passport.profile ? 1 : 0;

  const canSendAiMessage = useCallback(
    (isMockMode: boolean) => checkAiMessageLimit(plan, usage, isMockMode, Boolean(user)),
    [plan, usage, user]
  );

  const canApproveMemory = useCallback(
    () => checkMemoryLimit(plan, approvedMemoryCount),
    [plan, approvedMemoryCount]
  );

  const canCreateCompanion = useCallback(
    () => checkCompanionLimit(plan, companionCount),
    [plan, companionCount]
  );

  const recordUsage = useCallback(
    async (eventType: UsageEventType) => {
      const next = await recordUsageEvent(eventType, { userId: user?.id ?? null });
      setUsage(next);
    },
    [user]
  );

  const value = useMemo(
    (): BillingContextValue => ({
      plan,
      planId,
      usage,
      loading,
      aiRemaining: summary.aiRemaining,
      canSendAiMessage,
      canApproveMemory,
      canCreateCompanion,
      recordUsage,
      refreshUsage,
    }),
    [
      plan,
      planId,
      usage,
      loading,
      summary.aiRemaining,
      canSendAiMessage,
      canApproveMemory,
      canCreateCompanion,
      recordUsage,
      refreshUsage,
    ]
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling() {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be used within BillingProvider");
  return ctx;
}

export function trackUsageLimitReached(
  limitType: "ai" | "memory" | "companion" | "demo",
  planId: PlanId
) {
  track(ANALYTICS_EVENTS.USAGE_LIMIT_REACHED, {
    limit_type: limitType,
    plan_id: planId,
  });
}
