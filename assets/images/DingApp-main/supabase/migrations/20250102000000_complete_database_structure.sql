/*
  DingApp - Complete Database Structure
  Tüm uygulama özelliklerini destekleyen kapsamlı veritabanı yapısı
*/

BEGIN;

-- ==================================================
-- CORE TABLES
-- ==================================================

-- Users with educational info
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  is_pro boolean DEFAULT false,
  grade text,
  target_profession text,
  exam_score integer,
  strong_subjects text[],
  weak_subjects text[]
);

-- Chat system
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_private boolean DEFAULT false,
  password_hash text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_room_members (
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE
);

-- Watch system
CREATE TABLE IF NOT EXISTS watch_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  video_url text NOT NULL,
  is_private boolean DEFAULT false,
  password_hash text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS watch_room_members (
  room_id uuid REFERENCES watch_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS watch_room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES watch_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Study system (sessions first for FK reference)
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  duration integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS study_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_private boolean DEFAULT false,
  password_hash text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_room_members (
  room_id uuid REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  current_session_id uuid REFERENCES study_sessions(id) ON DELETE SET NULL,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS study_leaderboard (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_duration integer NOT NULL DEFAULT 0,
  rank integer,
  updated_at timestamptz DEFAULT now()
);

-- AI system
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  description text NOT NULL,
  subject text NOT NULL,
  due_date timestamptz NOT NULL,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ==================================================
-- STORAGE BUCKETS
-- ==================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_files', 'chat_files', true), ('user_avatars', 'user_avatars', true)
ON CONFLICT DO NOTHING;

-- ==================================================
-- ROW LEVEL SECURITY
-- ==================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON ' || quote_ident(tablename) || ';', E'\n')
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename IN (
      'users', 'chat_rooms', 'chat_messages', 'chat_room_members', 'chat_files',
      'watch_rooms', 'watch_room_members', 'watch_room_messages',
      'study_rooms', 'study_room_members', 'study_sessions', 'study_leaderboard',
      'ai_chat_history', 'user_assignments'
    )
  );
END $$;

-- Users policies
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_update" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Chat policies
CREATE POLICY "chat_rooms_select" ON chat_rooms FOR SELECT TO authenticated 
USING (NOT is_private OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_rooms.id AND user_id = auth.uid()));
CREATE POLICY "chat_rooms_insert" ON chat_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "chat_rooms_delete" ON chat_rooms FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM chat_rooms WHERE id = chat_messages.room_id AND (NOT is_private OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_messages.room_id AND user_id = auth.uid()))));
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM chat_rooms WHERE id = chat_messages.room_id AND (NOT is_private OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_messages.room_id AND user_id = auth.uid()))));

CREATE POLICY "chat_room_members_select" ON chat_room_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "chat_room_members_insert" ON chat_room_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_room_members_delete" ON chat_room_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "chat_files_select" ON chat_files FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM chat_rooms WHERE id = chat_files.room_id AND (NOT is_private OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_files.room_id AND user_id = auth.uid()))));
CREATE POLICY "chat_files_insert" ON chat_files FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM chat_rooms WHERE id = chat_files.room_id AND (NOT is_private OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_files.room_id AND user_id = auth.uid()))));
CREATE POLICY "chat_files_delete" ON chat_files FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- Watch policies
CREATE POLICY "watch_rooms_select" ON watch_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "watch_rooms_insert" ON watch_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "watch_rooms_delete" ON watch_rooms FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "watch_room_members_select" ON watch_room_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "watch_room_members_insert" ON watch_room_members FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "watch_room_members_delete" ON watch_room_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "watch_room_messages_select" ON watch_room_messages FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM watch_room_members WHERE room_id = watch_room_messages.room_id AND user_id = auth.uid()));
CREATE POLICY "watch_room_messages_insert" ON watch_room_messages FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM watch_room_members WHERE room_id = watch_room_messages.room_id AND user_id = auth.uid()));

