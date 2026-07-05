import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppData,
  ChatMessage,
  CompanionMemory,
  CompanionPassport,
  CompanionProfile,
  MemorySuggestion,
  WaitlistEntry,
} from "../types";
import type { Database } from "../supabase/types";

export function normalizeMemoryText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

export function isSimilarMemoryText(a: string, b: string): boolean {
  const na = normalizeMemoryText(a);
  const nb = normalizeMemoryText(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 4 && nb.length >= 4) {
    if (na.includes(nb) || nb.includes(na)) return true;
  }
  const wordsA = new Set(na.split(" ").filter((w) => w.length > 2));
  const wordsB = nb.split(" ").filter((w) => w.length > 2);
  if (wordsA.size === 0 || wordsB.length === 0) return false;
  const overlap = wordsB.filter((w) => wordsA.has(w)).length;
  const ratio = overlap / Math.max(wordsA.size, wordsB.length);
  return ratio >= 0.75;
}

export function findSimilarApprovedMemory(
  passport: CompanionPassport,
  text: string,
  category?: string
): CompanionMemory | undefined {
  return passport.memories.find(
    (m) =>
      m.approved &&
      (!category || normalizeMemoryText(String(m.category)) === normalizeMemoryText(category)) &&
      isSimilarMemoryText(m.content, text)
  );
}

export function filterDuplicateSuggestions(
  suggestions: MemorySuggestion[],
  passport: CompanionPassport,
  queue: MemorySuggestion[]
): MemorySuggestion[] {
  return suggestions.filter((s) => {
    const inQueue = queue.some(
      (q) =>
        q.category === s.category && isSimilarMemoryText(q.text, s.text)
    );
    if (inQueue) return false;

    const approved = findSimilarApprovedMemory(passport, s.text, s.category);
    if (approved) return false;

    return true;
  });
}

export interface PassportSnapshot {
  likes: string[];
  dislikes: string[];
  preferredCommunicationStyle: string;
  routines: CompanionPassport["routines"];
  robotReadiness: CompanionPassport["robotReadiness"];
}

export function passportToSnapshot(passport: CompanionPassport): PassportSnapshot {
  return {
    likes: passport.likes,
    dislikes: passport.dislikes,
    preferredCommunicationStyle: passport.preferredCommunicationStyle,
    routines: passport.routines,
    robotReadiness: {
      ...passport.robotReadiness,
      transferProgress: passport.robotReadiness.transferProgress,
    },
  };
}

export function snapshotToPassportFields(
  snapshot: Partial<PassportSnapshot>
): Partial<CompanionPassport> {
  return {
    likes: snapshot.likes ?? [],
    dislikes: snapshot.dislikes ?? [],
    preferredCommunicationStyle: snapshot.preferredCommunicationStyle ?? "",
    routines: snapshot.routines ?? {
      morningCheckIn: "",
      eveningCheckIn: "",
      reminders: "",
    },
    robotReadiness: snapshot.robotReadiness ?? {
      voicePreference: "",
      physicalStylePreference: "",
      desiredBehaviors: [],
      transferProgress: 0,
    },
  };
}

export function profileToCompanionRow(
  profile: CompanionProfile,
  userId: string,
  passport: CompanionPassport
) {
  return {
    id: profile.id,
    user_id: userId,
    name: profile.name,
    companion_type: profile.type,
    tone: profile.tone,
    language_style: profile.languageStyle,
    avatar_style: profile.avatarStyle,
    boundaries: profile.boundaries as unknown as Database["public"]["Tables"]["companions"]["Insert"]["boundaries"],
    passport_snapshot: passportToSnapshot(passport) as unknown as Database["public"]["Tables"]["companions"]["Insert"]["passport_snapshot"],
    created_at: profile.createdAt,
    updated_at: new Date().toISOString(),
  };
}

export function rowToProfile(row: {
  id: string;
  name: string;
  companion_type: string;
  tone: string;
  language_style: string;
  avatar_style: string;
  boundaries: unknown;
  created_at: string;
}): CompanionProfile {
  return {
    id: row.id,
    name: row.name,
    type: row.companion_type as CompanionProfile["type"],
    tone: row.tone as CompanionProfile["tone"],
    languageStyle: row.language_style as CompanionProfile["languageStyle"],
    avatarStyle: row.avatar_style as CompanionProfile["avatarStyle"],
    boundaries: row.boundaries as CompanionProfile["boundaries"],
    createdAt: row.created_at,
  };
}

type Supabase = SupabaseClient<Database>;

export async function saveCompanion(
  supabase: Supabase,
  userId: string,
  passport: CompanionPassport
): Promise<void> {
  if (!passport.profile) return;

  const row = profileToCompanionRow(passport.profile, userId, passport);
  const { error } = await supabase.from("companions").upsert([row]);
  if (error) throw new Error(error.message);
}

