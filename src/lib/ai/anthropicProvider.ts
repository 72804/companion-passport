import { CHAT_CONTEXT_LIMIT } from "../constants";
import { buildCompanionSystemPrompt } from "./buildSystemPrompt";
import type { ChatMessage, CompanionPassport, CompanionProfile } from "../types";

export async function callAnthropicProvider(
  apiKey: string,
  profile: CompanionProfile,
  passport: CompanionPassport,
  recentMessages: ChatMessage[],
  userMessage: string
): Promise<string> {
  const system = buildCompanionSystemPrompt(passport, profile);

  const messages = [
    ...recentMessages.slice(-CHAT_CONTEXT_LIMIT).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 500,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Unknown error");
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    content?: { type: string; text?: string }[];
  };

  const text = data.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) {
    throw new Error("Anthropic returned an empty response");
  }

  return text;
}
