import type { AppSettings } from "../types";

export type DataMode = "local" | "cloud";

export {
  loadAppData,
  saveAppData,
  clearAppData,
  createDefaultAppData,
  getCompanionChatHistory,
  createDefaultPassport,
} from "../storage";

export {
  isSupabaseConfigured,
} from "../supabase/config";

export {
  saveCompanion,
  loadCompanions,
  savePassportMemory,
  deletePassportMemory,
  saveChatMessage,
  loadChatHistory,
  clearChatHistory,
  saveMemorySuggestion,
  updateMemorySuggestionStatus,
  saveWaitlistEntry,
  loadUserWaitlistEntries,
  syncAppDataToCloud,
  loadAppDataFromCloud,
  migrateLocalToCloud,
  deleteUserCloudData,
  hasLocalDemoData,
  filterDuplicateSuggestions,
  findSimilarApprovedMemory,
} from "./cloudStore";

const SETTINGS_KEY = "companion-passport-settings";

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") {
    return { mockAiMode: true, aiProvider: "mock" };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { mockAiMode: true, aiProvider: "mock" };
    return JSON.parse(raw) as AppSettings;
  } catch {
    return { mockAiMode: true, aiProvider: "mock" };
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export const MIGRATION_DISMISSED_KEY = "cp-migration-dismissed";

export function isMigrationDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MIGRATION_DISMISSED_KEY) === "true";
}

export function setMigrationDismissed(dismissed: boolean): void {
  if (typeof window === "undefined") return;
  if (dismissed) {
    localStorage.setItem(MIGRATION_DISMISSED_KEY, "true");
  } else {
    localStorage.removeItem(MIGRATION_DISMISSED_KEY);
  }
}
