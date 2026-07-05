"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { getAnonymousId } from "@/lib/analytics/anonymousId";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackAsync, type TrackResult } from "@/lib/analytics/track";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/context/AuthContext";

export function AnalyticsDebugPanel() {
  const { user, email } = useAuth();
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);

  const supabaseConfigured = isSupabaseConfigured();
  const anonymousId =
    typeof window !== "undefined" ? getAnonymousId() : "—";

  const handleTestEvent = async () => {
    setLoading(true);
    setResult(null);
    const trackResult = await trackAsync(ANALYTICS_EVENTS.DEBUG_TEST_EVENT, {
      source: "settings_debug",
    });
    setResult(trackResult);
    setLoading(false);
  };

  return (
    <Card className="border-dashed border-violet-500/30">
      <CardTitle>Analytics debug (temporary)</CardTitle>
      <CardDescription className="mb-4">
        Verify Supabase analytics inserts from this device. Remove before public launch
        if desired.
      </CardDescription>

      <dl className="space-y-2 text-sm mb-4">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Supabase configured</dt>
          <dd className={supabaseConfigured ? "text-emerald-400" : "text-red-400"}>
            {supabaseConfigured ? "Yes" : "No"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">anonymous_id</dt>
          <dd className="text-zinc-300 font-mono text-xs truncate max-w-[200px]">
            {anonymousId}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Logged in</dt>
          <dd className="text-zinc-300">{user ? "Yes" : "No"}</dd>
        </div>
        {user && (
          <>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">user_id</dt>
              <dd className="text-zinc-300 font-mono text-xs truncate max-w-[200px]">
                {user.id}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">email</dt>
              <dd className="text-zinc-300 truncate max-w-[200px]">{email}</dd>
            </div>
          </>
        )}
      </dl>

      <Button onClick={handleTestEvent} disabled={loading || !supabaseConfigured}>
        {loading ? "Sending..." : "Send test analytics event"}
      </Button>

      {!supabaseConfigured && (
        <p className="text-xs text-amber-400 mt-3">
          Supabase env vars missing — analytics inserts are skipped.
        </p>
      )}

      {result && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            result.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {result.ok ? (
            <>
              <p className="font-medium">Success — event inserted</p>
              <pre className="mt-2 text-xs text-emerald-100/80 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(result.payload, null, 2)}
              </pre>
            </>
          ) : (
            <>
              <p className="font-medium">Failed — {result.reason}</p>
              {result.error && <p className="mt-1 text-xs">{result.error}</p>}
              {result.payload && (
                <pre className="mt-2 text-xs text-red-100/80 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(result.payload, null, 2)}
                </pre>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
