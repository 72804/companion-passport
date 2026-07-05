import { callAnthropicProvider } from "./anthropicProvider";
import { callGeminiProvider } from "./geminiProvider";
import { generateMockReply } from "./mockProvider";
import { callOpenAiProvider, streamOpenAiProvider, supportsStreaming } from "./openaiProvider";
import type {
  AiProvider,
  ChatRequestPayload,
  ChatResponsePayload,
} from "../types";

export { supportsStreaming };

function getEnvKey(provider: AiProvider): string | undefined {
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "openai-compatible":
      return process.env.OPENAI_COMPATIBLE_API_KEY ?? process.env.OPENAI_API_KEY;
    case "claude":
      return process.env.ANTHROPIC_API_KEY;
    case "gemini":
      return process.env.GEMINI_API_KEY;
    default:
      return undefined;
  }
}

function getOpenAiConfig(provider: AiProvider, apiKey: string) {
  if (provider === "openai-compatible") {
    return {
      apiKey,
      baseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL,
      model: process.env.OPENAI_COMPATIBLE_MODEL ?? "gpt-4o-mini",
    };
  }
  return { apiKey };
}

function shouldUseMock(payload: ChatRequestPayload): boolean {
  return payload.mockAiMode || payload.provider === "mock";
}

function mockResponse(
  payload: ChatRequestPayload,
  fallbackReason?: string
): ChatResponsePayload {
  return {
    message: generateMockReply(
      payload.profile,
      payload.userMessage,
      payload.recentMessages,
      payload.passport
    ),
    provider: "mock",
    usedFallback: Boolean(fallbackReason),
    fallbackReason,
  };
}

export async function generateChatResponse(
  payload: ChatRequestPayload
): Promise<ChatResponsePayload> {
  if (!payload.profile) {
    return mockResponse(payload, "No companion profile found");
  }

  if (shouldUseMock(payload)) {
    return mockResponse(payload);
  }

  const apiKey = getEnvKey(payload.provider);
  if (!apiKey) {
    return mockResponse(
      payload,
      `No API key configured for ${payload.provider}. Add it to .env.local`
    );
  }

  try {
    let message: string;

    switch (payload.provider) {
      case "openai":
        message = await callOpenAiProvider(
          getOpenAiConfig("openai", apiKey),
          payload.profile,
          payload.passport,
          payload.recentMessages,
          payload.userMessage
        );
        break;
      case "openai-compatible":
        message = await callOpenAiProvider(
          getOpenAiConfig("openai-compatible", apiKey),
          payload.profile,
          payload.passport,
          payload.recentMessages,
          payload.userMessage
        );
        break;
      case "claude":
        message = await callAnthropicProvider(
          apiKey,
          payload.profile,
          payload.passport,
          payload.recentMessages,
          payload.userMessage
        );
        break;
      case "gemini":
        message = await callGeminiProvider(
          apiKey,
          payload.profile,
          payload.passport,
          payload.recentMessages,
          payload.userMessage
        );
        break;
      default:
        return mockResponse(payload, "Unknown provider");
    }

    return {
      message,
      provider: payload.provider,
      usedFallback: false,
    };
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Provider request failed";
    console.error("[chat] Provider error, falling back to mock:", reason);
    return mockResponse(payload, reason);
  }
}

export async function createChatStream(
  payload: ChatRequestPayload
): Promise<ReadableStream<Uint8Array> | null> {
  if (!payload.profile || shouldUseMock(payload)) return null;
  if (!supportsStreaming(payload.provider)) return null;

  const apiKey = getEnvKey(payload.provider);
  if (!apiKey) return null;

  return streamOpenAiProvider(
    getOpenAiConfig(payload.provider, apiKey),
    payload.profile,
    payload.passport,
    payload.recentMessages,
    payload.userMessage
  );
}
