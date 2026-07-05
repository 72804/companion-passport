export const FEEDBACK_CATEGORIES = [
  { value: "bug", label: "Bug" },
  { value: "confusing", label: "Confusing UX" },
  { value: "feature_request", label: "Feature request" },
  { value: "robot_interest", label: "Robot interest" },
  { value: "privacy_concern", label: "Privacy concern" },
  { value: "general", label: "General" },
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["value"];
