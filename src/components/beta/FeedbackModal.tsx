"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { getAnonymousId } from "@/lib/analytics/anonymousId";
import { track } from "@/lib/analytics/track";
import { markChecklistStep } from "@/lib/beta/checklist";
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "@/lib/constants/feedback";
import { createClientIfConfigured } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/env";

export function FeedbackModal({
  open,
  onClose,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userId?: string | null;
}) {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("sending");

    const pagePath = window.location.pathname;
    const anonymousId = getAnonymousId();

    if (isSupabaseEnabled()) {
      const supabase = createClientIfConfigured();
      if (supabase) {
        const { error } = await supabase.from("feedback").insert([
          {
            user_id: userId ?? null,
            anonymous_id: anonymousId,
            rating,
            message: message.trim(),
            page_path: pagePath,
            category,
            contact_email: !userId && contactEmail.trim() ? contactEmail.trim() : null,
          },
        ]);
        if (error) {
          setStatus("error");
          return;
        }
      }
    } else {
      const subject = encodeURIComponent(`Beta Feedback (${category})`);
      const body = encodeURIComponent(
        `[${category}]\n${message.trim()}${contactEmail ? `\n\nContact: ${contactEmail}` : ""}`
      );
      window.location.href = `mailto:feedback@companionpassport.app?subject=${subject}&body=${body}`;
      setStatus("sent");
      track(ANALYTICS_EVENTS.FEEDBACK_SUBMITTED, {
        feedback_category: category,
        rating: rating ?? undefined,
      });
      markChecklistStep("feedback");
      onClose();
      return;
    }

    track(ANALYTICS_EVENTS.FEEDBACK_SUBMITTED, {
      feedback_category: category,
      rating: rating ?? undefined,
    });
    markChecklistStep("feedback");
    setStatus("sent");
    setMessage("");
    setRating(null);
    setCategory("general");
    setContactEmail("");
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <CardTitle>Send feedback</CardTitle>
        <CardDescription className="mt-2 mb-4">
          Help us improve the beta. Do not include private chat content.
        </CardDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
            options={FEEDBACK_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Rating (optional)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`h-9 w-9 rounded-lg border text-sm ${
                    rating === n
                      ? "border-violet-500 bg-violet-500/20 text-violet-200"
                      : "border-white/10 text-zinc-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label="Your feedback"
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What worked? What confused you?"
          />
          {!userId && (
            <Input
              label="Email (optional — so we can follow up)"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
            />
          )}
          {status === "error" && (
            <p className="text-sm text-red-400">
              Could not save feedback. Check Supabase setup or try again.
            </p>
          )}
          {status === "sent" && (
            <p className="text-sm text-emerald-400">Thank you for your feedback!</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={status === "sending" || !message.trim()}>
              {status === "sending" ? "Sending..." : "Submit"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function FeedbackButton({ userId }: { userId?: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-violet-400 hover:text-violet-300 underline"
      >
        Send feedback
      </button>
      <FeedbackModal open={open} onClose={() => setOpen(false)} userId={userId} />
    </>
  );
}
