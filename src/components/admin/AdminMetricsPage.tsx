"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EnvWarnings } from "@/components/ui/EnvWarnings";
import { isSupabaseEnabled } from "@/lib/env";

interface BetaSummary {
  betaStarters: number;
  companionCompletionRate: number;
  firstMessageRate: number;
  memoryApprovalRate: number;
  passportViewRate: number;
  waitlistConversion: number;
  feedbackCount: number;
  feedbackCategories: Record<string, number>;
}

interface MetricsData {
  cards: {
    totalSignups: number;
    totalCompanions: number;
    totalChatMessages: number;
    totalMemoriesSuggested: number;
    totalMemoriesApproved: number;
    memoryApprovalRate: number;
    totalWaitlistSubmissions: number;
    depositBreakdown: Record<string, number>;
  };
  funnel: Record<string, number>;
  breakdowns: {
    companionType: Record<string, number>;
    languageStyle: Record<string, number>;
    aiMode: Record<string, number>;
    fallbackUsed: number;
    priceRange: Record<string, number>;
  };
  dailyActiveUsers: { date: string; count: number }[];
  eventsOverTime: { date: string; count: number }[];
  betaSummary: BetaSummary;
  interpretation: { strong: string[]; attention: string[]; insufficient: string[] };
  debug: {
    totalEventCount: number;
    debugTestEventCount: number;
    latestEvents: { event_name: string; created_at: string; page_path: string | null }[];
  };
  billing: {
    planBreakdown: Record<string, number>;
    usageLimitHits: number;
    paidPlanInterestCount: number;
    paidInterestByPlan: Record<string, number>;
    depositIntentBreakdown: Record<string, number>;
    aiUsageByDay: { date: string; count: number }[];
    memoryApprovalsFromUsage: number;
    pricingViewed: number;
    upgradeClicked: number;
    paidInterestSubmitted: number;
    freeToPaidInterestRate: number;
  };
}

function pct(value: number, hasDenominator: boolean): string {
  if (!hasDenominator && value === 0) return "—";
  return `${value}%`;
}

