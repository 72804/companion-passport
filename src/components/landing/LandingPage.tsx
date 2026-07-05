"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { BETA_DISCLAIMER } from "@/lib/constants/beta";

export function LandingPage() {
  useEffect(() => {
    track(ANALYTICS_EVENTS.LANDING_VIEWED);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <section className="text-center mb-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
          Beta — personalized companion identity
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
          Create your AI companion today.
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Bring it into a robot tomorrow.
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400 mb-6 leading-relaxed">
          Build a personalized companion that remembers your style, routines,
          boundaries, and emotional preferences. Start in chat, upgrade to a
          physical companion later.
        </p>
        <p className="mx-auto max-w-2xl text-sm text-zinc-500 mb-10 leading-relaxed">
          {BETA_DISCLAIMER}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/beta">
            <Button size="lg" variant="secondary">
              Beta tester guide
            </Button>
          </Link>
          <Link
            href="/create"
            onClick={() => track(ANALYTICS_EVENTS.CREATE_COMPANION_CLICKED)}
          >
            <Button size="lg">Create Companion</Button>
          </Link>
          <Link
            href="/waitlist"
            onClick={() => track(ANALYTICS_EVENTS.ROBOT_INTEREST_CLICKED)}
          >
            <Button size="lg" variant="secondary">
              Join Robot Waitlist
            </Button>
          </Link>
        </div>
      </section>

      <section className="mb-24">
        <h2 className="text-2xl font-bold text-white text-center mb-10">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Chat",
              desc: "Start a conversation with your companion. Share preferences, routines, and what matters to you.",
            },
            {
              step: "02",
              title: "Companion Passport",
              desc: "Approved memories become a structured identity you own — editable, exportable, portable.",
            },
            {
              step: "03",
              title: "Robot Upgrade",
              desc: "When ready, transfer your companion's identity to a physical robot. Experimental and future-facing.",
            },
          ].map((item) => (
            <Card key={item.step} glow>
              <div className="text-violet-400 text-sm font-mono mb-3">{item.step}</div>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription className="mt-2">{item.desc}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-24">
        <h2 className="text-2xl font-bold text-white text-center mb-10">
          Why it&apos;s different
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              title: "User-owned memory",
              desc: "Nothing is saved without your approval. You control what your companion remembers.",
            },
            {
              title: "Editable personality",
              desc: "Tune tone, boundaries, and relationship style anytime. Your companion evolves with you.",
            },
            {
              title: "Portable identity",
              desc: "Export your Companion Passport as JSON. Take your companion anywhere — app or robot.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription className="mt-2">{item.desc}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-24">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <CardTitle>Privacy-first by design</CardTitle>
              <CardDescription className="mt-2 text-zinc-300">
                View, edit, export, and delete every memory. We never store
                secrets silently — every piece of information requires your
                explicit approval before it enters your Companion Passport.
              </CardDescription>
            </div>
            <Link href="/passport">
              <Button variant="secondary">View Passport</Button>
            </Link>
          </div>
        </Card>
      </section>

      <section>
        <Card className="text-center border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-indigo-500/5">
          <CardTitle className="text-2xl mb-2">Robot upgrade — coming soon</CardTitle>
          <CardDescription className="mx-auto max-w-lg mb-6">
            Physical companions are experimental and not yet available. Join the
            waitlist to help shape what we build — and be first when it&apos;s ready.
          </CardDescription>
          <Link
            href="/waitlist"
            onClick={() => track(ANALYTICS_EVENTS.ROBOT_INTEREST_CLICKED)}
          >
            <Button>Join the Waitlist</Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}
