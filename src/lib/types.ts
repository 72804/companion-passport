export type CompanionType =
  | "Friend"
  | "Romantic"
  | "Coach"
  | "Flirty Dating Practice"
  | "Emotional Support"
  | "Custom";

export type Tone =
  | "Soft"
  | "Playful"
  | "Calm"
  | "Funny"
  | "Motivational"
  | "Mysterious"
  | "Direct";

export type LanguageStyle = "English" | "Turkish" | "Turkish-English mixed";

export type AvatarStyle =
  | "minimal"
  | "warm"
  | "cosmic"
  | "nature"
  | "tech"
  | "classic";

export interface Boundaries {
  noSexualContent: boolean;
  noToxicJealousy: boolean;
  noDependencyEncouragement: boolean;
  noSelfHarmEncouragement: boolean;
  adultOnlyMode: boolean;
}

export interface CompanionProfile {
  id: string;
  name: string;
  type: CompanionType;
  tone: Tone;
  languageStyle: LanguageStyle;
  boundaries: Boundaries;
  avatarStyle: AvatarStyle;
  createdAt: string;
}

export type MemoryCategory =
  | "like"
  | "dislike"
  | "routine"
  | "communication_style"
  | "personal_fact"
  | "boundary"
  | "robot_preference";

/** @deprecated Legacy categories — normalized on load */
export type LegacyMemoryCategory =
  | "fact"
  | "preference"
  | "other";

export type CompanionMemoryCategory = MemoryCategory | LegacyMemoryCategory;

export interface CompanionMemory {
  id: string;
  content: string;
  category: CompanionMemoryCategory;
  source: "chat" | "manual";
  createdAt: string;
  approved: boolean;
}

export interface MemorySuggestion {
  id: string;
  text: string;
  category: MemoryCategory;
  sourceMessage: string;
  createdAt: string;
}

export interface Routines {
  morningCheckIn: string;
  eveningCheckIn: string;
  reminders: string;
}

export interface RobotReadiness {
  voicePreference: string;
  physicalStylePreference: string;
  desiredBehaviors: string[];
  transferProgress: number;
}

export interface CompanionPassport {
  profile: CompanionProfile | null;
  likes: string[];
  dislikes: string[];
  preferredCommunicationStyle: string;
  memories: CompanionMemory[];
  routines: Routines;
  boundaries: Boundaries;
  robotReadiness: RobotReadiness;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type RobotType =
  | "desktop cute robot"
  | "humanoid-style companion"
  | "smart speaker style"
  | "mobile app only for now";

export type PriceRange =
  | "under $100"
  | "$100–$300"
  | "$300–$700"
  | "$700+";

export type DepositWillingness = "yes" | "maybe" | "no";

export type RobotBehavior =
  | "talk"
  | "remember me"
  | "react emotionally"
  | "move around"
  | "send voice messages"
  | "wake me up / daily routines";

export type DepositOption =
  | "yes $10"
  | "yes $25"
  | "maybe"
  | "no";

export type RobotFormFactor =
  | "desktop robot"
  | "mobile robot"
  | "voice device"
  | "AR/avatar"
  | "not sure";

export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  robotType: RobotType;
  priceRange: PriceRange;
  depositWillingness: DepositWillingness;
  desiredBehaviors: RobotBehavior[];
  notes?: string;
  submittedAt: string;
  formFactor?: RobotFormFactor;
  realisticPrice?: PriceRange;
  depositOption?: DepositOption;
  buyMotivators?: string;
  buyConcerns?: string;
}

export type AiProvider =
  | "openai"
  | "openai-compatible"
  | "claude"
  | "gemini"
  | "mock";

export type ReminderPreference = "morning" | "evening" | "none";

export interface AppSettings {
  mockAiMode: boolean;
  aiProvider: AiProvider;
  reminderPreference: ReminderPreference;
}

export interface ChatRequestPayload {
  userMessage: string;
  recentMessages: ChatMessage[];
  profile: CompanionProfile;
  passport: CompanionPassport;
  provider: AiProvider;
  mockAiMode: boolean;
}

export interface ChatResponsePayload {
  message: string;
  provider: AiProvider;
  usedFallback: boolean;
  fallbackReason?: string;
  streamed?: boolean;
}

export interface AppData {
  passport: CompanionPassport;
  /** @deprecated Migrated to chatHistoryByCompanion */
  chatMessages?: ChatMessage[];
  chatHistoryByCompanion: Record<string, ChatMessage[]>;
  memoryReviewQueue: MemorySuggestion[];
  waitlistEntries: WaitlistEntry[];
  settings: AppSettings;
}
