-- Companion Passport — analytics + feedback (privacy-conscious, no raw chat/memory text)

-- ---------------------------------------------------------------------------
-- analytics_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  event_name TEXT NOT NULL,
  event_properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT analytics_actor_check CHECK (
    user_id IS NOT NULL OR anonymous_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS analytics_events_event_name_idx ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS analytics_events_anonymous_id_idx ON analytics_events(anonymous_id);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Insert only: authenticated users attach their user_id; anonymous users use anonymous_id
CREATE POLICY "analytics_insert_authenticated"
  ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "analytics_insert_anonymous"
  ON analytics_events FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND anonymous_id IS NOT NULL);

-- No SELECT/UPDATE/DELETE for regular users — admin reads via service role API

-- ---------------------------------------------------------------------------
-- feedback
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  rating INT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  message TEXT NOT NULL,
  page_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT feedback_actor_check CHECK (
    user_id IS NOT NULL OR anonymous_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback(created_at);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_insert_authenticated"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "feedback_insert_anonymous"
  ON feedback FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND anonymous_id IS NOT NULL);
