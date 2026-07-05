"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { BETA_DISCLAIMER } from "@/lib/constants/beta";

export function BetaOnboardingPage() {
  useEffect(() => {
    track(ANALYTICS_EVENTS.BETA_PAGE_VIEWED);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 mb-6">
          External beta
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Welcome, beta tester
        </h1>
        <p className="text-lg text-zinc-400 leading-relaxed">
          Companion Passport is an early AI companion beta focused on user-approved
          memory and portable companion identity.
        </p>
      </div>

      <Card className="mb-6">
        <CardTitle>What to test</CardTitle>
        <CardDescription className="mt-2 mb-4">
          Please walk through these steps and tell us what works or confuses you.
        </CardDescription>
        <ol className="space-y-3 text-sm text-zinc-300 list-decimal list-inside">
          <li>Create a companion</li>
          <li>Chat with it</li>
          <li>Approve or ignore suggested memories</li>
          <li>Check your Companion Passport</li>
          <li>Join the robot waitlist if the idea interests you</li>
          <li>Send feedback from the footer</li>
        </ol>
      </Card>

      <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
        <CardTitle>Privacy note</CardTitle>
        <CardDescription className="mt-2 text-zinc-300 leading-relaxed">
          Only approved memories are saved to your Companion Passport. AI mode may send
          chat messages to the selected AI provider. Use Mock mode for device-only
          testing.
        </CardDescription>
      </Card>

      <Card className="mb-8">
        <CardTitle>Adults 18+ only</CardTitle>
        <CardDescription className="mt-2 leading-relaxed">
          This beta does not support minors, explicit sexual content, or crisis support.
          If you need crisis help, contact local emergency services or a qualified
          professional.
        </CardDescription>
      </Card>

      <p className="text-xs text-zinc-500 text-center mb-8 leading-relaxed">
        {BETA_DISCLAIMER}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/create"
          onClick={() => track(ANALYTICS_EVENTS.BETA_START_CLICKED)}
        >
          <Button size="lg">Start Beta Test</Button>
        </Link>
        <Link href="/">
          <Button size="lg" variant="secondary">
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}
