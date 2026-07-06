"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { downloadJson, exportAllDataAsJson } from "@/lib/export";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { BETA_DISCLAIMER } from "@/lib/constants/beta";
import { EnvWarnings } from "@/components/ui/EnvWarnings";
import { AnalyticsDebugPanel } from "@/components/settings/AnalyticsDebugPanel";
import { useBilling } from "@/context/BillingContext";
import type { ReminderPreference } from "@/lib/types";

export function SettingsPanel() {
  const {
    data,
    dataMode,
    syncError,
    updateSettings,
    clearAllData,
    deleteCloudData,
    hydrated,
  } = useApp();
  const { user, email, signOut, supabaseReady, setDataMode } = useAuth();
  const { plan, usage } = useBilling();
  const [deleting, setDeleting] = useState(false);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  const handleExportAll = () => {
    track(ANALYTICS_EVENTS.EXPORT_DATA_CLICKED);
    downloadJson(exportAllDataAsJson(data), "companion-passport-full-export.json");
  };

  const handleClear = () => {
    if (
      confirm(
        "Clear all local demo data including companion, chat, passport, and waitlist on this device? This cannot be undone."
      )
    ) {
      clearAllData();
    }
  };

  const handleDeleteCloud = async () => {
    if (
      !confirm(
        "This deletes your companion profile, approved memories, memory suggestions, and chat history from your account. It does not delete anonymized analytics events.\n\nAre you sure?"
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await deleteCloudData();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-zinc-400">Manage your data, privacy, and AI configuration.</p>
      </div>

      <EnvWarnings context="settings" />

      <AnalyticsDebugPanel />

      <Card>
        <CardTitle>Your plan</CardTitle>
        <CardDescription className="mb-4">
          {plan.name} — {usage.aiMessages}/{plan.limits.aiMessagesPerMonth} AI messages
          used this month (mock mode unlimited).
        </CardDescription>
        <Link href="/pricing">
          <Button variant="secondary" size="sm">
            View plans
          </Button>
        </Link>
      </Card>

      <Card>
        <CardTitle>Daily reminder preference</CardTitle>
        <CardDescription className="mb-4">
          Optional check-in preference (no emails or push notifications yet — stored for
          when reminders launch).
        </CardDescription>
        <select
          value={data.settings.reminderPreference ?? "none"}
          onChange={(e) => {
            const pref = e.target.value as ReminderPreference;
            updateSettings({ reminderPreference: pref });
            track(ANALYTICS_EVENTS.REMINDER_PREFERENCE_SET, {
              reminder_preference: pref,
            });
          }}
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-white text-sm"
        >
          <option value="none">No reminders</option>
          <option value="morning">Morning check-in</option>
          <option value="evening">Evening check-in</option>
        </select>
      </Card>

      <Card>
        <CardTitle>Account</CardTitle>
        <CardDescription className="mb-4">
          {user
            ? `Signed in as ${email}`
            : "Not signed in — using local demo mode on this device."}
        </CardDescription>

        {user ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <span className="text-zinc-400">Data mode: </span>
              <span className="text-white font-medium">
                {dataMode === "cloud" ? "Cloud account mode" : "Local demo mode"}
              </span>
            </div>
            {syncError && (
              <p className="text-xs text-amber-400">Sync issue: {syncError}</p>
            )}
            {dataMode === "local" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDataMode("cloud")}
              >
                Switch to cloud sync
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Log out
            </Button>
          </div>
        ) : supabaseReady ? (
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Supabase not configured — cloud accounts unavailable. The app works in local
            demo mode on this device.
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>AI Provider</CardTitle>
        <CardDescription className="mb-4">
          API keys are read from <code className="text-violet-400">.env.local</code> on
          the server. If no keys are configured, enable Mock mode below.
        </CardDescription>
        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer mb-4">
          <div>
            <span className="text-sm text-zinc-200">Mock AI mode</span>
            <p className="text-xs text-zinc-500 mt-0.5">Local simulated responses</p>
          </div>
          <input
            type="checkbox"
            checked={data.settings.mockAiMode}
            onChange={(e) => updateSettings({ mockAiMode: e.target.checked })}
            className="h-5 w-5 rounded accent-violet-500"
          />
        </label>
        <select
          value={data.settings.aiProvider}
          onChange={(e) =>
            updateSettings({
              aiProvider: e.target.value as typeof data.settings.aiProvider,
            })
          }
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-white text-sm"
        >
          <option value="mock">Mock only</option>
          <option value="openai">OpenAI</option>
          <option value="openai-compatible">OpenAI-compatible</option>
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
        </select>
      </Card>

      <Card>
        <CardTitle>Privacy</CardTitle>
        <CardDescription className="mb-4">How your data is stored and used.</CardDescription>
        <p className="text-sm text-zinc-500 mb-4 leading-relaxed">{BETA_DISCLAIMER}</p>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex gap-2">
            <span className="text-emerald-400">✓</span>
            All memories require your explicit approval before saving
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400">!</span>
            If you use cloud sync, your approved companion profile, memories, chat
            history, and waitlist data are stored in Supabase. AI messages may be sent
            to the selected AI provider when AI mode is enabled.
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-400">✓</span>
            Use Mock mode if you do not want messages sent to an external provider
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-400">✓</span>
            Anonymized product analytics may be collected (no raw chat or memory text)
          </li>
        </ul>
        <div className="flex gap-3 mt-4 text-sm">
          <Link href="/privacy" className="text-violet-400 hover:text-violet-300">
            Privacy policy
          </Link>
          <Link href="/terms" className="text-violet-400 hover:text-violet-300">
            Terms of use
          </Link>
        </div>
      </Card>

      <Card>
        <CardTitle>Data controls</CardTitle>
        <CardDescription className="mb-4">
          Export or delete data stored locally or in the cloud.
        </CardDescription>
        <ul className="text-xs text-zinc-500 mb-4 space-y-1">
          <li>Clear local demo data — removes device-only storage</li>
          <li>Delete cloud data — removes account companion, memories, chat (not analytics)</li>
          <li>Export — download a JSON copy of your current app data</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExportAll}>
            Export my data
          </Button>
          <Button variant="secondary" onClick={handleClear}>
            Clear local demo data
          </Button>
          {user && dataMode === "cloud" && (
            <Button variant="danger" onClick={handleDeleteCloud} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete my cloud companion data"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
