import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

export const AGE_GATE_KEY = "cp-age-gate-confirmed";
export const CHECKLIST_STORAGE_KEY = "cp-beta-checklist";

export type ChecklistStepId =
  | "create_companion"
  | "first_message"
  | "approve_memory"
  | "view_passport"
  | "waitlist"
  | "feedback";

export const CHECKLIST_STEPS: { id: ChecklistStepId; label: string }[] = [
  { id: "create_companion", label: "Create your companion" },
  { id: "first_message", label: "Send your first message" },
  { id: "approve_memory", label: "Approve one memory" },
  { id: "view_passport", label: "View your Companion Passport" },
  { id: "waitlist", label: "Join or skip robot waitlist" },
  { id: "feedback", label: "Send feedback" },
];

export interface ChecklistState {
  dismissed: boolean;
  completed: ChecklistStepId[];
}

const DEFAULT_STATE: ChecklistState = { dismissed: false, completed: [] };

export function getChecklistState(): ChecklistState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as ChecklistState;
    return {
      dismissed: Boolean(parsed.dismissed),
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveChecklistState(state: ChecklistState): void {
  localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(state));
}

export function isAgeGateConfirmed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AGE_GATE_KEY) === "true";
}

/** Returns true if the step was newly completed. */
export function markChecklistStep(step: ChecklistStepId): boolean {
  const state = getChecklistState();
  if (state.completed.includes(step)) return false;

  const next: ChecklistState = {
    ...state,
    completed: [...state.completed, step],
  };
  saveChecklistState(next);

  track(ANALYTICS_EVENTS.BETA_CHECKLIST_STEP_COMPLETED, { checklist_step: step });
  return true;
}

export function dismissChecklist(): void {
  const state = getChecklistState();
  saveChecklistState({ ...state, dismissed: true });
  track(ANALYTICS_EVENTS.BETA_CHECKLIST_DISMISSED);
}

export function skipWaitlistStep(): void {
  markChecklistStep("waitlist");
}
