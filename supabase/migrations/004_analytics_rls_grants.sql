-- Analytics RLS + grants fix for client inserts (anon + authenticated)

GRANT INSERT ON TABLE public.analytics_events TO anon, authenticated;
GRANT INSERT ON TABLE public.feedback TO anon, authenticated;

-- Authenticated session but user_id not yet attached (edge case / race)
DROP POLICY IF EXISTS "analytics_insert_authenticated_anonymous" ON analytics_events;
CREATE POLICY "analytics_insert_authenticated_anonymous"
  ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL AND anonymous_id IS NOT NULL);
