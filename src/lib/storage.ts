import { DEFAULT_BOUNDARIES, STORAGE_KEY } from "./constants";
import type { AppData, ChatMessage, CompanionPassport } from "./types";

export function createDefaultPassport(): CompanionPassport {
  return {
    profile: null,
    likes: [],
    dislikes: [],
    preferredCommunicationStyle: "",
    memories: [],
    routines: {
      morningCheckIn: "",
      eveningCheckIn: "",
      reminders: "",
    },
    boundaries: { ...DEFAULT_BOUNDARIES },
    robotReadiness: {
      voicePreference: "",
      physicalStylePreference: "",
      desiredBehaviors: [],
      transferProgress: 0,
    },
  };
}

export function createDefaultAppData(): AppData {
  return {
    passport: createDefaultPassport(),
    chatHistoryByCompanion: {},
    memoryReviewQueue: [],
    waitlistEntries: [],
    settings: {
      mockAiMode: true,
      aiProvider: "mock",
      reminderPreference: "none",
    },
  };
}

function migrateLegacyData(parsed: Partial<AppData>): AppData {
  const defaults = createDefaultAppData();

  const chatHistoryByCompanion = { ...defaults.chatHistoryByCompanion };

  if (parsed.chatHistoryByCompanion) {
    Object.assign(chatHistoryByCompanion, parsed.chatHistoryByCompanion);
  }

  // Migrate legacy flat chatMessages to current companion
  if (parsed.chatMessages?.length && parsed.passport?.profile?.id) {
    const companionId = parsed.passport.profile.id;
    if (!chatHistoryByCompanion[companionId]?.length) {
      chatHistoryByCompanion[companionId] = parsed.chatMessages;
    }
  }

  return {
    ...defaults,
    ...parsed,
    passport: {
      ...createDefaultPassport(),
      ...parsed.passport,
      boundaries: {
        ...DEFAULT_BOUNDARIES,
        ...parsed.passport?.boundaries,
      },
      robotReadiness: {
        ...createDefaultPassport().robotReadiness,
        ...parsed.passport?.robotReadiness,
      },
    },
    chatHistoryByCompanion,
    memoryReviewQueue: parsed.memoryReviewQueue ?? [],
    settings: {
      ...defaults.settings,
      ...parsed.settings,
      reminderPreference: parsed.settings?.reminderPreference ?? "none",
    },
  };
}

export function loadAppData(): AppData {
  if (typeof window === "undefined") {
    return createDefaultAppData();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultAppData();

    const parsed = JSON.parse(raw) as Partial<AppData>;
    return migrateLegacyData(parsed);
  } catch {
    return createDefaultAppData();
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearAppData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getCompanionChatHistory(
  data: AppData,
  companionId: string | undefined
): ChatMessage[] {
  if (!companionId) return [];
  return data.chatHistoryByCompanion[companionId] ?? [];
}