function BarChart({
  data,
  label,
}: {
  data: Record<string, number> | { date: string; count: number }[];
  label: string;
}) {
  const entries = Array.isArray(data)
    ? data.map((d) => [d.date.slice(5), d.count] as [string, number])
    : Object.entries(data);

  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div>
      <p className="text-sm font-medium text-zinc-300 mb-3">{label}</p>
      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-xs text-zinc-500">No data yet</p>
        ) : (
          entries.map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 w-20 shrink-0 truncate">{key}</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500/70"
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400 w-8 text-right">{value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminMetricsPage() {
  const [password, setPassword] = useState("");
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const configured = isSupabaseEnabled();

  const handleLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load metrics");
        setMetrics(null);
        return;
      }
      setMetrics(data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Admin Metrics</h1>
        <p className="text-zinc-400 leading-relaxed">
          Supabase is not configured. Set{" "}
          <code className="text-violet-400">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-violet-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then run
          migrations 002 and 003.
        </p>
      </div>
    );
  }

  const totalEvents =
    metrics &&
    Object.values(metrics.funnel).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-3xl font-bold text-white">Admin — Metrics</h1>
        <Badge variant="violet">Beta</Badge>
      </div>
      <p className="text-zinc-400 mb-4">
        Privacy-conscious funnel metrics. No raw chat or memory content is stored.
      </p>
      <EnvWarnings context="admin" />

      {!metrics && (
        <Card className="max-w-md mb-8">
          <form onSubmit={handleLoad} className="space-y-4">
            <Input
              label="Admin password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Loading..." : "View metrics"}
            </Button>
          </form>
        </Card>
      )}

      {metrics && (
        <>
          <div className="flex justify-between mb-6">
            <p className="text-zinc-400 text-sm">Last 90 days of events</p>
            <Button variant="ghost" size="sm" onClick={() => setMetrics(null)}>
              Lock
            </Button>
          </div>

          {totalEvents === 0 && (
            <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
              <CardTitle>No analytics events yet</CardTitle>
              <CardDescription className="mt-2">
                Events appear after testers use the app with Supabase configured. Use Settings
                → Analytics debug to send a test event, or share{" "}
                <code className="text-violet-400">/beta</code> with testers.
              </CardDescription>
            </Card>
          )}

          <Card className="mb-6 border-white/10">
            <CardTitle>Event stream debug</CardTitle>
            <CardDescription className="mb-4">
              Quick confirmation that events are reaching Supabase
            </CardDescription>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <p className="text-xs text-zinc-500">Total events (90d)</p>
                <p className="text-2xl font-bold text-white">{metrics.debug.totalEventCount}</p>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <p className="text-xs text-zinc-500">debug_test_event</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.debug.debugTestEventCount}
                </p>
              </div>
            </div>
            {metrics.debug.latestEvents.length === 0 ? (
              <p className="text-sm text-zinc-500">No events recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-zinc-500 border-b border-white/5">
                      <th className="py-2 pr-4 font-medium">Event</th>
                      <th className="py-2 pr-4 font-medium">Page</th>
                      <th className="py-2 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.debug.latestEvents.map((ev, i) => (
                      <tr key={`${ev.event_name}-${ev.created_at}-${i}`} className="border-b border-white/5">
                        <td className="py-2 pr-4 text-zinc-200 font-mono text-xs">
                          {ev.event_name}
                        </td>
                        <td className="py-2 pr-4 text-zinc-400 text-xs">
                          {ev.page_path ?? "—"}
                        </td>
                        <td className="py-2 text-zinc-400 text-xs whitespace-nowrap">
                          {new Date(ev.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="mb-6 border-violet-500/20">
            <CardTitle>Beta readiness summary</CardTitle>
            <CardDescription className="mb-4">
              Conversion rates from beta onboarding flow
            </CardDescription>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Beta starters", value: metrics.betaSummary.betaStarters },
                {
                  label: "Companion completion",
                  value: pct(
                    metrics.betaSummary.companionCompletionRate,
                    metrics.betaSummary.betaStarters > 0
                  ),
                },
                {
                  label: "First message rate",
                  value: pct(
                    metrics.betaSummary.firstMessageRate,
                    metrics.cards.totalCompanions > 0
                  ),
                },
                {
                  label: "Memory approval",
                  value: `${metrics.betaSummary.memoryApprovalRate}%`,
                },
                {
                  label: "Passport view rate",
                  value: pct(
                    metrics.betaSummary.passportViewRate,
                    metrics.cards.totalCompanions > 0
                  ),
                },
                {
                  label: "Waitlist conversion",
                  value: pct(
                    metrics.betaSummary.waitlistConversion,
                    metrics.betaSummary.betaStarters > 0
                  ),
                },
                { label: "Feedback count", value: metrics.betaSummary.feedbackCount },
              ].map((card) => (
                <div key={card.label} className="rounded-xl bg-white/5 px-4 py-3">
                  <p className="text-xs text-zinc-500">{card.label}</p>
                  <p className="text-xl font-bold text-white mt-1">{card.value}</p>
                </div>
              ))}
            </div>

            <BarChart
              label="Top feedback categories"
              data={metrics.betaSummary.feedbackCategories}
            />

            <div className="grid md:grid-cols-3 gap-4 mt-6">
              {metrics.interpretation.strong.length > 0 && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-sm font-medium text-emerald-300 mb-2">Strong signal</p>
                  <ul className="text-xs text-emerald-200/80 space-y-1 list-disc list-inside">
                    {metrics.interpretation.strong.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {metrics.interpretation.attention.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-sm font-medium text-amber-300 mb-2">Needs attention</p>
                  <ul className="text-xs text-amber-200/80 space-y-1 list-disc list-inside">
                    {metrics.interpretation.attention.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {metrics.interpretation.insufficient.length > 0 && (
                <div className="rounded-xl border border-zinc-500/20 bg-white/5 p-4">
                  <p className="text-sm font-medium text-zinc-300 mb-2">Not enough data yet</p>
                  <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                    {metrics.interpretation.insufficient.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Signups", value: metrics.cards.totalSignups },
              { label: "Companions", value: metrics.cards.totalCompanions },
              { label: "Chat messages", value: metrics.cards.totalChatMessages },
              {
                label: "Memory approval",
                value: `${metrics.cards.memoryApprovalRate}%`,
              },
              {
                label: "Memories suggested",
                value: metrics.cards.totalMemoriesSuggested,
              },
              {
                label: "Memories approved",
                value: metrics.cards.totalMemoriesApproved,
              },
              {
                label: "Waitlist submissions",
                value: metrics.cards.totalWaitlistSubmissions,
              },
              {
                label: "AI fallbacks",
                value: metrics.breakdowns.fallbackUsed,
              },
            ].map((card) => (
              <Card key={card.label} className="p-4">
                <p className="text-xs text-zinc-500">{card.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
              </Card>
            ))}
          </div>

          <Card className="mb-6">
            <CardTitle>Funnel</CardTitle>
            <CardDescription className="mb-4">Core product validation flow</CardDescription>
            <BarChart
              label=""
              data={{
                "Beta page": metrics.funnel.betaPageViewed ?? 0,
                "Beta start": metrics.funnel.betaStartClicked ?? 0,
                Landing: metrics.funnel.landingViewed,
                "Create click": metrics.funnel.createCompanionClicked,
                "Companion done": metrics.funnel.companionCompleted,
                "Chat opened": metrics.funnel.chatOpened,
                "Memory approved": metrics.funnel.memoryApproved,
                Passport: metrics.funnel.passportViewed,
                Waitlist: metrics.funnel.waitlistSubmitted,
              }}
            />
          </Card>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardTitle>Billing & monetization</CardTitle>
              <CardDescription className="mb-4">Plans, limits, and paid interest</CardDescription>
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <p className="text-xs text-zinc-500">Usage limit hits</p>
                  <p className="text-lg font-bold text-white">
                    {metrics.billing.usageLimitHits}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <p className="text-xs text-zinc-500">Paid interest</p>
                  <p className="text-lg font-bold text-white">
                    {metrics.billing.paidPlanInterestCount}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <p className="text-xs text-zinc-500">Pricing views</p>
                  <p className="text-lg font-bold text-white">
                    {metrics.billing.pricingViewed}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <p className="text-xs text-zinc-500">Interest conversion</p>
                  <p className="text-lg font-bold text-white">
                    {metrics.billing.freeToPaidInterestRate}%
                  </p>
                </div>
              </div>
              <BarChart label="Plan breakdown" data={metrics.billing.planBreakdown} />
              <div className="mt-4">
                <BarChart
                  label="Paid interest by plan"
                  data={metrics.billing.paidInterestByPlan}
                />
              </div>
              <div className="mt-4">
                <BarChart
                  label="Robot deposit intent"
                  data={metrics.billing.depositIntentBreakdown}
                />
              </div>
            </Card>
            <Card>
              <BarChart label="AI usage by day (14d)" data={metrics.billing.aiUsageByDay} />
              <p className="text-xs text-zinc-500 mt-4">
                Memory approvals (usage_events): {metrics.billing.memoryApprovalsFromUsage}
              </p>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <BarChart label="Companion types" data={metrics.breakdowns.companionType} />
            </Card>
            <Card>
              <BarChart label="Language styles" data={metrics.breakdowns.languageStyle} />
            </Card>
            <Card>
              <BarChart label="Chat mode (mock vs AI)" data={metrics.breakdowns.aiMode} />
            </Card>
            <Card>
              <BarChart label="Waitlist price range" data={metrics.breakdowns.priceRange} />
            </Card>
            <Card>
              <BarChart label="Deposit interest" data={metrics.cards.depositBreakdown} />
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <BarChart label="Daily active users (14d)" data={metrics.dailyActiveUsers} />
            </Card>
            <Card>
              <BarChart label="Events over time (14d)" data={metrics.eventsOverTime} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
