"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { markChecklistStep } from "@/lib/beta/checklist";
import { useAuth } from "@/context/AuthContext";
import {
  DEPOSIT_OPTIONS,
  PRICE_RANGES,
  ROBOT_BEHAVIORS,
  ROBOT_FORM_FACTORS,
  ROBOT_TYPES,
} from "@/lib/constants";
import type {
  DepositOption,
  DepositWillingness,
  PriceRange,
  RobotBehavior,
  RobotFormFactor,
  RobotType,
  WaitlistEntry,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function WaitlistForm() {
  const { addWaitlistEntry, hydrated } = useApp();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [robotType, setRobotType] = useState<RobotType>("desktop cute robot");
  const [formFactor, setFormFactor] = useState<RobotFormFactor>("desktop robot");
  const [priceRange, setPriceRange] = useState<PriceRange>("$100–$300");
  const [realisticPrice, setRealisticPrice] = useState<PriceRange>("$300–$700");
  const [deposit, setDeposit] = useState<DepositWillingness>("maybe");
  const [depositOption, setDepositOption] = useState<DepositOption>("maybe");
  const [behaviors, setBehaviors] = useState<RobotBehavior[]>([]);
  const [buyMotivators, setBuyMotivators] = useState("");
  const [buyConcerns, setBuyConcerns] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (hydrated) {
      track(ANALYTICS_EVENTS.ROBOT_WAITLIST_VIEWED);
    }
  }, [hydrated]);

  const toggleBehavior = (b: RobotBehavior) => {
    setBehaviors((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };

  const handleDepositOptionClick = (opt: DepositOption) => {
    setDepositOption(opt);
    if (opt === "yes $10" || opt === "yes $25") {
      track(ANALYTICS_EVENTS.ROBOT_DEPOSIT_INTEREST_CLICKED, {
        deposit_option: opt,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const entry: WaitlistEntry = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      robotType,
      priceRange,
      depositWillingness: deposit,
      desiredBehaviors: behaviors,
      notes: notes.trim() || undefined,
      submittedAt: new Date().toISOString(),
      formFactor,
      realisticPrice,
      depositOption,
      buyMotivators: buyMotivators.trim() || undefined,
      buyConcerns: buyConcerns.trim() || undefined,
    };
    await addWaitlistEntry(entry);
    track(ANALYTICS_EVENTS.ROBOT_WAITLIST_SUBMITTED, {
      waitlist_price_range: priceRange,
      deposit_interest: deposit,
      desired_behavior_count: behaviors.length,
      has_notes: Boolean(notes.trim() || buyMotivators.trim()),
    });
    if (depositOption === "yes $10" || depositOption === "yes $25") {
      track(ANALYTICS_EVENTS.ROBOT_DEPOSIT_INTENT_SUBMITTED, {
        deposit_option: depositOption,
      });
    }
    markChecklistStep("waitlist");
    setSubmitting(false);
    setSubmitted(true);
  };

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="text-4xl mb-4">✦</div>
        <h2 className="text-2xl font-bold text-white mb-4">
          You&apos;re on the Robot Early Access list
        </h2>
        <p className="text-zinc-400 mb-2">
          Thank you for sharing your buying intent. Physical companions are experimental —
          no payment was collected. Deposits are not enabled yet.
        </p>
        <p className="text-sm text-zinc-500">
          {user
            ? "Saved to your cloud account."
            : "Saved locally on this device. Create an account to sync across devices."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Robot Early Access</h1>
        <p className="text-zinc-400">
          Help us validate serious interest in a physical companion. No payment required —
          this is research for a future, experimental product.
        </p>
      </div>

      <Card glow>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Name"
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Preferred robot type
            </label>
            <div className="grid sm:grid-cols-2 gap-2">
              {ROBOT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRobotType(type)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm text-left transition-all",
                    robotType === type
                      ? "border-violet-500 bg-violet-500/20 text-violet-200"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Would you want your companion in…
            </label>
            <div className="flex flex-wrap gap-2">
              {ROBOT_FORM_FACTORS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormFactor(f)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs capitalize transition-all",
                    formFactor === f
                      ? "border-violet-500 bg-violet-500/20 text-violet-200"
                      : "border-white/10 bg-white/5 text-zinc-400"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              How much would you realistically pay?
            </label>
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setRealisticPrice(range)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-all",
                    realisticPrice === range
                      ? "border-violet-500 bg-violet-500/20 text-violet-200"
                      : "border-white/10 bg-white/5 text-zinc-400"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Would you pay a refundable deposit? (not charged today)
            </label>
            <div className="flex flex-wrap gap-2">
              {DEPOSIT_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDepositOptionClick(d)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-all",
                    depositOption === d
                      ? "border-violet-500 bg-violet-500/20 text-violet-200"
                      : "border-white/10 bg-white/5 text-zinc-400"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Deposits are not enabled. This measures serious buying intent only.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Legacy: general deposit interest
            </label>
            <div className="flex gap-2">
              {(["yes", "maybe", "no"] as DepositWillingness[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDeposit(d)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm capitalize transition-all",
                    deposit === d
                      ? "border-violet-500 bg-violet-500/20 text-violet-200"
                      : "border-white/10 bg-white/5 text-zinc-400"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              What should the robot do?
            </label>
            <div className="flex flex-wrap gap-2">
              {ROBOT_BEHAVIORS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBehavior(b)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-all",
                    behaviors.includes(b)
                      ? "border-violet-500 bg-violet-500/20 text-violet-200"
                      : "border-white/10 bg-white/5 text-zinc-400"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="What would make you buy it?"
            placeholder="What features or feelings would convince you?"
            rows={3}
            value={buyMotivators}
            onChange={(e) => setBuyMotivators(e.target.value)}
          />

          <Textarea
            label="What would scare you away?"
            placeholder="Price, privacy, dependency, hardware quality..."
            rows={3}
            value={buyConcerns}
            onChange={(e) => setBuyConcerns(e.target.value)}
          />

          <Textarea
            label="Anything else? (optional)"
            placeholder="Additional notes..."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Submitting..." : "Join Robot Early Access"}
          </Button>
        </form>
      </Card>

      <Card className="mt-6 border-white/5">
        <CardTitle className="text-base">About robot early access</CardTitle>
        <CardDescription className="mt-2">
          Physical companions are not built yet. This list helps us understand serious
          buying intent, preferred form factors, and price sensitivity. No payment is
          collected.
        </CardDescription>
      </Card>
    </div>
  );
}
