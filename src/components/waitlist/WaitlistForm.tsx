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
  PRICE_RANGES,
  ROBOT_BEHAVIORS,
  ROBOT_TYPES,
} from "@/lib/constants";
import type {
  DepositWillingness,
  PriceRange,
  RobotBehavior,
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
  const [priceRange, setPriceRange] = useState<PriceRange>("$100–$300");
  const [deposit, setDeposit] = useState<DepositWillingness>("maybe");
  const [behaviors, setBehaviors] = useState<RobotBehavior[]>([]);
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
    };
    await addWaitlistEntry(entry);
    track(ANALYTICS_EVENTS.ROBOT_WAITLIST_SUBMITTED, {
      waitlist_price_range: priceRange,
      deposit_interest: deposit,
      desired_behavior_count: behaviors.length,
      has_notes: Boolean(notes.trim()),
    });
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
          You&apos;re on the robot early-access list
        </h2>
        <p className="text-zinc-400 mb-2">
          Thank you for joining. Physical companions are experimental — we&apos;ll
          reach out when there&apos;s progress to share.
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
        <h1 className="text-3xl font-bold text-white mb-2">Robot Waitlist</h1>
        <p className="text-zinc-400">
          Help us validate demand for a physical companion. No payment required —
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
              Expected price range
            </label>
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setPriceRange(range)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-all",
                    priceRange === range
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
              Would you pay a deposit?
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
            label="What would make you buy the robot?"
            placeholder="Optional — tell us what would convince you..."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Submitting..." : "Join Waitlist"}
          </Button>
        </form>
      </Card>

      <Card className="mt-6 border-white/5">
        <CardTitle className="text-base">About the robot upgrade</CardTitle>
        <CardDescription className="mt-2">
          Physical companions are not built yet. This waitlist helps us understand
          interest, preferred form factors, and price sensitivity.
        </CardDescription>
      </Card>
    </div>
  );
}
