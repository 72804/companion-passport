"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MEMORY_CATEGORY_LABELS } from "@/lib/constants";
import { useApp } from "@/context/AppContext";
import type { CompanionMemory, MemorySuggestion } from "@/lib/types";

interface MemoryReviewPanelProps {
  suggestions: MemorySuggestion[];
  onApprove: (id: string, editedText?: string, options?: { replaceExistingId?: string }) => void;
  onIgnore: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  checkDuplicate: (text: string, category: string) => CompanionMemory | undefined;
}

export function MemoryReviewPanel({
  suggestions,
  onApprove,
  onIgnore,
  onUpdateText,
  checkDuplicate,
}: MemoryReviewPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [confirmReplace, setConfirmReplace] = useState<{
    suggestionId: string;
    text: string;
    duplicate: CompanionMemory;
  } | null>(null);

  if (suggestions.length === 0) return null;

  const startEdit = (s: MemorySuggestion) => {
    setEditingId(s.id);
    setEditDraft(s.text);
  };

  const saveEdit = (id: string) => {
    onUpdateText(id, editDraft.trim());
    setEditingId(null);
  };

  const tryApprove = (id: string, text: string, category: string) => {
    const duplicate = checkDuplicate(text, category);
    if (duplicate) {
      setConfirmReplace({ suggestionId: id, text, duplicate });
      return;
    }
    onApprove(id, text);
  };

  return (
    <div className="border-t border-violet-500/20 bg-violet-500/5 px-4 py-3">
      {confirmReplace && (
        <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-sm text-amber-200 mb-2">
            Similar memory already exists: &ldquo;{confirmReplace.duplicate.content}&rdquo;
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                onApprove(confirmReplace.suggestionId, confirmReplace.text, {
                  replaceExistingId: confirmReplace.duplicate.id,
                });
                setConfirmReplace(null);
              }}
            >
              Replace existing
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                onApprove(confirmReplace.suggestionId, confirmReplace.text);
                setConfirmReplace(null);
              }}
            >
              Keep both
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmReplace(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-violet-200">Suggested Memories</p>
        <Badge variant="violet">{suggestions.length}</Badge>
      </div>
      <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
        Suggested memories are not saved until you approve them. You can edit or
        delete approved memories anytime in Companion Passport.
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {suggestions.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-violet-500/20 bg-zinc-950/50 p-3"
          >
            {editingId === s.id ? (
              <input
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white mb-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            ) : (
              <p className="text-sm text-zinc-200 mb-1.5">&ldquo;{s.text}&rdquo;</p>
            )}
            <Badge variant="violet" className="mb-2">
              {MEMORY_CATEGORY_LABELS[s.category]}
            </Badge>
            <div className="flex flex-wrap gap-1.5">
              {editingId === s.id ? (
                <>
                  <Button size="sm" onClick={() => saveEdit(s.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => tryApprove(s.id, editDraft.trim(), s.category)}
                  >
                    Add to Passport
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={() => tryApprove(s.id, s.text, s.category)}>
                    Add to Passport
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => startEdit(s)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onIgnore(s.id)}>
                    Ignore
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