export async function loadCompanions(
  supabase: Supabase,
  userId: string
): Promise<CompanionProfile[]> {
  const { data, error } = await supabase
    .from("companions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToProfile);
}

export async function loadCompanionPassport(
  supabase: Supabase,
  userId: string,
  companionId: string
): Promise<CompanionPassport | null> {
  const { data: companion, error: cErr } = await supabase
    .from("companions")
    .select("*")
    .eq("user_id", userId)
    .eq("id", companionId)
    .maybeSingle();

  if (cErr) throw new Error(cErr.message);
  if (!companion) return null;

  const { data: memories, error: mErr } = await supabase
    .from("passport_memories")
    .select("*")
    .eq("user_id", userId)
    .eq("companion_id", companionId)
    .order("created_at", { ascending: true });

  if (mErr) throw new Error(mErr.message);

  const snapshot = (companion.passport_snapshot ?? {}) as Partial<PassportSnapshot>;
  const profile = rowToProfile(companion);

  return {
    profile,
    boundaries: profile.boundaries,
    ...snapshotToPassportFields(snapshot),
    memories: (memories ?? []).map((m) => ({
      id: m.id,
      content: m.text,
      category: m.category as CompanionMemory["category"],
      source: "chat" as const,
      createdAt: m.created_at,
      approved: true,
    })),
  } as CompanionPassport;
}

export async function loadPrimaryPassport(
  supabase: Supabase,
  userId: string
): Promise<CompanionPassport> {
  const { data: companions, error } = await supabase
    .from("companions")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  if (!companions?.[0]) {
    return {
      profile: null,
      likes: [],
      dislikes: [],
      preferredCommunicationStyle: "",
      memories: [],
      routines: { morningCheckIn: "", eveningCheckIn: "", reminders: "" },
      boundaries: {
        noSexualContent: true,
        noToxicJealousy: true,
        noDependencyEncouragement: true,
        noSelfHarmEncouragement: true,
        adultOnlyMode: false,
      },
      robotReadiness: {
        voicePreference: "",
        physicalStylePreference: "",
        desiredBehaviors: [],
        transferProgress: 0,
      },
    };
  }

  const passport = await loadCompanionPassport(supabase, userId, companions[0].id);
  return passport!;
}

export async function savePassportMemory(
  supabase: Supabase,
  userId: string,
  companionId: string,
  memory: CompanionMemory,
  sourceMessage?: string
): Promise<void> {
  const { error } = await supabase.from("passport_memories").upsert([
    {
      id: memory.id,
      user_id: userId,
      companion_id: companionId,
      category: String(memory.category),
      text: memory.content,
      source_message: sourceMessage ?? null,
      created_at: memory.createdAt,
      updated_at: new Date().toISOString(),
    },
  ]);
  if (error) throw new Error(error.message);
}

export async function deletePassportMemory(
  supabase: Supabase,
  userId: string,
  memoryId: string
): Promise<void> {
  const { error } = await supabase
    .from("passport_memories")
    .delete()
    .eq("user_id", userId)
    .eq("id", memoryId);
  if (error) throw new Error(error.message);
}

export async function saveChatMessage(
  supabase: Supabase,
  userId: string,
  companionId: string,
  message: ChatMessage,
  provider?: string
): Promise<void> {
  const { error } = await supabase.from("chat_messages").upsert([
    {
      id: message.id,
      user_id: userId,
      companion_id: companionId,
      role: message.role,
      content: message.content,
      provider: provider ?? null,
      created_at: message.timestamp,
    },
  ]);
  if (error) throw new Error(error.message);
}

export async function loadChatHistory(
  supabase: Supabase,
  userId: string,
  companionId: string,
  limit = 100
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", userId)
    .eq("companion_id", companionId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    timestamp: m.created_at,
  }));
}

export async function clearChatHistory(
  supabase: Supabase,
  userId: string,
  companionId: string
): Promise<void> {
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("user_id", userId)
    .eq("companion_id", companionId);
  if (error) throw new Error(error.message);
}

export async function saveMemorySuggestion(
  supabase: Supabase,
  userId: string,
  companionId: string,
  suggestion: MemorySuggestion
): Promise<void> {
  const { error } = await supabase.from("memory_suggestions").upsert([
    {
      id: suggestion.id,
      user_id: userId,
      companion_id: companionId,
      category: suggestion.category,
      text: suggestion.text,
      source_message: suggestion.sourceMessage,
      status: "pending",
      created_at: suggestion.createdAt,
    },
  ]);
  if (error) throw new Error(error.message);
}

export async function updateMemorySuggestionStatus(
  supabase: Supabase,
  userId: string,
  suggestionId: string,
  status: "approved" | "ignored"
): Promise<void> {
  const { error } = await supabase
    .from("memory_suggestions")
    .update({ status })
    .eq("user_id", userId)
    .eq("id", suggestionId);
  if (error) throw new Error(error.message);
}

