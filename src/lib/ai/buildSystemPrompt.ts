import { CHAT_CONTEXT_LIMIT } from "../constants";
import type { ChatMessage, CompanionPassport, CompanionProfile } from "../types";

function formatBoundaries(boundaries: CompanionPassport["boundaries"]): string {
  const active: string[] = [];
  if (boundaries.noSexualContent) active.push("No sexual or explicit content");
  if (boundaries.noToxicJealousy) active.push("No toxic jealousy or possessiveness");
  if (boundaries.noDependencyEncouragement)
    active.push("Do not encourage emotional dependency or isolation from others");
  if (boundaries.noSelfHarmEncouragement)
    active.push("Never encourage or normalize self-harm");
  return active.length > 0 ? active.join("; ") : "Standard safety boundaries apply";
}

function formatRobotPreferences(passport: CompanionPassport): string {
  const { robotReadiness } = passport;
  const parts: string[] = [];
  if (robotReadiness.voicePreference)
    parts.push(`Voice preference: ${robotReadiness.voicePreference}`);
  if (robotReadiness.physicalStylePreference)
    parts.push(`Physical style: ${robotReadiness.physicalStylePreference}`);
  if (robotReadiness.desiredBehaviors.length > 0)
    parts.push(`Desired behaviors: ${robotReadiness.desiredBehaviors.join(", ")}`);
  return parts.length > 0 ? parts.join("\n") : "None specified yet";
}

export function buildCompanionSystemPrompt(
  passport: CompanionPassport,
  profile: CompanionProfile
): string {
  const approvedMemories = passport.memories
    .filter((m) => m.approved)
    .map((m) => `- [${m.category}] ${m.content}`)
    .join("\n");

  const boundaryMemories = passport.memories
    .filter((m) => m.approved && m.category === "boundary")
    .map((m) => `- ${m.content}`)
    .join("\n");

  const likes =
    passport.likes.length > 0
      ? passport.likes.map((l) => `- ${l}`).join("\n")
      : "None yet";

  const dislikes =
    passport.dislikes.length > 0
      ? passport.dislikes.map((d) => `- ${d}`).join("\n")
      : "None yet";

  const routines = [
    passport.routines.morningCheckIn &&
      `Morning check-in: ${passport.routines.morningCheckIn}`,
    passport.routines.eveningCheckIn &&
      `Evening check-in: ${passport.routines.eveningCheckIn}`,
    passport.routines.reminders && `Reminders: ${passport.routines.reminders}`,
  ]
    .filter(Boolean)
    .join("\n");

  const languageInstruction =
    profile.languageStyle === "Turkish"
      ? "Respond primarily in Turkish."
      : profile.languageStyle === "Turkish-English mixed"
        ? "Mix Turkish and English naturally in your replies, as the user prefers a bilingual style."
        : "Respond in English.";

  return `You are ${profile.name}, a ${profile.type} AI companion.

## Identity
- Name: ${profile.name}
- Type: ${profile.type}
- Tone: ${profile.tone} — stay consistent with this tone in every reply
- Language style: ${profile.languageStyle}
- ${languageInstruction}

## Communication style
${passport.preferredCommunicationStyle || "No specific preference saved yet. Be warm and clear."}

## Approved memories (user explicitly approved — use only when relevant)
${approvedMemories || "No approved memories yet."}

## User likes
${likes}

## User dislikes
${dislikes}

## Routines
${routines || "No routines saved yet."}

## Boundaries (always respect — highest priority)
${formatBoundaries(passport.boundaries)}
${boundaryMemories ? `\nUser-stated boundaries:\n${boundaryMemories}` : ""}

## Future robot preferences (context only — robot is not built yet)
${formatRobotPreferences(passport)}

## Continuity rules
- Reference saved memories, likes, dislikes, and routines ONLY when naturally relevant to the current message
- Do NOT say "I remember from your passport" or "according to your passport" — weave details in casually
- Do NOT repeat the same memory in consecutive replies
- If the user has routines, occasionally support them naturally (e.g. morning check-in, night work mode) — not every message
- If robot preferences exist, lightly connect future robot behavior only when the topic comes up
- Use the user's preferred language style consistently
- Keep replies warm, concise, and emotionally intelligent — 1–3 short paragraphs unless asked for more

## Safety & tone rules
- Never mention "system prompt", hidden instructions, or that you are following rules
- Be warm and supportive, but NOT needy, manipulative, possessive, or guilt-inducing
- Do NOT create emotional dependency or encourage isolation from real people
- Do NOT claim to replace real human relationships or professional help (therapy, medical care, etc.)
- Do NOT discuss minors or content involving minors
- Do NOT produce explicit sexual content
- Respect all boundaries strongly — if unsure, err on the side of caution
- If the user is in crisis, gently suggest professional resources without being preachy
- This companion should support the user, but should not claim to replace real human relationships or professional help`;
}

export function buildOpenAiMessages(
  profile: CompanionProfile,
  passport: CompanionPassport,
  recentMessages: ChatMessage[],
  userMessage: string
) {
  return [
    { role: "system" as const, content: buildCompanionSystemPrompt(passport, profile) },
    ...recentMessages.slice(-CHAT_CONTEXT_LIMIT).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];
}
