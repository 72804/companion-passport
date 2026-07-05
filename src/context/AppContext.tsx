"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MigrationPrompt } from "@/components/auth/MigrationPrompt";
import { useAuth } from "@/context/AuthContext";
import {
  clearAppData,
  createDefaultAppData,
  filterDuplicateSuggestions,
  findSimilarApprovedMemory,
  getCompanionChatHistory,
  hasLocalDemoData,
  isMigrationDismissed,
  loadAppData,
  loadAppDataFromCloud,
  loadSettings,
  migrateLocalToCloud,
  saveAppData,
  saveSettings,
  setMigrationDismissed,
  syncAppDataToCloud,
  deleteUserCloudData,
  saveWaitlistEntry as saveWaitlistToCloud,
} from "@/lib/data";
import { createClientIfConfigured } from "@/lib/supabase/client";
import { calculateRobotReadinessProgress } from "@/lib/export";
import { applyMemoryToPassport } from "@/lib/memory-mapping";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { CHAT_STORAGE_LIMIT } from "@/lib/constants";
import type {
  AppData,
  ChatMessage,
  CompanionMemory,
  CompanionPassport,
  CompanionProfile,
  MemorySuggestion,
  WaitlistEntry,
} from "@/lib/types";

interface AppContextValue {
  data: AppData;
  hydrated: boolean;
  chatMessages: ChatMessage[];
  dataMode: "local" | "cloud";
  syncError: string | null;
  setProfile: (profile: CompanionProfile) => void;
  addChatMessage: (message: ChatMessage, provider?: string) => void;
  updateChatMessage: (id: string, content: string) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  clearChatHistory: () => void;
  addMemory: (memory: CompanionMemory) => void;
  approveMemorySuggestion: (
    id: string,
    editedText?: string,
    options?: { replaceExistingId?: string }
  ) => void;
  updateMemorySuggestion: (id: string, text: string) => void;
  ignoreMemorySuggestion: (id: string) => void;
  addMemorySuggestions: (suggestions: MemorySuggestion[]) => void;
  checkMemoryDuplicate: (text: string, category: string) => CompanionMemory | undefined;
  updateMemory: (id: string, content: string) => void;
  deleteMemory: (id: string) => void;
  updatePassport: (updates: Partial<CompanionPassport>) => void;
  addWaitlistEntry: (entry: WaitlistEntry) => Promise<void>;
  updateSettings: (updates: Partial<AppData["settings"]>) => void;
  clearAllData: () => void;
  deleteCloudData: () => Promise<void>;
  refreshReadiness: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function trimChatHistory(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= CHAT_STORAGE_LIMIT) return messages;
  return messages.slice(-CHAT_STORAGE_LIMIT);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, dataMode, setDataMode, authLoading } = useAuth();
  const [data, setData] = useState<AppData>(createDefaultAppData());
  const [hydrated, setHydrated] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const localSnapshotRef = useRef<AppData | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const companionId = data.passport.profile?.id;

  const chatMessages = useMemo(
    () => getCompanionChatHistory(data, companionId),
    [data, companionId]
  );

  // Initial local load
  useEffect(() => {
    const local = loadAppData();
    local.settings = loadSettings();
    setData(local);
    localSnapshotRef.current = local;
    setHydrated(true);
  }, []);

  // Cloud load + migration prompt on login
  useEffect(() => {
    if (!hydrated || authLoading || !user || dataMode !== "cloud") return;

    const supabase = createClientIfConfigured();
    if (!supabase) return;

    let cancelled = false;

    (async () => {
      try {
        const local = localSnapshotRef.current ?? loadAppData();
        const shouldPrompt =
          hasLocalDemoData(local) &&
          !isMigrationDismissed() &&
          !showMigration;

        if (shouldPrompt) {
          setShowMigration(true);
          return;
        }

        const cloudData = await loadAppDataFromCloud(supabase, user.id);
        if (cancelled) return;

        setData((prev) => ({
          ...cloudData,
          settings: prev.settings,
        }));
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : "Failed to load cloud data");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, authLoading, user, dataMode, showMigration]);

  // Persist local mode
  useEffect(() => {
    if (!hydrated) return;
    saveSettings(data.settings);
    if (dataMode === "local") {
      saveAppData(data);
    }
  }, [data, hydrated, dataMode]);

  // Debounced cloud sync
  useEffect(() => {
    if (!hydrated || dataMode !== "cloud" || !user || showMigration) return;

    const supabase = createClientIfConfigured();
    if (!supabase) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    syncTimerRef.current = setTimeout(async () => {
      try {
        await syncAppDataToCloud(supabase, user.id, data);
        setSyncError(null);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : "Cloud sync failed");
      }
    }, 800);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [data, hydrated, dataMode, user, showMigration]);

  const updateCompanionChat = useCallback(
    (updater: (messages: ChatMessage[]) => ChatMessage[]) => {
      if (!companionId) return;
      setData((prev) => {
        const current = prev.chatHistoryByCompanion[companionId] ?? [];
        const next = trimChatHistory(updater(current));
        return {
          ...prev,
          chatHistoryByCompanion: {
            ...prev.chatHistoryByCompanion,
            [companionId]: next,
          },
        };
      });
    },
    [companionId]
  );

  const refreshReadiness = useCallback(() => {
    setData((prev) => {
      const progress = calculateRobotReadinessProgress(prev.passport);
      return {
        ...prev,
        passport: {
          ...prev.passport,
          robotReadiness: {
            ...prev.passport.robotReadiness,
            transferProgress: progress,
          },
        },
      };
    });
  }, []);

  const setProfile = useCallback((profile: CompanionProfile) => {
    setData((prev) => {
      const passport = {
        ...prev.passport,
        profile,
        boundaries: profile.boundaries,
      };
      passport.robotReadiness = {
        ...passport.robotReadiness,
        transferProgress: calculateRobotReadinessProgress(passport),
      };
      return { ...prev, passport };
    });
  }, []);

  const addChatMessage = useCallback(
    (message: ChatMessage, _provider?: string) => {
      updateCompanionChat((msgs) => [...msgs, message]);
    },
    [updateCompanionChat]
  );

  const updateChatMessage = useCallback(
    (id: string, content: string) => {
      updateCompanionChat((msgs) =>
        msgs.map((m) => (m.id === id ? { ...m, content } : m))
      );
    },
    [updateCompanionChat]
  );

  const setChatMessages = useCallback(
    (messages: ChatMessage[]) => {
      updateCompanionChat(() => trimChatHistory(messages));
    },
    [updateCompanionChat]
  );

  const clearChatHistory = useCallback(() => {
    if (!companionId) return;
    setData((prev) => ({
      ...prev,
      chatHistoryByCompanion: {
        ...prev.chatHistoryByCompanion,
        [companionId]: [],
      },
    }));

    if (dataMode === "cloud" && user) {
      const supabase = createClientIfConfigured();
      if (supabase) {
        import("@/lib/data/cloudStore").then(({ clearChatHistory: clearCloud }) =>
          clearCloud(supabase, user.id, companionId!)
        );
      }
    }
  }, [companionId, dataMode, user]);

  const addMemory = useCallback((memory: CompanionMemory) => {
    setData((prev) => {
      let passport = applyMemoryToPassport(prev.passport, memory);
      passport.robotReadiness = {
        ...passport.robotReadiness,
        transferProgress: calculateRobotReadinessProgress(passport),
      };
      return { ...prev, passport };
    });
  }, []);

  const checkMemoryDuplicate = useCallback(
    (text: string, category: string) =>
      findSimilarApprovedMemory(data.passport, text, category),
    [data.passport]
  );

  const addMemorySuggestions = useCallback((suggestions: MemorySuggestion[]) => {
    if (suggestions.length === 0) return;
    setData((prev) => {
      const novel = filterDuplicateSuggestions(
        suggestions,
        prev.passport,
        prev.memoryReviewQueue
      );
      if (novel.length === 0) return prev;
      for (const s of novel) {
        track(ANALYTICS_EVENTS.MEMORY_SUGGESTED, {
          memory_category: s.category,
        });
      }
      return {
        ...prev,
        memoryReviewQueue: [...prev.memoryReviewQueue, ...novel],
      };
    });
  }, []);

  const approveMemorySuggestion = useCallback(
    (id: string, editedText?: string, options?: { replaceExistingId?: string }) => {
      const suggestion = data.memoryReviewQueue.find((s) => s.id === id);
      if (suggestion) {
        track(ANALYTICS_EVENTS.MEMORY_APPROVED, {
          memory_category: suggestion.category,
        });
      }

      setData((prev) => {
        const sug = prev.memoryReviewQueue.find((s) => s.id === id);
        if (!sug) return prev;

        let memories = prev.passport.memories;
        if (options?.replaceExistingId) {
          memories = memories.filter((m) => m.id !== options.replaceExistingId);
        }

        const memory: CompanionMemory = {
          id: crypto.randomUUID(),
          content: editedText ?? sug.text,
          category: sug.category,
          source: "chat",
          createdAt: new Date().toISOString(),
          approved: true,
        };

        const passportBase = { ...prev.passport, memories };
        let passport = applyMemoryToPassport(passportBase, memory);
        passport.robotReadiness = {
          ...passport.robotReadiness,
          transferProgress: calculateRobotReadinessProgress(passport),
        };

        if (dataMode === "cloud" && user) {
          const supabase = createClientIfConfigured();
          if (supabase) {
            import("@/lib/data/cloudStore").then(({ updateMemorySuggestionStatus }) =>
              updateMemorySuggestionStatus(supabase, user.id, id, "approved")
            );
          }
        }

        return {
          ...prev,
          passport,
          memoryReviewQueue: prev.memoryReviewQueue.filter((s) => s.id !== id),
        };
      });
    },
    [dataMode, user, data.memoryReviewQueue]
  );

  const updateMemorySuggestion = useCallback((id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      memoryReviewQueue: prev.memoryReviewQueue.map((s) =>
        s.id === id ? { ...s, text } : s
      ),
    }));
  }, []);

  const ignoreMemorySuggestion = useCallback(
    (id: string) => {
      const suggestion = data.memoryReviewQueue.find((s) => s.id === id);
      if (suggestion) {
        track(ANALYTICS_EVENTS.MEMORY_IGNORED, {
          memory_category: suggestion.category,
        });
      }

      setData((prev) => ({
        ...prev,
        memoryReviewQueue: prev.memoryReviewQueue.filter((s) => s.id !== id),
      }));

      if (dataMode === "cloud" && user) {
        const supabase = createClientIfConfigured();
        if (supabase) {
          import("@/lib/data/cloudStore").then(({ updateMemorySuggestionStatus }) =>
            updateMemorySuggestionStatus(supabase, user.id, id, "ignored")
          );
        }
      }
    },
    [dataMode, user, data.memoryReviewQueue]
  );

  const updateMemory = useCallback((id: string, content: string) => {
    setData((prev) => ({
      ...prev,
      passport: {
        ...prev.passport,
        memories: prev.passport.memories.map((m) =>
          m.id === id ? { ...m, content } : m
        ),
      },
    }));
  }, []);

  const deleteMemory = useCallback(
    (id: string) => {
      setData((prev) => {
        const memory = prev.passport.memories.find((m) => m.id === id);
        const passport = {
          ...prev.passport,
          memories: prev.passport.memories.filter((m) => m.id !== id),
        };

        if (memory) {
          if (memory.category === "like") {
            passport.likes = passport.likes.filter((l) => l !== memory.content);
          }
          if (memory.category === "dislike") {
            passport.dislikes = passport.dislikes.filter((d) => d !== memory.content);
          }
        }

        passport.robotReadiness.transferProgress =
          calculateRobotReadinessProgress(passport);

        return { ...prev, passport };
      });

      if (dataMode === "cloud" && user) {
        const supabase = createClientIfConfigured();
        if (supabase) {
          import("@/lib/data/cloudStore").then(({ deletePassportMemory }) =>
            deletePassportMemory(supabase, user.id, id)
          );
        }
      }
    },
    [dataMode, user]
  );

  const updatePassport = useCallback((updates: Partial<CompanionPassport>) => {
    setData((prev) => {
      const passport = { ...prev.passport, ...updates };
      passport.robotReadiness = {
        ...passport.robotReadiness,
        transferProgress: calculateRobotReadinessProgress(passport),
      };
      return { ...prev, passport };
    });
  }, []);

  const addWaitlistEntry = useCallback(
    async (entry: WaitlistEntry) => {
      setData((prev) => ({
        ...prev,
        waitlistEntries: [...prev.waitlistEntries, entry],
      }));

      const supabase = createClientIfConfigured();
      if (supabase) {
        try {
          await saveWaitlistToCloud(supabase, entry, user?.id ?? null);
        } catch (err) {
          console.warn("[waitlist] Cloud save failed, kept locally:", err);
        }
      }
    },
    [user]
  );

  const updateSettings = useCallback((updates: Partial<AppData["settings"]>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  const clearAllData = useCallback(() => {
    track(ANALYTICS_EVENTS.CLEAR_DATA_CLICKED, { source: "local" });
    clearAppData();
    setData({ ...createDefaultAppData(), settings: loadSettings() });
  }, []);

  const deleteCloudData = useCallback(async () => {
    if (!user) return;
    const supabase = createClientIfConfigured();
    if (!supabase) return;
    await deleteUserCloudData(supabase, user.id);
    setData((prev) => ({
      ...createDefaultAppData(),
      settings: prev.settings,
    }));
  }, [user]);

  const handleMigrationMove = useCallback(async () => {
    if (!user) return;
    const supabase = createClientIfConfigured();
    if (!supabase) return;

    setMigrationLoading(true);
    track(ANALYTICS_EVENTS.LOCAL_TO_CLOUD_MIGRATION_STARTED);
    try {
      const local = localSnapshotRef.current ?? loadAppData();
      await migrateLocalToCloud(supabase, user.id, local);
      clearAppData();
      const cloudData = await loadAppDataFromCloud(supabase, user.id);
      setData((prev) => ({ ...cloudData, settings: prev.settings }));
      setDataMode("cloud");
      setShowMigration(false);
      setMigrationDismissed(true);
      track(ANALYTICS_EVENTS.LOCAL_TO_CLOUD_MIGRATION_COMPLETED, {
        migration_choice: "move",
      });
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Migration failed");
    } finally {
      setMigrationLoading(false);
    }
  }, [user, setDataMode]);

  const handleMigrationKeepLocal = useCallback(() => {
    setDataMode("local");
    setShowMigration(false);
    setMigrationDismissed(true);
  }, [setDataMode]);

  const handleMigrationClearLocal = useCallback(async () => {
    clearAppData();
    setShowMigration(false);
    setMigrationDismissed(true);
    if (user) {
      const supabase = createClientIfConfigured();
      if (supabase) {
        const cloudData = await loadAppDataFromCloud(supabase, user.id);
        setData((prev) => ({ ...cloudData, settings: prev.settings }));
      }
    }
  }, [user]);

  const value = useMemo(
    () => ({
      data,
      hydrated,
      chatMessages,
      dataMode,
      syncError,
      setProfile,
      addChatMessage,
      updateChatMessage,
      setChatMessages,
      clearChatHistory,
      addMemory,
      approveMemorySuggestion,
      updateMemorySuggestion,
      ignoreMemorySuggestion,
      addMemorySuggestions,
      checkMemoryDuplicate,
      updateMemory,
      deleteMemory,
      updatePassport,
      addWaitlistEntry,
      updateSettings,
      clearAllData,
      deleteCloudData,
      refreshReadiness,
    }),
    [
      data,
      hydrated,
      chatMessages,
      dataMode,
      syncError,
      setProfile,
      addChatMessage,
      updateChatMessage,
      setChatMessages,
      clearChatHistory,
      addMemory,
      approveMemorySuggestion,
      updateMemorySuggestion,
      ignoreMemorySuggestion,
      addMemorySuggestions,
      checkMemoryDuplicate,
      updateMemory,
      deleteMemory,
      updatePassport,
      addWaitlistEntry,
      updateSettings,
      clearAllData,
      deleteCloudData,
      refreshReadiness,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {showMigration && (
        <MigrationPrompt
          onMove={handleMigrationMove}
          onKeepLocal={handleMigrationKeepLocal}
          onClearLocal={handleMigrationClearLocal}
          loading={migrationLoading}
        />
      )}
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
