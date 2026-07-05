import type { AppData, CompanionPassport } from "./types";

export function exportPassportAsJson(passport: CompanionPassport): string {
  return JSON.stringify(passport, null, 2);
}

export function exportAllDataAsJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function downloadJson(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function calculateRobotReadinessProgress(passport: CompanionPassport): number {
  let score = 0;
  const checks = [
    passport.profile !== null,
    passport.memories.filter((m) => m.approved).length >= 1,
    passport.likes.length >= 1 || passport.dislikes.length >= 1,
    Boolean(passport.routines.morningCheckIn || passport.routines.eveningCheckIn),
    Boolean(passport.preferredCommunicationStyle),
    Boolean(passport.robotReadiness.voicePreference),
    Boolean(passport.robotReadiness.physicalStylePreference),
    passport.robotReadiness.desiredBehaviors.length >= 1,
  ];

  checks.forEach((check) => {
    if (check) score += 12.5;
  });

  return Math.min(100, Math.round(score));
}
