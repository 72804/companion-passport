export type MonthlyUsage = {
  aiMessages: number;
  memoriesApproved: number;
  companionsCreated: number;
  passportExports: number;
};

const LOCAL_USAGE_KEY = "cp-monthly-usage";

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function loadLocalUsage(): MonthlyUsage {
  if (typeof window === "undefined") {
    return { aiMessages: 0, memoriesApproved: 0, companionsCreated: 0, passportExports: 0 };
  }
  try {
    const raw = localStorage.getItem(LOCAL_USAGE_KEY);
    if (!raw) return { aiMessages: 0, memoriesApproved: 0, companionsCreated: 0, passportExports: 0 };
    const parsed = JSON.parse(raw) as { month: string; usage: MonthlyUsage };
    if (parsed.month !== currentMonthKey()) {
      return { aiMessages: 0, memoriesApproved: 0, companionsCreated: 0, passportExports: 0 };
    }
    return parsed.usage;
  } catch {
    return { aiMessages: 0, memoriesApproved: 0, companionsCreated: 0, passportExports: 0 };
  }
}

export function saveLocalUsage(usage: MonthlyUsage): void {
  localStorage.setItem(
    LOCAL_USAGE_KEY,
    JSON.stringify({ month: currentMonthKey(), usage })
  );
}
