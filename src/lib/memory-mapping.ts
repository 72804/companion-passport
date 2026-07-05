import type {
  CompanionMemory,
  CompanionMemoryCategory,
  CompanionPassport,
  MemoryCategory,
  MemorySuggestion,
} from "./types";

export function normalizeMemoryCategory(
  category: CompanionMemoryCategory
): MemoryCategory {
  switch (category) {
    case "fact":
      return "personal_fact";
    case "preference":
      return "communication_style";
    case "other":
      return "personal_fact";
    default:
      return category;
  }
}

export function suggestionToCompanionMemory(
  suggestion: MemorySuggestion,
  editedText?: string
): CompanionMemory {
  return {
    id: crypto.randomUUID(),
    content: editedText ?? suggestion.text,
    category: suggestion.category,
    source: "chat",
    createdAt: new Date().toISOString(),
    approved: true,
  };
}

export function applyMemoryToPassport(
  passport: CompanionPassport,
  memory: CompanionMemory
): CompanionPassport {
  const next = { ...passport };
  next.memories = [...next.memories, memory];

  const category = normalizeMemoryCategory(memory.category);
  const content = memory.content;

  switch (category) {
    case "like":
      if (!next.likes.includes(content)) {
        next.likes = [...next.likes, content];
      }
      break;
    case "dislike":
      if (!next.dislikes.includes(content)) {
        next.dislikes = [...next.dislikes, content];
      }
      break;
    case "routine": {
      const lower = content.toLowerCase();
      if (lower.includes("morning") || lower.includes("sabah")) {
        next.routines = {
          ...next.routines,
          morningCheckIn: next.routines.morningCheckIn
            ? `${next.routines.morningCheckIn}; ${content}`
            : content,
        };
      } else if (
        lower.includes("night") ||
        lower.includes("evening") ||
        lower.includes("gece")
      ) {
        next.routines = {
          ...next.routines,
          eveningCheckIn: next.routines.eveningCheckIn
            ? `${next.routines.eveningCheckIn}; ${content}`
            : content,
        };
      } else {
        next.routines = {
          ...next.routines,
          reminders: next.routines.reminders
            ? `${next.routines.reminders}; ${content}`
            : content,
        };
      }
      break;
    }
    case "communication_style":
      next.preferredCommunicationStyle = content;
      break;
    case "robot_preference":
      next.robotReadiness = {
        ...next.robotReadiness,
        desiredBehaviors: next.robotReadiness.desiredBehaviors.includes(content)
          ? next.robotReadiness.desiredBehaviors
          : [...next.robotReadiness.desiredBehaviors, content],
      };
      break;
    case "boundary":
    case "personal_fact":
      break;
  }

  return next;
}
