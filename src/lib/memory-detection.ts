import type { MemoryCategory, MemorySuggestion } from "./types";

const PATTERNS: {
  regex: RegExp;
  category: MemoryCategory;
  extract: (match: RegExpMatchArray) => string;
}[] = [
  {
    regex: /\b(?:i like|i love|i enjoy)\s+(.+)/i,
    category: "like",
    extract: (m) => cleanExtract(m[1]),
  },
  {
    regex: /\b(?:i hate|i dislike|i don't like|i do not like|i dont like)\s+(.+)/i,
    category: "dislike",
    extract: (m) => cleanExtract(m[1]),
  },
  {
    regex: /\b(?:remember(?: that)?|don't forget(?: that)?|dont forget(?: that)?)\s+(.+)/i,
    category: "personal_fact",
    extract: (m) => cleanExtract(m[1]),
  },
  {
    regex: /\b(?:my routine is|every morning i|every night i|every evening i)\s+(.+)/i,
    category: "routine",
    extract: (m) => cleanExtract(m[1]),
  },
  {
    regex: /\b(?:every (?:morning|evening|night|day)|i usually)\s+(.+)/i,
    category: "routine",
    extract: (m) => cleanExtract(m[1]),
  },
  {
    regex: /\b(?:call me|my name is|i go by)\s+(.+)/i,
    category: "communication_style",
    extract: (m) => cleanExtract(m[1]),
  },
  {
    regex: /\b(?:i prefer|i'd rather|i would rather|i prefer to)\s+(.+)/i,
    category: "communication_style",
    extract: (m) => cleanExtract(m[1]),
  },
  {
    regex: /\b(?:i want the robot to|the robot should|robot should)\s+(.+)/i,
    category: "robot_preference",
    extract: (m) => cleanExtract(m[1]),
  },
  {
    regex: /\b(?:don't ever|dont ever|do not ever|never)\s+(.+)/i,
    category: "boundary",
    extract: (m) => cleanExtract(m[1]),
  },
  {
    regex: /\b(?:i'm not comfortable with|im not comfortable with|i am not comfortable with)\s+(.+)/i,
    category: "boundary",
    extract: (m) => cleanExtract(m[1]),
  },
];

function cleanExtract(text: string): string {
  return text.trim().replace(/[.!?]+$/, "");
}

function isValidExtract(content: string): boolean {
  return content.length >= 2 && content.length <= 200;
}

export function detectMemoriesFromMessage(message: string): MemorySuggestion[] {
  const trimmed = message.trim();
  if (trimmed.length < 5) return [];

  const results: MemorySuggestion[] = [];
  const seen = new Set<string>();

  for (const pattern of PATTERNS) {
    const match = trimmed.match(pattern.regex);
    if (!match?.[1]) continue;

    const text = pattern.extract(match);
    if (!isValidExtract(text)) continue;

    const key = `${pattern.category}:${text.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({
      id: crypto.randomUUID(),
      text,
      category: pattern.category,
      sourceMessage: trimmed,
      createdAt: new Date().toISOString(),
    });
  }

  return results;
}

/** @deprecated Use detectMemoriesFromMessage */
export function detectMemoryFromMessage(message: string) {
  const suggestions = detectMemoriesFromMessage(message);
  if (suggestions.length === 0) return null;
  const first = suggestions[0];
  return {
    content: first.text,
    category: first.category,
    triggerPhrase: first.sourceMessage.slice(0, 30),
  };
}
