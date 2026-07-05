import { CHAT_CONTEXT_LIMIT } from "../constants";
import { buildCompanionSystemPrompt } from "./buildSystemPrompt";
import type { ChatMessage, CompanionPassport, CompanionProfile } from "../types";

export async function callGeminiProvider(
  apiKey: string,
  profile: CompanionProfile,
  passport: CompanionPassport,
  recentMessages: ChatMessage[],
  userMessage: string
): Promise<string> {
  const system = buildCompanionSystemPrompt(passport, profile);

  const historyText = recentMessages
    .slice(-CHAT_CONTEXT_LIMIT)
    .map((m) => `${m.role === "user" ? "User" : profile.name}: ${m.content}`)
    .join("\n");

  const prompt = `${system}

## Conversation history
${historyText || "No prior messages."}

## Latest user message
User: ${userMessage}

Reply as ${profile.name}:`;

  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Unknown error");
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}
