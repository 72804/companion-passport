import { buildOpenAiMessages } from "./buildSystemPrompt";
import type { ChatMessage, CompanionPassport, CompanionProfile } from "../types";

export interface OpenAiConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export async function callOpenAiProvider(
  config: OpenAiConfig,
  profile: CompanionProfile,
  passport: CompanionPassport,
  recentMessages: ChatMessage[],
  userMessage: string
): Promise<string> {
  const baseUrl = config.baseUrl ?? "https://api.openai.com/v1";
  const model = config.model ?? "gpt-4o-mini";
  const messages = buildOpenAiMessages(profile, passport, recentMessages, userMessage);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Unknown error");
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return content;
}

export async function streamOpenAiProvider(
  config: OpenAiConfig,
  profile: CompanionProfile,
  passport: CompanionPassport,
  recentMessages: ChatMessage[],
  userMessage: string
): Promise<ReadableStream<Uint8Array>> {
  const baseUrl = config.baseUrl ?? "https://api.openai.com/v1";
  const model = config.model ?? "gpt-4o-mini";
  const messages = buildOpenAiMessages(profile, passport, recentMessages, userMessage);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: 500,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Unknown error");
    throw new Error(`OpenAI stream error (${response.status}): ${errText}`);
  }

  if (!response.body) {
    throw new Error("OpenAI stream returned no body");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              continue;
            }

            try {
              const parsed = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
                );
              }
            } catch {
              // skip malformed SSE chunk
            }
          }
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export function supportsStreaming(provider: string): boolean {
  return provider === "openai" || provider === "openai-compatible";
}