-- Study policies
CREATE POLICY "study_rooms_select" ON study_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "study_rooms_insert" ON study_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "study_rooms_delete" ON study_rooms FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "study_room_members_select" ON study_room_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "study_room_members_insert" ON study_room_members FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM study_rooms WHERE id = room_id));
CREATE POLICY "study_room_members_update" ON study_room_members FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "study_room_members_delete" ON study_room_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "study_sessions_select" ON study_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "study_sessions_insert" ON study_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "study_sessions_update" ON study_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "study_leaderboard_select" ON study_leaderboard FOR SELECT TO authenticated USING (true);
CREATE POLICY "study_leaderboard_insert" ON study_leaderboard FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "study_leaderboard_update" ON study_leaderboard FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- AI policies
CREATE POLICY "ai_chat_history_select" ON ai_chat_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ai_chat_history_insert" ON ai_chat_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_assignments_select" ON user_assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_assignments_insert" ON user_assignments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_assignments_update" ON user_assignments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ==================================================
-- STORAGE POLICIES
-- ==================================================

-- Drop existing storage policies
DO $$ 
BEGIN
  EXECUTE (
    SELECT COALESCE(
      string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON storage.objects;', E'\n'),
      ''
    )
    FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND (policyname LIKE '%chat_files%' OR policyname LIKE '%user_avatars%')
  );
END $$;

-- Chat files storage
CREATE POLICY "chat_files_storage_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'chat_files');
CREATE POLICY "chat_files_storage_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat_files');
CREATE POLICY "chat_files_storage_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'chat_files' AND owner = auth.uid());

-- User avatars storage
CREATE POLICY "user_avatars_storage_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'user_avatars');
CREATE POLICY "user_avatars_storage_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user_avatars' AND owner = auth.uid());
CREATE POLICY "user_avatars_storage_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'user_avatars' AND owner = auth.uid());
CREATE POLICY "user_avatars_storage_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'user_avatars' AND owner = auth.uid());

-- ==================================================
-- FUNCTIONS & TRIGGERS
-- ==================================================

-- New user handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Leaderboard updater
CREATE OR REPLACE FUNCTION public.update_leaderboard_on_session_end()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.study_leaderboard (user_id, total_duration)
  VALUES (NEW.user_id, NEW.duration)
  ON CONFLICT (user_id) DO UPDATE SET 
    total_duration = study_leaderboard.total_duration + NEW.duration,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_leaderboard_trigger ON study_sessions;
CREATE TRIGGER update_leaderboard_trigger AFTER UPDATE OF ended_at ON study_sessions 
FOR EACH ROW WHEN (NEW.ended_at IS NOT NULL) EXECUTE FUNCTION public.update_leaderboard_on_session_end();

-- ==================================================
-- INDEXES
-- ==================================================

CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);
CREATE INDEX IF NOT EXISTS chat_messages_room_id_idx ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS chat_room_members_room_id_idx ON chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS watch_room_messages_room_id_idx ON watch_room_messages(room_id);
CREATE INDEX IF NOT EXISTS watch_room_members_room_id_idx ON watch_room_members(room_id);
CREATE INDEX IF NOT EXISTS study_room_members_room_id_idx ON study_room_members(room_id);
CREATE INDEX IF NOT EXISTS study_sessions_user_id_idx ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS study_leaderboard_total_duration_idx ON study_leaderboard(total_duration DESC);
CREATE INDEX IF NOT EXISTS ai_chat_history_user_id_idx ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS user_assignments_user_id_idx ON user_assignments(user_id);

-- ==================================================
-- GRANTS & REALTIME
-- ==================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Enable realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_room_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_members;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'watch_room_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE watch_room_messages;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'watch_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE watch_rooms;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'watch_room_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE watch_room_members;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'study_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE study_rooms;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'study_room_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE study_room_members;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'study_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE study_sessions;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'study_leaderboard'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE study_leaderboard;
  END IF;
END $$;

COMMIT; 