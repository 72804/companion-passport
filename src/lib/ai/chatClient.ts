import { CHAT_CONTEXT_LIMIT } from "../constants";
import { generateMockReply } from "./mockProvider";
import type {
  AppSettings,
  ChatMessage,
  ChatRequestPayload,
  ChatResponsePayload,
  CompanionPassport,
  CompanionProfile,
} from "../types";

interface SendChatParams {
  userMessage: string;
  recentMessages: ChatMessage[];
  profile: CompanionProfile;
  passport: CompanionPassport;
  settings: AppSettings;
}

export interface ChatStreamCallbacks {
  onTypingStart?: () => void;
  onToken: (token: string) => void;
  onComplete: (result: ChatResponsePayload) => void;
}

function buildPayload(params: SendChatParams): ChatRequestPayload {
  return {
    userMessage: params.userMessage,
    recentMessages: params.recentMessages.slice(-CHAT_CONTEXT_LIMIT),
    profile: params.profile,
    passport: params.passport,
    provider: params.settings.aiProvider,
    mockAiMode: params.settings.mockAiMode,
  };
}

function localMockResponse(
  params: SendChatParams,
  fallbackReason?: string
): ChatResponsePayload {
  return {
    message: generateMockReply(
      params.profile,
      params.userMessage,
      params.recentMessages,
      params.passport
    ),
    provider: "mock",
    usedFallback: Boolean(fallbackReason),
    fallbackReason,
  };
}

function supportsStreaming(settings: AppSettings): boolean {
  if (settings.mockAiMode || settings.aiProvider === "mock") return false;
  return (
    settings.aiProvider === "openai" ||
    settings.aiProvider === "openai-compatible"
  );
}

async function simulateMockStream(
  message: string,
  callbacks: ChatStreamCallbacks
): Promise<ChatResponsePayload> {
  callbacks.onTypingStart?.();
  await delay(400);

  const words = message.split(/(\s+)/);
  for (const chunk of words) {
    callbacks.onToken(chunk);
    await delay(20 + Math.random() * 30);
  }

  const result: ChatResponsePayload = {
    message,
    provider: "mock",
    usedFallback: false,
    streamed: true,
  };
  callbacks.onComplete(result);
  return result;
}

async function readSSEStream(
  response: Response,
  callbacks: ChatStreamCallbacks
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let started = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;

      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data) as { token?: string };
        if (parsed.token) {
          if (!started) {
            started = true;
            callbacks.onTypingStart?.();
          }
          fullText += parsed.token;
          callbacks.onToken(parsed.token);
        }
      } catch {
        // skip malformed chunk
      }
    }
  }

  if (!fullText.trim()) {
    throw new Error("Empty stream response");
  }

  return fullText;
}

async function tryStreamRoute(
  payload: ChatRequestPayload,
  callbacks: ChatStreamCallbacks
): Promise<ChatResponsePayload | null> {
  const response = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) return null;

  const message = await readSSEStream(response, callbacks);
  return {
    message,
    provider: payload.provider,
    usedFallback: false,
    streamed: true,
  };
}

async function tryNonStreamingRoute(
  payload: ChatRequestPayload
): Promise<ChatResponsePayload | null> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as ChatResponsePayload;
  if (!data.message?.trim()) return null;
  return data;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function sendChatMessageWithStreaming(
  params: SendChatParams,
  callbacks: ChatStreamCallbacks
): Promise<ChatResponsePayload> {
  const { settings } = params;
  const payload = buildPayload(params);
  const isMock = settings.mockAiMode || settings.aiProvider === "mock";

  if (isMock) {
    const mock = localMockResponse(params);
    return simulateMockStream(mock.message, callbacks);
  }

  try {
    let streamAttempted = false;

    if (supportsStreaming(settings)) {
      streamAttempted = true;
      const streamed = await tryStreamRoute(payload, callbacks);
      if (streamed) {
        callbacks.onComplete(streamed);
        return streamed;
      }
      console.warn("[chat] Stream failed, falling back to non-streaming");
    } else {
      callbacks.onTypingStart?.();
    }

    const nonStream = await tryNonStreamingRoute(payload);
    if (nonStream) {
      callbacks.onToken(nonStream.message);
      const result: ChatResponsePayload = {
        ...nonStream,
        streamed: false,
        usedFallback: nonStream.usedFallback,
        fallbackReason: streamAttempted
          ? "Streaming unavailable — used standard response"
          : nonStream.fallbackReason,
      };
      callbacks.onComplete(result);
      return result;
    }

    throw new Error("API unavailable");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Network error";
    console.warn("[chat] Falling back to mock:", reason);
    const mock = localMockResponse(params, reason);
    callbacks.onTypingStart?.();
    callbacks.onToken(mock.message);
    callbacks.onComplete(mock);
    return mock;
  }
}

/** Non-streaming fallback for simple use cases */
export async function sendChatMessage(
  params: SendChatParams
): Promise<ChatResponsePayload> {
  let result: ChatResponsePayload = localMockResponse(params);

  await sendChatMessageWithStreaming(params, {
    onToken: () => {},
    onComplete: (r) => {
      result = r;
    },
  });

  return result;
}
