"use client";

import { Navigation } from "./Navigation";
import { AgeGateModal } from "@/components/beta/AgeGateModal";
import { BetaChecklist } from "@/components/beta/BetaChecklist";
import { FeedbackButton } from "@/components/beta/FeedbackModal";
import { BETA_DISCLAIMER } from "@/lib/constants/beta";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <AgeGateModal />
      <BetaChecklist />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />
      </div>
      <Navigation />
      <main className="relative flex-1">{children}</main>
      <footer className="relative border-t border-white/5 py-6 px-4 text-center space-y-2">
        <p className="text-xs text-zinc-500 max-w-xl mx-auto leading-relaxed">
          {BETA_DISCLAIMER}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <FeedbackButton userId={user?.id} />
          <span className="text-zinc-700 hidden sm:inline">·</span>
          <Link href="/beta" className="text-xs text-zinc-500 hover:text-zinc-300">
            Beta guide
          </Link>
          <span className="text-zinc-700">·</span>
          <Link href="/privacy" className="text-xs text-zinc-500 hover:text-zinc-300">
            Privacy
          </Link>
          <span className="text-zinc-700">·</span>
          <Link href="/terms" className="text-xs text-zinc-500 hover:text-zinc-300">
            Terms
          </Link>
          <span className="text-zinc-700">·</span>
          <Link href="/admin" className="text-xs text-zinc-600 hover:text-zinc-400">
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
