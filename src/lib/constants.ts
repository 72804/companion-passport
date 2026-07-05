import type {
  AiProvider,
  AvatarStyle,
  CompanionType,
  LanguageStyle,
  MemoryCategory,
  RobotBehavior,
  RobotType,
  Tone,
} from "./types";

export const COMPANION_TYPES: CompanionType[] = [
  "Friend",
  "Romantic",
  "Coach",
  "Flirty Dating Practice",
  "Emotional Support",
  "Custom",
];

export const TONES: Tone[] = [
  "Soft",
  "Playful",
  "Calm",
  "Funny",
  "Motivational",
  "Mysterious",
  "Direct",
];

export const LANGUAGE_STYLES: LanguageStyle[] = [
  "English",
  "Turkish",
  "Turkish-English mixed",
];

export const AVATAR_STYLES: {
  id: AvatarStyle;
  label: string;
  emoji: string;
  gradient: string;
}[] = [
  { id: "minimal", label: "Minimal", emoji: "◯", gradient: "from-slate-600 to-slate-800" },
  { id: "warm", label: "Warm", emoji: "☀", gradient: "from-amber-600 to-orange-800" },
  { id: "cosmic", label: "Cosmic", emoji: "✦", gradient: "from-violet-600 to-indigo-900" },
  { id: "nature", label: "Nature", emoji: "🌿", gradient: "from-emerald-600 to-teal-900" },
  { id: "tech", label: "Tech", emoji: "◇", gradient: "from-cyan-600 to-blue-900" },
  { id: "classic", label: "Classic", emoji: "◆", gradient: "from-rose-600 to-purple-900" },
];

export const ROBOT_TYPES: RobotType[] = [
  "desktop cute robot",
  "humanoid-style companion",
  "smart speaker style",
  "mobile app only for now",
];

export const PRICE_RANGES = [
  "under $100",
  "$100–$300",
  "$300–$700",
  "$700+",
] as const;

export const ROBOT_BEHAVIORS: RobotBehavior[] = [
  "talk",
  "remember me",
  "react emotionally",
  "move around",
  "send voice messages",
  "wake me up / daily routines",
];

export const DEFAULT_BOUNDARIES = {
  noSexualContent: true,
  noToxicJealousy: true,
  noDependencyEncouragement: true,
  noSelfHarmEncouragement: true,
  adultOnlyMode: false,
};

export const STORAGE_KEY = "companion-passport-data";

export const AI_PROVIDERS: { value: AiProvider; label: string }[] = [
  { value: "mock", label: "Mock only" },
  { value: "openai", label: "OpenAI" },
  { value: "openai-compatible", label: "OpenAI-compatible" },
  { value: "claude", label: "Claude" },
  { value: "gemini", label: "Gemini" },
];

/** Max messages sent to AI for context */
export const CHAT_CONTEXT_LIMIT = 20;

/** Max messages stored per companion in localStorage */
export const CHAT_STORAGE_LIMIT = 100;

export const MEMORY_CATEGORY_LABELS: Record<MemoryCategory, string> = {
  like: "Like",
  dislike: "Dislike",
  routine: "Routine",
  communication_style: "Communication style",
  personal_fact: "Personal fact",
  boundary: "Boundary",
  robot_preference: "Robot preference",
};
