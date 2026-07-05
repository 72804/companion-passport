import { verifyAdminRequest } from "@/lib/admin/verifyAdmin";
import { NextResponse } from "next/server";

interface AnalyticsRow {
  event_name: string;
  event_properties: Record<string, unknown>;
  user_id: string | null;
  anonymous_id: string | null;
  page_path: string | null;
  created_at: string;
}

interface FeedbackRow {
  category: string | null;
}

function countEvents(rows: AnalyticsRow[], name: string): number {
  return rows.filter((r) => r.event_name === name).length;
}

function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function countByProperty(
  rows: AnalyticsRow[],
  eventName: string,
  propKey: string
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.event_name !== eventName) continue;
    const val = row.event_properties?.[propKey];
    if (val === undefined || val === null) continue;
    const key = String(val);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function countFeedbackCategories(rows: FeedbackRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = row.category ?? "uncategorized";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function buildInterpretation(summary: {
  betaStarters: number;
  companionCompletionRate: number;
  firstMessageRate: number;
  memoryApprovalRate: number;
  passportViewRate: number;
  waitlistConversion: number;
  feedbackCount: number;
}): { strong: string[]; attention: string[]; insufficient: string[] } {
  const strong: string[] = [];
  const attention: string[] = [];
  const insufficient: string[] = [];

  if (summary.betaStarters < 5) {
    insufficient.push("Not enough beta starters yet — need at least 5 to interpret trends.");
    return { strong, attention, insufficient };
  }

  if (summary.companionCompletionRate >= 50) {
    strong.push("Strong signal: most beta starters finish companion creation.");
  } else if (summary.companionCompletionRate < 30) {
    attention.push("Needs attention: many testers drop off before completing companion setup.");
  }

  if (summary.firstMessageRate >= 60) {
    strong.push("Strong signal: testers who create companions usually send a first message.");
  } else if (summary.firstMessageRate < 40) {
    attention.push("Needs attention: companion creation is not leading to first chat.");
  }

  if (summary.memoryApprovalRate >= 40) {
    strong.push("Strong signal: memory approval flow is being used.");
  } else if (summary.memoryApprovalRate > 0 && summary.memoryApprovalRate < 20) {
    attention.push("Needs attention: few suggested memories are being approved.");
  }

  if (summary.passportViewRate >= 50) {
    strong.push("Strong signal: testers are viewing their Companion Passport.");
  } else if (summary.passportViewRate < 25) {
    attention.push("Needs attention: passport page may need clearer discovery.");
  }

  if (summary.waitlistConversion >= 15) {
    strong.push("Strong signal: robot waitlist interest from beta testers.");
  }

  if (summary.feedbackCount === 0) {
    attention.push("Needs attention: no feedback submitted yet — remind testers to use the footer link.");
  } else if (summary.feedbackCount >= 3) {
    strong.push("Strong signal: testers are sending feedback.");
  }

  if (strong.length === 0 && attention.length === 0) {
    insufficient.push("Metrics are mixed — collect more sessions before drawing conclusions.");
  }

  return { strong, attention, insufficient };
}

function dailyActiveUsers(rows: AnalyticsRow[], days: number): { date: string; count: number }[] {
  const result: { date: string; count: number }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayStart = new Date(dateStr);
    const dayEnd = new Date(dateStr);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const actors = new Set<string>();
    for (const row of rows) {
      const t = new Date(row.created_at);
      if (t >= dayStart && t < dayEnd) {
        actors.add(row.user_id ?? row.anonymous_id ?? "unknown");
      }
    }
    result.push({ date: dateStr, count: actors.size });
  }
  return result;
}

function eventsOverTime(rows: AnalyticsRow[], days: number): { date: string; count: number }[] {
  const result: { date: string; count: number }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayStart = new Date(dateStr);
    const dayEnd = new Date(dateStr);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const count = rows.filter((r) => {
      const t = new Date(r.created_at);
      return t >= dayStart && t < dayEnd;
    }).length;

    result.push({ date: dateStr, count });
  }
  return result;
}

