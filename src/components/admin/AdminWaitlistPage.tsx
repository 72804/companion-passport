"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EnvWarnings } from "@/components/ui/EnvWarnings";
import { isSupabaseEnabled } from "@/lib/env";

interface WaitlistRow {
  id: string;
  name: string;
  email: string;
  preferred_robot_type: string;
  price_range: string;
  deposit_interest: string;
  desired_behaviors: string[];
  notes: string | null;
  created_at: string;
  user_id: string | null;
}

export function AdminWaitlistPage() {
  const [password, setPassword] = useState("");
  const [entries, setEntries] = useState<WaitlistRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const configured = isSupabaseEnabled();

  const handleLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load waitlist");
        setEntries(null);
        return;
      }

      setEntries(data.entries ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Admin Waitlist</h1>
        <p className="text-zinc-400">
          Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and
          ADMIN_PASSWORD to enable this page.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-white mb-2">Admin — Waitlist</h1>
      <p className="text-zinc-400 mb-4">
        Password-protected view of all robot waitlist submissions from Supabase.
      </p>
      <EnvWarnings context="admin" />

      {!entries && (
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
              {loading ? "Loading..." : "View waitlist"}
            </Button>
          </form>
        </Card>
      )}

      {entries && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-zinc-400">{entries.length} submissions</p>
            <Button variant="ghost" size="sm" onClick={() => setEntries(null)}>
              Lock
            </Button>
          </div>
          <div className="space-y-4">
            {entries.length === 0 ? (
              <Card className="text-center py-10">
                <CardTitle>No waitlist submissions yet</CardTitle>
                <CardDescription className="mt-2">
                  Submissions appear here when testers complete the robot waitlist form.
                </CardDescription>
              </Card>
            ) : (
              entries.map((entry) => (
              <Card key={entry.id}>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                  <div>
                    <CardTitle>{entry.name}</CardTitle>
                    <CardDescription>{entry.email}</CardDescription>
                    <p className="text-xs text-zinc-500 mt-2">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="violet">{entry.preferred_robot_type}</Badge>
                    <Badge>{entry.price_range}</Badge>
                    <Badge variant="amber">Deposit: {entry.deposit_interest}</Badge>
                  </div>
                </div>
                {entry.desired_behaviors?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {entry.desired_behaviors.map((b) => (
                      <Badge key={b}>{b}</Badge>
                    ))}
                  </div>
                )}
                {entry.notes && (
                  <p className="text-sm text-zinc-400 mt-3 border-t border-white/5 pt-3">
                    {entry.notes}
                  </p>
                )}
              </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
