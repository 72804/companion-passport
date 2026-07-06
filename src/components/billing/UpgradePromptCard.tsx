"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { LimitCheckResult } from "@/lib/billing/usage";
import { PLANS, type PlanId } from "@/lib/billing/plans";

export function UpgradePromptCard({
  limitResult,
  planId,
  onDismiss,
}: {
  limitResult: Extract<LimitCheckResult, { allowed: false }>;
  planId: PlanId;
  onDismiss?: () => void;
}) {
  const plan = PLANS[planId];

  const copy = {
    ai_limit: {
      title: "Free AI message limit reached",
      body: `You've used your ${plan.limits.aiMessagesPerMonth} AI messages this month. Mock mode still works, or upgrade to Plus for more AI messages.`,
    },
    demo_limit: {
      title: "Demo AI limit reached",
      body: "Create a free account to continue with AI mode, or switch to Mock mode for unlimited device-only testing.",
    },
    memory_limit: {
      title: "Memory limit reached",
      body: `Your ${plan.name} plan allows ${plan.limits.approvedMemories} approved memories. Upgrade for more Passport space.`,
    },
    companion_limit: {
      title: "Companion limit reached",
      body: `Your ${plan.name} plan allows ${plan.limits.companions} companion(s). Upgrade to create more.`,
    },
  }[limitResult.reason];

  return (
    <Card className="mx-4 mb-3 border-violet-500/30 bg-violet-500/5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CardTitle className="text-base">{copy.title}</CardTitle>
            <Badge variant="violet">{plan.name}</Badge>
          </div>
          <CardDescription className="text-zinc-300 leading-relaxed">
            {copy.body}
          </CardDescription>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-zinc-500 hover:text-zinc-300 text-sm shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <Link href="/pricing">
          <Button size="sm">View plans</Button>
        </Link>
        {limitResult.reason === "demo_limit" && (
          <Link href="/signup">
            <Button size="sm" variant="secondary">
              Sign up free
            </Button>
          </Link>
        )}
        {(limitResult.reason === "ai_limit" || limitResult.reason === "demo_limit") && (
          <Link href="/settings">
            <Button size="sm" variant="ghost">
              Switch to Mock mode
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
