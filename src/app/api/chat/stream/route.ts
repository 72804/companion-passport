import { createChatStream } from "@/lib/ai/providers";
import type { ChatRequestPayload } from "@/lib/types";
import { NextResponse } from "next/server";

const STREAM_TIMEOUT_MS = 60_000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestPayload;

    if (!body.userMessage?.trim()) {
      return NextResponse.json({ error: "userMessage is required" }, { status: 400 });
    }

    if (!body.profile) {
      return NextResponse.json(
        { error: "companion profile is required" },
        { status: 400 }
      );
    }

    const payload: ChatRequestPayload = {
      userMessage: body.userMessage.trim(),
      recentMessages: body.recentMessages ?? [],
      profile: body.profile,
      passport: body.passport,
      provider: body.provider ?? "mock",
      mockAiMode: body.mockAiMode ?? false,
    };

    const stream = await createChatStream(payload);

    if (!stream) {
      return NextResponse.json(
        { error: "Streaming not available for this provider or mode" },
        { status: 501 }
      );
    }

    const timeoutStream = withTimeout(stream, STREAM_TIMEOUT_MS);

    return new Response(timeoutStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[api/chat/stream] Unhandled error:", error);
    return NextResponse.json(
      { error: "Failed to start chat stream" },
      { status: 500 }
    );
  }
}

function withTimeout(
  stream: ReadableStream<Uint8Array>,
  ms: number
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      const timer = setTimeout(() => {
        reader.cancel("Stream timeout");
        controller.error(new Error("AI stream timeout"));
      }, ms);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            break;
          }
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      } finally {
        clearTimeout(timer);
      }
    },
  });
}
