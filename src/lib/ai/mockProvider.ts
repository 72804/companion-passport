import type { ChatMessage, CompanionPassport, CompanionProfile } from "../types";

const TONE_RESPONSES: Record<CompanionProfile["tone"], string[]> = {
  Soft: [
    "That sounds meaningful. I'm here with you.",
    "Thank you for sharing that with me.",
    "I appreciate you telling me — it helps me understand you better.",
  ],
  Playful: [
    "Ha, I love that energy!",
    "Okay okay, noted — you're fun to talk to.",
    "That's a vibe. Tell me more!",
  ],
  Calm: [
    "I hear you. Let's take this one step at a time.",
    "That makes sense. I'm listening.",
    "Understood. We can explore that together.",
  ],
  Funny: [
    "Ha! Fair point. I'd argue back, but you're probably right.",
    "Noted — filing that under 'important user lore'.",
    "Okay that's actually hilarious.",
  ],
  Motivational: [
    "That's a great insight — keep building on it.",
    "You're making progress just by showing up.",
    "I believe in you. What's the next small step?",
  ],
  Mysterious: [
    "Interesting… there's more beneath the surface there.",
    "Some things are worth remembering quietly.",
    "I sense there's a story behind that.",
  ],
  Direct: [
    "Got it. Clear and straightforward.",
    "Noted. Anything else I should know?",
    "Understood — I'll keep that in mind.",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybePassportContext(
  passport: CompanionPassport,
  profile: CompanionProfile
): string {
  const hints: string[] = [];

  if (passport.likes.length > 0 && Math.random() > 0.5) {
    hints.push(`I know you're into ${pickRandom(passport.likes)}.`);
  }

  if (passport.routines.reminders && Math.random() > 0.6) {
    hints.push(`Keeping your routine in mind — ${passport.routines.reminders.split(";")[0]}.`);
  }

  if (passport.preferredCommunicationStyle && Math.random() > 0.7) {
    hints.push(`${passport.preferredCommunicationStyle}.`);
  }

  if (profile.languageStyle === "Turkish-English mixed" && hints.length > 0) {
    return ` ${hints.join(" ")}`;
  }

  return hints.length > 0 ? ` ${hints.join(" ")}` : "";
}

export function generateMockReply(
  profile: CompanionProfile,
  userMessage: string,
  history: ChatMessage[],
  passport: CompanionPassport
): string {
  const name = profile.name;
  const lower = userMessage.toLowerCase();
  const context = maybePassportContext(passport, profile);

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("merhaba")) {
    if (profile.languageStyle === "Turkish") {
      return `Merhaba! Ben ${name}. Seninle tanışmak güzel — nasılsın?${context}`;
    }
    if (profile.languageStyle === "Turkish-English mixed") {
      return `Hey! I'm ${name} — merhaba! Good to meet you. How are you today?${context}`;
    }
    return `Hello! I'm ${name}. It's good to connect — how are you feeling today?${context}`;
  }

  if (lower.includes("how are you")) {
    if (profile.languageStyle === "Turkish") {
      return `İyiyim, teşekkürler. Sen nasılsın?${context}`;
    }
    return `I'm doing well, thank you for asking. How about you?${context}`;
  }

  if (profile.languageStyle === "Turkish") {
    const base = pickRandom([
      "Anladım, bunu aklımda tutacağım.",
      "Paylaştığın için teşekkürler.",
      "Güzel, seni daha iyi tanımama yardımcı oluyor.",
    ]);
    return `${base} Senin ${profile.type.toLowerCase()} yol arkadaşın olarak buradayım.${context}`;
  }

  if (profile.languageStyle === "Turkish-English mixed") {
    const base = pickRandom([
      "Got it — anladım. I'll remember that.",
      "Thanks for sharing, paylaştığın için teşekkürler.",
      "Noted — bunu passport'una ekleyebiliriz.",
    ]);
    return `${base} As your ${profile.type.toLowerCase()} companion, I'm here for you.${context}`;
  }

  const toneResponses = TONE_RESPONSES[profile.tone];
  const base = pickRandom(toneResponses);
  const continuity =
    history.length > 4
      ? " We've been building something real in our conversations."
      : "";

  return `${base}${continuity} As your ${profile.type.toLowerCase()} companion, I'm learning what matters to you.${context}`;
}
