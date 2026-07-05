"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { ROBOT_BEHAVIORS, MEMORY_CATEGORY_LABELS } from "@/lib/constants";
import { downloadJson, exportPassportAsJson } from "@/lib/export";
import { normalizeMemoryCategory } from "@/lib/memory-mapping";
import type { CompanionMemory } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";

export function PassportView() {
  const { data, updatePassport, addMemory, updateMemory, deleteMemory, clearAllData, refreshReadiness, hydrated } =
    useApp();
  const passport = data.passport;
  const profile = passport.profile;

  const [newMemory, setNewMemory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    refreshReadiness();
  }, [refreshReadiness]);

  useEffect(() => {
    if (hydrated && profile) {
      track(ANALYTICS_EVENTS.PASSPORT_VIEWED);
    }
  }, [hydrated, profile?.id]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        title="No Companion Passport yet"
        description="Create a companion and chat to start building your passport. Only memories you approve are saved here."
        actionLabel="Create Companion"
        actionHref="/create"
      />
    );
  }

  const handleAddManualMemory = () => {
    if (!newMemory.trim()) return;
    addMemory({
      id: crypto.randomUUID(),
      content: newMemory.trim(),
      category: "personal_fact",
      source: "manual",
      createdAt: new Date().toISOString(),
      approved: true,
    });
    setNewMemory("");
  };

  const handleExport = () => {
    downloadJson(
      exportPassportAsJson(passport),
      `companion-passport-${profile.name.toLowerCase().replace(/\s+/g, "-")}.json`
    );
  };

  const progress = passport.robotReadiness.transferProgress;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Companion Passport</h1>
          <p className="text-zinc-400 mt-1">
            Your companion identity — owned, editable, and portable.
          </p>
          <p className="text-xs text-zinc-500 mt-2 max-w-xl">
            Only memories you approve are saved here. When AI mode is enabled in
            Settings, chat messages may be sent to your selected provider — use
            Mock mode to keep conversations local.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            Export JSON
          </Button>
          <Link href="/chat">
            <Button size="sm">Chat</Button>
          </Link>
        </div>
      </div>

      {/* Basic Identity */}
      <Card glow>
        <CardTitle>Basic Identity</CardTitle>
        <CardDescription className="mb-4">Core companion configuration</CardDescription>
        <dl className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Name", value: profile.name },
            { label: "Type", value: profile.type },
            { label: "Tone", value: profile.tone },
            { label: "Language", value: profile.languageStyle },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-zinc-500 uppercase tracking-wide">{label}</dt>
              <dd className="text-white mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
        <Link href="/create" className="inline-block mt-4">
          <Button variant="ghost" size="sm">
            Edit in creation flow
          </Button>
        </Link>
      </Card>

      {/* User Preferences */}
      <Card>
        <CardTitle>User Preferences</CardTitle>
        <CardDescription className="mb-4">Likes, dislikes, and communication style</CardDescription>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400">Preferred communication style</label>
            <Input
              className="mt-1"
              placeholder="e.g. Call me Alex, keep messages short..."
              value={passport.preferredCommunicationStyle}
              onChange={(e) =>
                updatePassport({ preferredCommunicationStyle: e.target.value })
              }
            />
          </div>
          <PreferenceList
            title="Likes"
            items={passport.likes}
            onAdd={(item) => updatePassport({ likes: [...passport.likes, item] })}
            onRemove={(item) =>
              updatePassport({ likes: passport.likes.filter((l) => l !== item) })
            }
            badgeVariant="emerald"
          />
          <PreferenceList
            title="Dislikes"
            items={passport.dislikes}
            onAdd={(item) => updatePassport({ dislikes: [...passport.dislikes, item] })}
            onRemove={(item) =>
              updatePassport({ dislikes: passport.dislikes.filter((d) => d !== item) })
            }
            badgeVariant="amber"
          />
        </div>
      </Card>

      {/* Memories */}
      <Card>
        <CardTitle>Memories</CardTitle>
        <CardDescription className="mb-4">
          Personal facts you approved. Nothing is stored without your consent.
        </CardDescription>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Add a memory manually..."
            value={newMemory}
            onChange={(e) => setNewMemory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddManualMemory()}
          />
          <Button onClick={handleAddManualMemory} disabled={!newMemory.trim()}>
            Add
          </Button>
        </div>
        {passport.memories.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center">
            No memories yet. Chat with your companion or add one manually.
          </p>
        ) : (
          <ul className="space-y-2">
            {passport.memories.map((memory) => (
              <MemoryItem
                key={memory.id}
                memory={memory}
                editing={editingId === memory.id}
                editContent={editContent}
                onEdit={() => {
                  setEditingId(memory.id);
                  setEditContent(memory.content);
                }}
                onSave={() => {
                  updateMemory(memory.id, editContent);
                  track(ANALYTICS_EVENTS.PASSPORT_MEMORY_EDITED, {
                    memory_category: String(memory.category),
                  });
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
                onEditContentChange={setEditContent}
                onDelete={() => {
                  track(ANALYTICS_EVENTS.PASSPORT_MEMORY_DELETED, {
                    memory_category: String(memory.category),
                  });
                  deleteMemory(memory.id);
                }}
              />
            ))}
          </ul>
        )}
      </Card>

      {/* Routines */}
      <Card>
        <CardTitle>Routines</CardTitle>
        <CardDescription className="mb-4">Daily check-ins and reminders</CardDescription>
        <div className="space-y-4">
          <Textarea
            label="Morning check-in"
            placeholder="e.g. Ask how I slept, remind me to stretch..."
            rows={2}
            value={passport.routines.morningCheckIn}
            onChange={(e) =>
              updatePassport({
                routines: { ...passport.routines, morningCheckIn: e.target.value },
              })
            }
          />
          <Textarea
            label="Evening check-in"
            placeholder="e.g. Reflect on the day, wind-down reminder..."
            rows={2}
            value={passport.routines.eveningCheckIn}
            onChange={(e) =>
              updatePassport({
                routines: { ...passport.routines, eveningCheckIn: e.target.value },
              })
            }
          />
          <Textarea
            label="Gym / study / work reminders"
            placeholder="e.g. Gym at 6pm, study block at 2pm..."
            rows={2}
            value={passport.routines.reminders}
            onChange={(e) =>
              updatePassport({
                routines: { ...passport.routines, reminders: e.target.value },
              })
            }
          />
        </div>
      </Card>

      {/* Boundaries */}
      <Card>
        <CardTitle>Boundaries</CardTitle>
        <CardDescription className="mb-4">Safety and relationship boundaries</CardDescription>
        <div className="space-y-3">
          {[
            { key: "noSexualContent" as const, label: "No sexual content" },
            { key: "noToxicJealousy" as const, label: "No toxic jealousy" },
            {
              key: "noDependencyEncouragement" as const,
              label: "No dependency encouragement",
            },
            {
              key: "noSelfHarmEncouragement" as const,
              label: "No self-harm encouragement",
            },
          ].map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={passport.boundaries[key]}
                onChange={(e) =>
                  updatePassport({
                    boundaries: { ...passport.boundaries, [key]: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded accent-violet-500"
              />
              <span className="text-sm text-zinc-300">{label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Robot Readiness */}
      <Card className="border-violet-500/20">
        <CardTitle>Robot Readiness</CardTitle>
        <CardDescription className="mb-4">
          Prepare your companion for a future physical transfer (experimental).
        </CardDescription>
        <div className="space-y-4">
          <Input
            label="Voice preference"
            placeholder="e.g. Warm, calm female voice..."
            value={passport.robotReadiness.voicePreference}
            onChange={(e) =>
              updatePassport({
                robotReadiness: {
                  ...passport.robotReadiness,
                  voicePreference: e.target.value,
                },
              })
            }
          />
          <Input
            label="Physical robot style preference"
            placeholder="e.g. Desktop cute robot, minimal design..."
            value={passport.robotReadiness.physicalStylePreference}
            onChange={(e) =>
              updatePassport({
                robotReadiness: {
                  ...passport.robotReadiness,
                  physicalStylePreference: e.target.value,
                },
              })
            }
          />
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Desired robot behaviors
            </label>
            <div className="flex flex-wrap gap-2">
              {ROBOT_BEHAVIORS.map((behavior) => {
                const selected =
                  passport.robotReadiness.desiredBehaviors.includes(behavior);
                return (
                  <button
                    key={behavior}
                    type="button"
                    onClick={() => {
                      const behaviors = selected
                        ? passport.robotReadiness.desiredBehaviors.filter(
                            (b) => b !== behavior
                          )
                        : [...passport.robotReadiness.desiredBehaviors, behavior];
                      updatePassport({
                        robotReadiness: {
                          ...passport.robotReadiness,
                          desiredBehaviors: behaviors,
                        },
                      });
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                      selected
                        ? "border-violet-500 bg-violet-500/20 text-violet-200"
                        : "border-white/10 bg-white/5 text-zinc-400"
                    }`}
                  >
                    {behavior}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Ready to transfer to robot?</span>
              <span className="text-violet-300 font-medium">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Complete your passport — add memories, preferences, and robot settings.
            </p>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-500/20">
        <CardTitle className="text-red-300">Data controls</CardTitle>
        <CardDescription className="mb-4">
          Export or permanently delete all local data.
        </CardDescription>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            Export Passport
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm("Delete all local data? This cannot be undone.")) {
                clearAllData();
              }
            }}
          >
            Clear All Data
          </Button>
        </div>
      </Card>
    </div>
  );
}

function PreferenceList({
  title,
  items,
  onAdd,
  onRemove,
  badgeVariant,
}: {
  title: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  badgeVariant: "emerald" | "amber";
}) {
  const [input, setInput] = useState("");

  return (
    <div>
      <label className="text-sm text-zinc-400">{title}</label>
      <div className="flex flex-wrap gap-2 mt-2 mb-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onRemove(item)}
            className="group"
          >
            <Badge variant={badgeVariant}>
              {item} <span className="ml-1 opacity-0 group-hover:opacity-100">×</span>
            </Badge>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={`Add ${title.toLowerCase()}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              onAdd(input.trim());
              setInput("");
            }
          }}
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (input.trim()) {
              onAdd(input.trim());
              setInput("");
            }
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

function MemoryItem({
  memory,
  editing,
  editContent,
  onEdit,
  onSave,
  onCancel,
  onEditContentChange,
  onDelete,
}: {
  memory: CompanionMemory;
  editing: boolean;
  editContent: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEditContentChange: (v: string) => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex-1 min-w-0">
        {editing ? (
          <Input
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
          />
        ) : (
          <p className="text-sm text-zinc-200">{memory.content}</p>
        )}
        <div className="flex gap-2 mt-1.5">
          <Badge variant="violet">
            {MEMORY_CATEGORY_LABELS[normalizeMemoryCategory(memory.category)] ??
              memory.category}
          </Badge>
          <Badge>{memory.source}</Badge>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        {editing ? (
          <>
            <Button size="sm" onClick={onSave}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={onEdit}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={onDelete}>
              Delete
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
