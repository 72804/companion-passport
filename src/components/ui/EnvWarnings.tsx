"use client";

import { getClientEnvWarnings } from "@/lib/env";

export function EnvWarnings({ context }: { context: "settings" | "admin" }) {
  const warnings = getClientEnvWarnings();

  if (context === "admin" && warnings.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 mb-6 text-sm text-zinc-400">
        <p className="font-medium text-zinc-300 mb-1">Production setup</p>
        <p>
          Ensure{" "}
          <code className="text-violet-400">SUPABASE_SERVICE_ROLE_KEY</code> and{" "}
          <code className="text-violet-400">ADMIN_PASSWORD</code> are set on the server.
          AI keys are optional — Mock mode works without them.
        </p>
      </div>
    );
  }

  if (warnings.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 mb-6 text-sm text-amber-200/90">
      <p className="font-medium text-amber-200 mb-2">
        {context === "admin" ? "Setup warnings" : "Environment notice"}
      </p>
      <ul className="space-y-1 list-disc list-inside text-amber-200/80">
        {warnings.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
    </div>
  );
}
