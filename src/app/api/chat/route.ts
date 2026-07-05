import { generateChatResponse } from "@/lib/ai/providers";
import type { ChatRequestPayload } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestPayload;

    if (!body.userMessage?.trim()) {
      return NextResponse.json(
        { error: "userMessage is required" },
        { status: 400 }
      );
    }

    if (!body.profile) {
      return NextResponse.json(
        { error: "companion profile is required" },
        { status: 400 }
      );
    }

    const result = await generateChatResponse({
      userMessage: body.userMessage.trim(),
      recentMessages: body.recentMessages ?? [],
      profile: body.profile,
      passport: body.passport,
      provider: body.provider ?? "mock",
      mockAiMode: body.mockAiMode ?? false,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/chat] Unhandled error:", error);
    return NextResponse.json(
      { error: "Failed to generate chat response" },
      { status: 500 }
    );
  }
}
