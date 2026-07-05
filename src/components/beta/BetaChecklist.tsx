"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import {
  CHECKLIST_STEPS,
  dismissChecklist,
  getChecklistState,
  isAgeGateConfirmed,
  markChecklistStep,
  skipWaitlistStep,
  type ChecklistState,
} from "@/lib/beta/checklist";

export function BetaChecklist() {
  const pathname = usePathname();
  const { data, chatMessages, hydrated } = useApp();
  const [state, setState] = useState<ChecklistState | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (!hydrated || !isAgeGateConfirmed()) return;

    const profile = data.passport.profile;
    if (profile) markChecklistStep("create_companion");
    if (chatMessages.some((m) => m.role === "user")) markChecklistStep("first_message");
    if (data.passport.memories.some((m) => m.approved)) markChecklistStep("approve_memory");
    if (pathname === "/passport" && profile) markChecklistStep("view_passport");

    setState(getChecklistState());
  }, [hydrated, data.passport.profile, data.passport.memories, chatMessages, pathname]);

  useEffect(() => {
    const onStorage = () => setState(getChecklistState());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!hydrated || isAdmin) return null;

  const current = state ?? getChecklistState();
  if (!isAgeGateConfirmed() || current.dismissed) return null;

  const completedCount = current.completed.length;
  const allDone = completedCount >= CHECKLIST_STEPS.length;

  if (allDone) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-72 max-w-[calc(100vw-2rem)]">
      <div className="rounded-2xl border border-violet-500/30 bg-zinc-900/95 backdrop-blur-xl shadow-xl shadow-violet-900/20 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div>
            <p className="text-sm font-medium text-white">Beta checklist</p>
            <p className="text-xs text-zinc-500">
              {completedCount}/{CHECKLIST_STEPS.length} complete
            </p>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2"
              aria-label={collapsed ? "Expand checklist" : "Collapse checklist"}
            >
              {collapsed ? "▲" : "▼"}
            </button>
            <button
              type="button"
              onClick={() => {
                dismissChecklist();
                setState(getChecklistState());
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2"
            >
              Dismiss
            </button>
          </div>
        </div>

        {!collapsed && (
          <ul className="px-4 py-3 space-y-2 max-h-48 overflow-y-auto">
            {CHECKLIST_STEPS.map((step) => {
              const done = current.completed.includes(step.id);
              return (
                <li key={step.id} className="flex items-start gap-2 text-sm">
                  <span
                    className={
                      done ? "text-emerald-400" : "text-zinc-600"
                    }
                  >
                    {done ? "✓" : "○"}
                  </span>
                  <span className={done ? "text-zinc-500 line-through" : "text-zinc-300"}>
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {!collapsed && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {!current.completed.includes("create_companion") && (
              <Link href="/create">
                <Button size="sm">Create</Button>
              </Link>
            )}
            {!current.completed.includes("waitlist") && (
              <Button size="sm" variant="ghost" onClick={skipWaitlistStep}>
                Skip waitlist
              </Button>
            )}
            <Link href="/beta">
              <Button size="sm" variant="secondary">
                Beta guide
              </Button>
            </Link>
          </div>
        )}

        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-violet-500/70 transition-all"
            style={{ width: `${(completedCount / CHECKLIST_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
