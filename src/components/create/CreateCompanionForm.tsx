"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useBilling, trackUsageLimitReached } from "@/context/BillingContext";
import { UpgradePromptCard } from "@/components/billing/UpgradePromptCard";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import {
  AVATAR_STYLES,
  COMPANION_TYPES,
  DEFAULT_BOUNDARIES,
  LANGUAGE_STYLES,
  TONES,
} from "@/lib/constants";
import type {
  AvatarStyle,
  CompanionType,
  LanguageStyle,
  Tone,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["Identity", "Personality", "Boundaries", "Avatar"];

export function CreateCompanionForm() {
  const router = useRouter();
  const { setProfile, data } = useApp();
  const { canCreateCompanion, planId, recordUsage } = useBilling();
  const [step, setStep] = useState(0);
  const [limitBlocked, setLimitBlocked] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<CompanionType>("Friend");
  const [tone, setTone] = useState<Tone>("Soft");
  const [languageStyle, setLanguageStyle] = useState<LanguageStyle>("English");
  const [boundaries, setBoundaries] = useState({ ...DEFAULT_BOUNDARIES });
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>("cosmic");

  useEffect(() => {
    track(ANALYTICS_EVENTS.COMPANION_CREATION_STARTED);
  }, []);

  const canProceed = () => {
    if (step === 0) return name.trim().length >= 2;
    return true;
  };

  const handleSubmit = () => {
    const check = canCreateCompanion();
    if (data.passport.profile && !check.allowed) {
      trackUsageLimitReached("companion", planId);
      setLimitBlocked(true);
      return;
    }

    const profile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      tone,
      languageStyle,
      boundaries,
      avatarStyle,
      createdAt: new Date().toISOString(),
    };
    setProfile(profile);
    void recordUsage("companion_created");
    track(ANALYTICS_EVENTS.COMPANION_CREATION_COMPLETED, {
      companion_type: type,
      tone,
      language_style: languageStyle,
      avatar_style: avatarStyle,
    });
    router.push("/chat");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create your companion</h1>
        <p className="text-zinc-400">
          Define your companion&apos;s identity. You can adjust everything later in your Passport.
        </p>
      </div>

      {limitBlocked && (
        <div className="mb-6">
          <UpgradePromptCard
            limitResult={{ allowed: false, reason: "companion_limit" }}
            planId={planId}
            onDismiss={() => setLimitBlocked(false)}
          />
        </div>
      )}

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={cn(
                "h-1 rounded-full transition-colors",
                i <= step ? "bg-violet-500" : "bg-white/10"
              )}
            />
            <span className="text-xs text-zinc-500 mt-1 block">{label}</span>
          </div>
        ))}
      </div>

      <Card glow>
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <CardTitle>Companion identity</CardTitle>
              <CardDescription>Give your companion a name and relationship type.</CardDescription>
            </div>
            <Input
              label="Companion name"
              placeholder="e.g. Luna, Atlas, Mira..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Companion type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMPANION_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm transition-all",
                      type === t
                        ? "border-violet-500 bg-violet-500/20 text-violet-200"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <CardTitle>Personality</CardTitle>
              <CardDescription>Choose how your companion communicates.</CardDescription>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-all",
                      tone === t
                        ? "border-violet-500 bg-violet-500/20 text-violet-200"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Language style
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_STYLES.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLanguageStyle(l)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-all",
                      languageStyle === l
                        ? "border-violet-500 bg-violet-500/20 text-violet-200"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <CardTitle>Boundaries</CardTitle>
              <CardDescription>
                Safety and relationship boundaries are always enforced.
              </CardDescription>
            </div>
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
                    checked={boundaries[key]}
                    onChange={(e) =>
                      setBoundaries({ ...boundaries, [key]: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-violet-500"
                  />
                  <span className="text-sm text-zinc-300">{label}</span>
                </label>
              ))}
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 opacity-50 cursor-not-allowed">
                <input
                  type="checkbox"
                  checked={boundaries.adultOnlyMode}
                  disabled
                  className="h-4 w-4 rounded accent-violet-500"
                />
                <span className="text-sm text-zinc-300">
                  Adult-only mode (coming soon — disabled in MVP)
                </span>
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <CardTitle>Avatar style</CardTitle>
              <CardDescription>Pick a visual style for your companion.</CardDescription>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AVATAR_STYLES.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setAvatarStyle(avatar.id)}
                  className={cn(
                    "rounded-xl border p-4 text-center transition-all",
                    avatarStyle === avatar.id
                      ? "border-violet-500 ring-2 ring-violet-500/30"
                      : "border-white/10 hover:border-white/20"
                  )}
                >
                  <div
                    className={cn(
                      "mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-2xl",
                      avatar.gradient
                    )}
                  >
                    {avatar.emoji}
                  </div>
                  <span className="text-sm text-zinc-300">{avatar.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed()}>
              Create & Start Chatting
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
