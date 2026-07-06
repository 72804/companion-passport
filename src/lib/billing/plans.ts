export type PlanId = "free" | "plus" | "founder";

export interface PlanLimits {
  aiMessagesPerMonth: number;
  companions: number;
  approvedMemories: number;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  priceLabel: string;
  limits: PlanLimits;
  features: string[];
  badge?: string;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    priceLabel: "$0",
    limits: {
      aiMessagesPerMonth: 30,
      companions: 1,
      approvedMemories: 20,
    },
    features: [
      "30 AI messages per month",
      "1 companion",
      "20 approved memories",
      "Unlimited mock mode",
      "Robot waitlist access",
    ],
  },
  plus: {
    id: "plus",
    name: "Plus",
    monthlyPrice: 9,
    priceLabel: "$9/mo",
    limits: {
      aiMessagesPerMonth: 1000,
      companions: 3,
      approvedMemories: 500,
    },
    features: [
      "1,000 AI messages per month",
      "Up to 3 companions",
      "500 approved memories",
      "Priority AI mode",
      "Advanced Passport export",
      "Robot early-access priority",
    ],
  },
  founder: {
    id: "founder",
    name: "Founder",
    monthlyPrice: 29,
    priceLabel: "$29/mo",
    limits: {
      aiMessagesPerMonth: 5000,
      companions: 10,
      approvedMemories: 2000,
    },
    features: [
      "5,000 AI messages per month",
      "Up to 10 companions",
      "2,000 approved memories",
      "Priority robot early-access",
      "Founder badge",
      "Early hardware pilot access",
    ],
    badge: "Founder",
  },
};

export const PLAN_LIST: PlanDefinition[] = [PLANS.free, PLANS.plus, PLANS.founder];

export const DEMO_AI_MESSAGE_LIMIT_LOGGED_OUT = 5;

export function getPlan(planId: string | null | undefined): PlanDefinition {
  if (planId && planId in PLANS) return PLANS[planId as PlanId];
  return PLANS.free;
}
