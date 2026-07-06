-- Companion Passport — billing, usage tracking, paid plan interest

-- ---------------------------------------------------------------------------
-- user_subscriptions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_plan_id_idx ON user_subscriptions(plan_id);

-- ---------------------------------------------------------------------------
-- usage_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  event_type TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT usage_events_actor_check CHECK (
    user_id IS NOT NULL OR anonymous_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS usage_events_user_id_idx ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS usage_events_event_type_idx ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS usage_events_created_at_idx ON usage_events(created_at);

-- ---------------------------------------------------------------------------
-- paid_plan_interest
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS paid_plan_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  email TEXT,
  plan_id TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT paid_plan_interest_actor_check CHECK (
    user_id IS NOT NULL OR anonymous_id IS NOT NULL OR email IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS paid_plan_interest_plan_id_idx ON paid_plan_interest(plan_id);
CREATE INDEX IF NOT EXISTS paid_plan_interest_created_at_idx ON paid_plan_interest(created_at);

-- ---------------------------------------------------------------------------
-- robot_waitlist early-access fields
-- ---------------------------------------------------------------------------
ALTER TABLE robot_waitlist
  ADD COLUMN IF NOT EXISTS form_factor TEXT,
  ADD COLUMN IF NOT EXISTS realistic_price TEXT,
  ADD COLUMN IF NOT EXISTS deposit_option TEXT,
  ADD COLUMN IF NOT EXISTS buy_motivators TEXT,
  ADD COLUMN IF NOT EXISTS buy_concerns TEXT;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE paid_plan_interest ENABLE ROW LEVEL SECURITY;

-- user_subscriptions: users read own row only
CREATE POLICY "subscriptions_select_own"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- usage_events: users read/insert own rows
CREATE POLICY "usage_select_own"
  ON usage_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "usage_insert_authenticated"
  ON usage_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "usage_insert_anonymous"
  ON usage_events FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND anonymous_id IS NOT NULL);

CREATE POLICY "usage_insert_authenticated_anonymous"
  ON usage_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL AND anonymous_id IS NOT NULL);

-- paid_plan_interest: insert for all; no public read
CREATE POLICY "paid_interest_insert_authenticated"
  ON paid_plan_interest FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "paid_interest_insert_anonymous"
  ON paid_plan_interest FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND anonymous_id IS NOT NULL);

GRANT INSERT ON TABLE public.usage_events TO anon, authenticated;
GRANT SELECT ON TABLE public.usage_events TO authenticated;
GRANT SELECT ON TABLE public.user_subscriptions TO authenticated;
GRANT INSERT ON TABLE public.paid_plan_interest TO anon, authenticated;

-- Auto-create free subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_id, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();
