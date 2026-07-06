"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { MEMORY_CATEGORY_LABELS } from "@/lib/constants";
import type { CompanionMemory } from "@/lib/types";
import { normalizeMemoryCategory } from "@/lib/memory-mapping";

function truncate(text: string, max = 48): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function ChatPassportPreview({
  memories,
  onAddMemory,
}: {
  memories: CompanionMemory[];
  onAddMemory?: () => void;
}) {
  const approved = memories.filter((m) => m.approved);
  const top = approved.slice(-3).reverse();

  return (
    <Card className="mx-4 mb-3 border-white/10 bg-white/[0.02]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <CardTitle className="text-sm">Companion Passport</CardTitle>
        <span className="text-xs text-zinc-500">{approved.length} approved</span>
      </div>
      {top.length === 0 ? (
        <CardDescription className="text-xs mb-3">
          No approved memories yet. Chat and approve suggestions to build your passport.
        </CardDescription>
      ) : (
        <ul className="space-y-1.5 mb-3">
          {top.map((m) => (
            <li key={m.id} className="text-xs text-zinc-400 flex gap-2">
              <span className="text-violet-400/80 shrink-0">
                {MEMORY_CATEGORY_LABELS[normalizeMemoryCategory(m.category)] ?? m.category}
              </span>
              <span className="truncate">{truncate(m.content)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Link href="/passport">
          <Button size="sm" variant="secondary">
            View Passport
          </Button>
        </Link>
        {onAddMemory && (
          <Button size="sm" variant="ghost" onClick={onAddMemory}>
            Add memory
          </Button>
        )}
      </div>
    </Card>
  );
}
