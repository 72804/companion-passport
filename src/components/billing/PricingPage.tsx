"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PaidPlanInterestModal } from "@/components/billing/PaidPlanInterestModal";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { PLAN_LIST, type PlanId } from "@/lib/billing/plans";
import { useBilling } from "@/context/BillingContext";
import { cn } from "@/lib/utils";

export function PricingPage() {
  const { planId, usage, plan } = useBilling();
  const [interestPlan, setInterestPlan] = useState<PlanId | null>(null);

  useEffect(() => {
    track(ANALYTICS_EVENTS.PRICING_VIEWED);
  }, []);

  const handleUpgradeClick = (id: PlanId) => {
    track(ANALYTICS_EVENTS.UPGRADE_CLICKED, { plan_id: id });
    if (id === "free") return;
    setInterestPlan(id);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Choose your plan</h1>
        <p className="text-zinc-400 max-w-xl mx-auto">
          Start free with mock mode unlimited. Upgrade when you need more AI messages and
          Passport capacity.
        </p>
        <p className="text-sm text-zinc-500 mt-3">
          Current plan: <Badge variant="violet">{plan.name}</Badge>
          {planId !== "free" && (
            <span className="ml-2">
              · {usage.aiMessages}/{plan.limits.aiMessagesPerMonth} AI messages used
            </span>
          )}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLAN_LIST.map((p) => {
          const isCurrent = p.id === planId;
          const highlighted = p.id === "plus";

          return (
            <Card
              key={p.id}
              className={cn(
                "flex flex-col",
                highlighted && "border-violet-500/40 bg-violet-500/5",
                isCurrent && "ring-1 ring-violet-500/50"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <CardTitle>{p.name}</CardTitle>
                {p.badge && <Badge variant="amber">{p.badge}</Badge>}
                {isCurrent && <Badge variant="emerald">Current</Badge>}
              </div>
              <p className="text-3xl font-bold text-white mb-4">
                {p.priceLabel}
                {p.monthlyPrice > 0 && (
                  <span className="text-sm font-normal text-zinc-500"> / month</span>
                )}
              </p>
              <ul className="space-y-2 text-sm text-zinc-400 mb-6 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {p.id === "free" ? (
                <Link href="/create">
                  <Button className="w-full" variant="secondary">
                    Start Free
                  </Button>
                </Link>
              ) : (
                <Button
                  className="w-full"
                  variant={highlighted ? "primary" : "secondary"}
                  onClick={() => handleUpgradeClick(p.id)}
                  disabled={isCurrent}
                >
                  {isCurrent
                    ? "Current plan"
                    : p.id === "plus"
                      ? "Upgrade to Plus"
                      : "Join Founder Plan"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-10 border-white/5">
        <CardTitle className="text-base">Payments coming soon</CardTitle>
        <CardDescription className="mt-2">
          Stripe checkout is not live yet. Join a paid plan interest list and we will
          notify you when billing opens. Robot deposits and hardware payments are not
          enabled.
        </CardDescription>
      </Card>

      {interestPlan && (
        <PaidPlanInterestModal
          open
          planId={interestPlan}
          planName={PLAN_LIST.find((p) => p.id === interestPlan)?.name ?? interestPlan}
          onClose={() => setInterestPlan(null)}
        />
      )}
    </div>
  );
}
