-- Companion Passport — initial Supabase schema
-- Run in Supabase SQL Editor or via Supabase CLI

-- ---------------------------------------------------------------------------
-- companions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  companion_type TEXT NOT NULL,
  tone TEXT NOT NULL,
  language_style TEXT NOT NULL,
  avatar_style TEXT NOT NULL,
  boundaries JSONB NOT NULL DEFAULT '{}'::jsonb,
  passport_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- passport_snapshot stores: likes, dislikes, preferredCommunicationStyle,
-- routines, robotReadiness (companion-level passport fields beyond memories)

CREATE INDEX IF NOT EXISTS companions_user_id_idx ON companions(user_id);

-- ---------------------------------------------------------------------------
-- passport_memories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS passport_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  source_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS passport_memories_user_id_idx ON passport_memories(user_id);
CREATE INDEX IF NOT EXISTS passport_memories_companion_id_idx ON passport_memories(companion_id);

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_companion_id_idx ON chat_messages(companion_id);
CREATE INDEX IF NOT EXISTS chat_messages_user_companion_idx ON chat_messages(user_id, companion_id);

-- ---------------------------------------------------------------------------
-- memory_suggestions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memory_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  source_message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ignored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memory_suggestions_companion_id_idx ON memory_suggestions(companion_id);

-- ---------------------------------------------------------------------------
-- robot_waitlist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS robot_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  preferred_robot_type TEXT NOT NULL,
  price_range TEXT NOT NULL,
  deposit_interest TEXT NOT NULL,
  desired_behaviors TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS robot_waitlist_user_id_idx ON robot_waitlist(user_id);
CREATE INDEX IF NOT EXISTS robot_waitlist_email_idx ON robot_waitlist(email);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS companions_updated_at ON companions;
CREATE TRIGGER companions_updated_at
  BEFORE UPDATE ON companions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS passport_memories_updated_at ON passport_memories;
CREATE TRIGGER passport_memories_updated_at
  BEFORE UPDATE ON passport_memories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE robot_waitlist ENABLE ROW LEVEL SECURITY;

-- companions
CREATE POLICY "companions_select_own" ON companions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "companions_insert_own" ON companions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "companions_update_own" ON companions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "companions_delete_own" ON companions FOR DELETE USING (auth.uid() = user_id);

-- passport_memories
CREATE POLICY "passport_memories_select_own" ON passport_memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "passport_memories_insert_own" ON passport_memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "passport_memories_update_own" ON passport_memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "passport_memories_delete_own" ON passport_memories FOR DELETE USING (auth.uid() = user_id);

-- chat_messages
CREATE POLICY "chat_messages_select_own" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_insert_own" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_messages_update_own" ON chat_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_delete_own" ON chat_messages FOR DELETE USING (auth.uid() = user_id);

-- memory_suggestions
CREATE POLICY "memory_suggestions_select_own" ON memory_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "memory_suggestions_insert_own" ON memory_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memory_suggestions_update_own" ON memory_suggestions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "memory_suggestions_delete_own" ON memory_suggestions FOR DELETE USING (auth.uid() = user_id);

-- robot_waitlist: anyone can insert; users view own entries only
CREATE POLICY "robot_waitlist_insert" ON robot_waitlist FOR INSERT WITH CHECK (
  user_id IS NULL OR auth.uid() = user_id
);
CREATE POLICY "robot_waitlist_select_own" ON robot_waitlist FOR SELECT USING (
  auth.uid() = user_id
);
