"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MemoryReviewPanel } from "./MemoryReviewPanel";
import { ChatPassportPreview } from "./ChatPassportPreview";
import { UpgradePromptCard } from "@/components/billing/UpgradePromptCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import { useBilling, trackUsageLimitReached } from "@/context/BillingContext";
import { useAuth } from "@/context/AuthContext";
import { sendChatMessageWithStreaming } from "@/lib/ai/chatClient";
import { ANALYTICS_EVENTS, messageCountBucket } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { AVATAR_STYLES } from "@/lib/constants";
import { detectMemoriesFromMessage } from "@/lib/memory-detection";
import type { ChatMessage } from "@/lib/types";
import type { LimitCheckResult } from "@/lib/billing/usage";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

export function ChatInterface() {
  const {
    data,
    chatMessages,
    addChatMessage,
    updateChatMessage,
    clearChatHistory,
    addMemorySuggestions,
    approveMemorySuggestion,
    updateMemorySuggestion,
    ignoreMemorySuggestion,
    checkMemoryDuplicate,
    hydrated,
  } = useApp();

  const { user } = useAuth();
  const {
    planId,
    plan,
    usage,
    aiRemaining,
    canSendAiMessage,
    canApproveMemory,
    recordUsage,
  } = useBilling();

  const [input, setInput] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [limitPrompt, setLimitPrompt] = useState<Extract<
    LimitCheckResult,
    { allowed: false }
  > | null>(null);
  const [retentionNote, setRetentionNote] = useState(false);
  const [dismissedUpgrade, setDismissedUpgrade] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const profile = data.passport.profile;

  const isMockMode =
    data.settings.mockAiMode || data.settings.aiProvider === "mock";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showTyping, streamingId, data.memoryReviewQueue]);

  useEffect(() => {
    if (hydrated && profile) {
      track(ANALYTICS_EVENTS.CHAT_OPENED, {
        companion_type: profile.type,
        language_style: profile.languageStyle,
      });
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
        title="No companion yet"
        description="Create your companion first to start chatting. New to the beta? Read the tester guide for a walkthrough."
        actionLabel="Create Companion"
        actionHref="/create"
      />
    );
  }

  const avatar = AVATAR_STYLES.find((a) => a.id === profile.avatarStyle);

  const handleApproveMemory = (
    id: string,
    editedText?: string,
    options?: { replaceExistingId?: string }
  ) => {
    const check = canApproveMemory();
    if (!check.allowed) {
      trackUsageLimitReached("memory", planId);
      setLimitPrompt(check);
      return;
    }
    approveMemorySuggestion(id, editedText, options);
    void recordUsage("memory_approved");
    setRetentionNote(true);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isResponding) return;

    const limitCheck = canSendAiMessage(isMockMode);
    if (!limitCheck.allowed) {
      const limitType =
        limitCheck.reason === "demo_limit" ? "demo" : "ai";
      trackUsageLimitReached(limitType, planId);
      track(ANALYTICS_EVENTS.USAGE_LIMIT_REACHED, {
        limit_type: limitType,
        plan_id: planId,
      });
      setLimitPrompt(limitCheck);
      setDismissedUpgrade(false);
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const messagesWithUser = [...chatMessages, userMessage];
    addChatMessage(userMessage);
    setInput("");
    setFallbackNotice(null);
    setUsedFallback(false);
    setLimitPrompt(null);

    track(ANALYTICS_EVENTS.CHAT_MESSAGE_SENT, {
      mode: isMockMode ? "mock" : "ai",
      provider: data.settings.aiProvider,
      message_count_bucket: messageCountBucket(messagesWithUser.length),
    });

    if (!isMockMode) {
      void recordUsage("ai_message_sent");
    }

    const detected = detectMemoriesFromMessage(text);
    if (detected.length > 0) {
      addMemorySuggestions(detected);
    }

    const assistantId = crypto.randomUUID();
    const streamingContentRef = { current: "" };
    setIsResponding(true);
    setShowTyping(true);
    setStreamingId(null);

    let streamStarted = false;

    await sendChatMessageWithStreaming(
      {
        userMessage: text,
        recentMessages: messagesWithUser,
        profile,
        passport: data.passport,
        settings: data.settings,
      },
      {
        onTypingStart: () => {
          setShowTyping(true);
        },
        onToken: (token) => {
          if (!streamStarted) {
            streamStarted = true;
            streamingContentRef.current = token;
            setShowTyping(false);
            setStreamingId(assistantId);
            addChatMessage({
              id: assistantId,
              role: "assistant",
              content: token,
              timestamp: new Date().toISOString(),
            });
          } else {
            streamingContentRef.current += token;
            updateChatMessage(assistantId, streamingContentRef.current);
          }
        },
        onComplete: (result) => {
          setShowTyping(false);
          setStreamingId(null);
          setIsResponding(false);

          track(ANALYTICS_EVENTS.AI_REPLY_RECEIVED, {
            mode: isMockMode ? "mock" : "ai",
            provider: result.provider,
            fallback_used: result.usedFallback,
          });

          if (result.usedFallback && !isMockMode) {
            setUsedFallback(true);
            setFallbackNotice(
              result.fallbackReason ?? "Real AI unavailable — used mock reply"
            );
          } else if (result.fallbackReason && !result.usedFallback) {
            setFallbackNotice(result.fallbackReason);
          }

          if (!streamStarted) {
            addChatMessage({
              id: assistantId,
              role: "assistant",
              content: result.message,
              timestamp: new Date().toISOString(),
            });
          } else {
            updateChatMessage(assistantId, result.message);
          }

          if (messagesWithUser.length >= 3) {
            setRetentionNote(true);
          }
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (confirm("Clear chat history for this companion? Memories in Passport are kept.")) {
      clearChatHistory();
    }
  };

  const showUpgrade =
    limitPrompt && !dismissedUpgrade && !isMockMode;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      <div className="flex items-center gap-4 px-4 py-4 border-b border-white/10">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-xl",
            avatar?.gradient ?? "from-violet-600 to-indigo-900"
          )}
        >
          {avatar?.emoji ?? "✦"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-white truncate">{profile.name}</h2>
            <Badge variant={isMockMode ? "default" : "emerald"}>
              {isMockMode ? "Mock mode" : "AI mode"}
            </Badge>
            {usedFallback && <Badge variant="amber">Fallback used</Badge>}
            {!isMockMode && (
              <Badge variant="violet">
                {aiRemaining} AI msgs left
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge variant="violet">{profile.type}</Badge>
            <Badge>{profile.tone}</Badge>
            <Badge>{profile.languageStyle}</Badge>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleClearChat}>
            Clear chat
          </Button>
          <Link href="/passport">
            <Button variant="ghost" size="sm">
              Passport
            </Button>
          </Link>
        </div>
      </div>

      <ChatPassportPreview
        memories={data.passport.memories}
        onAddMemory={() => {
          window.location.href = "/passport";
        }}
      />

      {showUpgrade && (
        <UpgradePromptCard
          limitResult={limitPrompt}
          planId={planId}
          onDismiss={() => setDismissedUpgrade(true)}
        />
      )}

      {retentionNote && (
        <div className="mx-4 mb-3 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-violet-200/90 flex items-start justify-between gap-2">
          <p>
            Your companion will feel more personalized as you add approved memories.
            Come back tomorrow to keep building your Passport.
          </p>
          <button
            type="button"
            onClick={() => setRetentionNote(false)}
            className="text-violet-400/60 hover:text-violet-300 shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {chatMessages.length === 0 && (
          <div className="text-center py-16 px-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300 text-2xl mb-4">
              ✦
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
              Start talking. Your companion only remembers what you approve.
            </p>
            <p className="text-zinc-600 text-xs mt-3">
              Try: &ldquo;I like dark Afro house&rdquo; or &ldquo;call me Alex&rdquo;
            </p>
            {!user && (
              <p className="text-amber-400/80 text-xs mt-4">
                Demo: {usage.aiMessages}/5 AI messages without an account. Mock mode is unlimited.
              </p>
            )}
          </div>
        )}
        {chatMessages.map((msg) => {
          const isStreaming = msg.id === streamingId;
          return (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                  msg.role === "user"
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-md"
                    : "bg-zinc-900/80 text-zinc-100 border border-white/10 rounded-bl-md"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-violet-400 animate-pulse align-middle rounded-sm" />
                )}
              </div>
            </div>
          );
        })}
        {showTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-zinc-900/80 border border-white/10 px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <span className="h-2 w-2 rounded-full bg-violet-400/60 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-violet-400/60 animate-bounce [animation-delay:0.15s]" />
                <span className="h-2 w-2 rounded-full bg-violet-400/60 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <MemoryReviewPanel
        suggestions={data.memoryReviewQueue}
        onApprove={handleApproveMemory}
        onIgnore={ignoreMemorySuggestion}
        onUpdateText={updateMemorySuggestion}
        checkDuplicate={checkMemoryDuplicate}
      />

      <div className="border-t border-white/10 p-4 bg-zinc-950/50">
        {fallbackNotice && (
          <p className="text-xs text-amber-400/80 mb-2 text-center">{fallbackNotice}</p>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${profile.name}...`}
            rows={1}
            disabled={isResponding}
            className="flex-1 min-h-[44px] max-h-32 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isResponding}
            className="shrink-0"
          >
            Send
          </Button>
        </div>
        <p className="text-xs text-zinc-600 mt-2 text-center">
          Enter to send · Shift+Enter for newline ·{" "}
          {isMockMode
            ? "Mock mode (unlimited)"
            : `AI mode (${data.settings.aiProvider}) · ${plan.name} plan`}
        </p>
      </div>
    </div>
  );
}