export async function loadMemorySuggestions(
  supabase: Supabase,
  userId: string,
  companionId: string
): Promise<MemorySuggestion[]> {
  const { data, error } = await supabase
    .from("memory_suggestions")
    .select("*")
    .eq("user_id", userId)
    .eq("companion_id", companionId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((s) => ({
    id: s.id,
    text: s.text,
    category: s.category as MemorySuggestion["category"],
    sourceMessage: s.source_message,
    createdAt: s.created_at,
  }));
}

export async function saveWaitlistEntry(
  supabase: Supabase,
  entry: WaitlistEntry,
  userId?: string | null
): Promise<void> {
  const { error } = await supabase.from("robot_waitlist").insert([
    {
      id: entry.id,
      user_id: userId ?? null,
      name: entry.name,
      email: entry.email,
      preferred_robot_type: entry.robotType,
      price_range: entry.priceRange,
      deposit_interest: entry.depositWillingness,
      desired_behaviors: entry.desiredBehaviors,
      notes: entry.notes ?? null,
      created_at: entry.submittedAt,
    },
  ]);
  if (error) throw new Error(error.message);
}

export async function loadUserWaitlistEntries(
  supabase: Supabase,
  userId: string
): Promise<WaitlistEntry[]> {
  const { data, error } = await supabase
    .from("robot_waitlist")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    email: w.email,
    robotType: w.preferred_robot_type as WaitlistEntry["robotType"],
    priceRange: w.price_range as WaitlistEntry["priceRange"],
    depositWillingness: w.deposit_interest as WaitlistEntry["depositWillingness"],
    desiredBehaviors: w.desired_behaviors as WaitlistEntry["desiredBehaviors"],
    notes: w.notes ?? undefined,
    submittedAt: w.created_at,
  }));
}

export async function deleteUserCloudData(
  supabase: Supabase,
  userId: string
): Promise<void> {
  const { error } = await supabase.from("companions").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function syncAppDataToCloud(
  supabase: Supabase,
  userId: string,
  data: AppData
): Promise<void> {
  const passport = data.passport;
  if (!passport.profile) return;

  const companionId = passport.profile.id;

  await saveCompanion(supabase, userId, passport);

  const { data: existingMemories } = await supabase
    .from("passport_memories")
    .select("id")
    .eq("user_id", userId)
    .eq("companion_id", companionId);

  const existingIds = new Set((existingMemories ?? []).map((m) => m.id));
  const currentIds = new Set(passport.memories.map((m) => m.id));

  for (const id of existingIds) {
    if (!currentIds.has(id)) {
      await deletePassportMemory(supabase, userId, id);
    }
  }

  for (const memory of passport.memories) {
    if (memory.approved) {
      await savePassportMemory(supabase, userId, companionId, memory);
    }
  }

  const chat = data.chatHistoryByCompanion[companionId] ?? [];
  for (const msg of chat) {
    await saveChatMessage(supabase, userId, companionId, msg);
  }

  for (const suggestion of data.memoryReviewQueue) {
    await saveMemorySuggestion(supabase, userId, companionId, suggestion);
  }
}

export async function loadAppDataFromCloud(
  supabase: Supabase,
  userId: string
): Promise<AppData> {
  const passport = await loadPrimaryPassport(supabase, userId);
  const chatHistoryByCompanion: Record<string, ChatMessage[]> = {};
  const memoryReviewQueue: MemorySuggestion[] = [];

  if (passport.profile) {
    chatHistoryByCompanion[passport.profile.id] = await loadChatHistory(
      supabase,
      userId,
      passport.profile.id
    );
    memoryReviewQueue.push(
      ...(await loadMemorySuggestions(supabase, userId, passport.profile.id))
    );
  }

  const waitlistEntries = await loadUserWaitlistEntries(supabase, userId);

  return {
    passport,
    chatHistoryByCompanion,
    memoryReviewQueue,
    waitlistEntries,
    settings: { mockAiMode: true, aiProvider: "mock" },
  };
}

export function hasLocalDemoData(data: AppData): boolean {
  return Boolean(
    data.passport.profile ||
      data.passport.memories.length > 0 ||
      Object.keys(data.chatHistoryByCompanion).some(
        (k) => (data.chatHistoryByCompanion[k]?.length ?? 0) > 0
      ) ||
      data.memoryReviewQueue.length > 0 ||
      data.waitlistEntries.length > 0
  );
}

export async function migrateLocalToCloud(
  supabase: Supabase,
  userId: string,
  localData: AppData
): Promise<void> {
  await syncAppDataToCloud(supabase, userId, localData);

  for (const entry of localData.waitlistEntries) {
    try {
      await saveWaitlistEntry(supabase, entry, userId);
    } catch {
      // skip duplicate waitlist emails if any
    }
  }
}
