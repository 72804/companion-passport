/**
 * Stripe integration placeholder.
 * When STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY are set,
 * implement checkout sessions and webhook handling here.
 */

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
}

// export async function createCheckoutSession(planId: PlanId, userId: string) { ... }
// export async function handleStripeWebhook(payload: string, signature: string) { ... }
