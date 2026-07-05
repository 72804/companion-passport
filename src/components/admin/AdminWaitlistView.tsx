"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { useApp } from "@/context/AppContext";

export function AdminWaitlistView() {
  const { data, hydrated } = useApp();

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  const entries = data.waitlistEntries;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin — Waitlist</h1>
        <p className="text-zinc-400">
          Demo view of local waitlist submissions ({entries.length} total).
        </p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <p className="text-zinc-500 text-center py-8">No waitlist entries yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <CardTitle>{entry.name}</CardTitle>
                  <CardDescription>{entry.email}</CardDescription>
                  <p className="text-xs text-zinc-500 mt-2">
                    {new Date(entry.submittedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="violet">{entry.robotType}</Badge>
                  <Badge>{entry.priceRange}</Badge>
                  <Badge variant="amber">Deposit: {entry.depositWillingness}</Badge>
                </div>
              </div>
              {entry.desiredBehaviors.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {entry.desiredBehaviors.map((b) => (
                    <Badge key={b}>{b}</Badge>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
