"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { getAnonymousId } from "@/lib/analytics/anonymousId";
import { track } from "@/lib/analytics/track";
import { isStripeConfigured } from "@/lib/billing/stripe";
import type { PlanId } from "@/lib/billing/plans";
import { createClientIfConfigured } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/context/AuthContext";

export function PaidPlanInterestModal({
  open,
  onClose,
  planId,
  planName,
}: {
  open: boolean;
  onClose: () => void;
  planId: PlanId;
  planName: string;
}) {
  const { user, email } = useAuth();
  const [contactEmail, setContactEmail] = useState(email ?? "");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    const anonymousId = getAnonymousId();

    if (isSupabaseConfigured()) {
      const supabase = createClientIfConfigured();
      if (supabase) {
        const { error } = await supabase.from("paid_plan_interest").insert([
          {
            user_id: user?.id ?? null,
            anonymous_id: anonymousId,
            email: contactEmail.trim() || null,
            plan_id: planId,
            reason: reason.trim() || null,
          },
        ]);
        if (error) {
          setStatus("error");
          return;
        }
      }
    }

    track(ANALYTICS_EVENTS.PAID_PLAN_INTEREST_SUBMITTED, { plan_id: planId });
    setStatus("sent");
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full">
        <CardTitle>Payments not live yet</CardTitle>
        <CardDescription className="mt-2 mb-4">
          {isStripeConfigured()
            ? `Stripe is configured but checkout is not enabled yet. Join the ${planName} interest list.`
            : `Join the ${planName} paid access interest list. We will notify you when billing goes live.`}
        </CardDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!user && (
            <Input
              label="Email (optional)"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
            />
          )}
          <Textarea
            label="Why are you interested? (optional)"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What would make you upgrade?"
          />
          {status === "error" && (
            <p className="text-sm text-red-400">Could not save. Try again later.</p>
          )}
          {status === "sent" && (
            <p className="text-sm text-emerald-400">Thank you — you&apos;re on the list!</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Saving..." : "Join interest list"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