export async function POST(request: Request) {
  const verified = await verifyAdminRequest(request);
  if ("error" in verified && verified.error) return verified.error;

  const { supabase } = verified;
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data: events, error: eventsError } = await supabase!
    .from("analytics_events")
    .select("event_name, event_properties, user_id, anonymous_id, page_path, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  const rows = (events ?? []) as AnalyticsRow[];

  const { data: waitlist } = await supabase!
    .from("robot_waitlist")
    .select("price_range, deposit_interest, preferred_robot_type");

  const memorySuggested = countEvents(rows, "memory_suggested");
  const memoryApproved = countEvents(rows, "memory_approved");
  const betaStarters = countEvents(rows, "beta_start_clicked");
  const companionCompleted = countEvents(rows, "companion_creation_completed");
  const chatMessages = countEvents(rows, "chat_message_sent");
  const passportViewed = countEvents(rows, "passport_viewed");
  const waitlistSubmitted = countEvents(rows, "robot_waitlist_submitted");

  const { data: feedbackRows, error: feedbackError } = await supabase!
    .from("feedback")
    .select("category")
    .gte("created_at", since.toISOString());

  if (feedbackError) {
    return NextResponse.json({ error: feedbackError.message }, { status: 500 });
  }

  const feedback = (feedbackRows ?? []) as FeedbackRow[];
  const feedbackCategories = countFeedbackCategories(feedback);

  const betaSummary = {
    betaStarters,
    companionCompletionRate: rate(companionCompleted, betaStarters),
    firstMessageRate: rate(chatMessages, companionCompleted),
    memoryApprovalRate:
      memorySuggested > 0 ? Math.round((memoryApproved / memorySuggested) * 100) : 0,
    passportViewRate: rate(passportViewed, companionCompleted),
    waitlistConversion: rate(waitlistSubmitted, betaStarters),
    feedbackCount: feedback.length,
    feedbackCategories,
  };

  const interpretation = buildInterpretation(betaSummary);

  const depositBreakdown: Record<string, number> = {};
  for (const w of waitlist ?? []) {
    const key = w.deposit_interest ?? "unknown";
    depositBreakdown[key] = (depositBreakdown[key] ?? 0) + 1;
  }

  const priceBreakdown: Record<string, number> = {};
  for (const w of waitlist ?? []) {
    const key = w.price_range ?? "unknown";
    priceBreakdown[key] = (priceBreakdown[key] ?? 0) + 1;
  }

  return NextResponse.json({
    cards: {
      totalSignups: countEvents(rows, "signup_completed"),
      totalCompanions: countEvents(rows, "companion_creation_completed"),
      totalChatMessages: countEvents(rows, "chat_message_sent"),
      totalMemoriesSuggested: memorySuggested,
      totalMemoriesApproved: memoryApproved,
      memoryApprovalRate:
        memorySuggested > 0
          ? Math.round((memoryApproved / memorySuggested) * 100)
          : 0,
      totalWaitlistSubmissions: countEvents(rows, "robot_waitlist_submitted"),
      depositBreakdown,
    },
    funnel: {
      betaPageViewed: countEvents(rows, "beta_page_viewed"),
      betaStartClicked: countEvents(rows, "beta_start_clicked"),
      landingViewed: countEvents(rows, "landing_viewed"),
      createCompanionClicked: countEvents(rows, "create_companion_clicked"),
      companionCompleted: countEvents(rows, "companion_creation_completed"),
      chatOpened: countEvents(rows, "chat_opened"),
      memoryApproved,
      passportViewed: countEvents(rows, "passport_viewed"),
      waitlistSubmitted: countEvents(rows, "robot_waitlist_submitted"),
    },
    breakdowns: {
      companionType: countByProperty(rows, "companion_creation_completed", "companion_type"),
      languageStyle: countByProperty(rows, "companion_creation_completed", "language_style"),
      aiMode: countByProperty(rows, "chat_message_sent", "mode"),
      fallbackUsed: rows.filter(
        (r) =>
          r.event_name === "ai_reply_received" &&
          r.event_properties?.fallback_used === true
      ).length,
      priceRange: priceBreakdown,
    },
    dailyActiveUsers: dailyActiveUsers(rows, 14),
    eventsOverTime: eventsOverTime(rows, 14),
    betaSummary,
    interpretation,
    debug: {
      totalEventCount: rows.length,
      debugTestEventCount: countEvents(rows, "debug_test_event"),
      latestEvents: rows.slice(0, 10).map((r) => ({
        event_name: r.event_name,
        created_at: r.created_at,
        page_path: r.page_path,
      })),
    },
  });
}
