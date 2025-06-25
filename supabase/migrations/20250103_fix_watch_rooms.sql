-- Fix Watch Rooms tables
-- Bu dosya watch rooms sistemi için gerekli tabloları kontrol eder ve eksikleri oluşturur

BEGIN;

-- Watch rooms tablosu kontrol et ve oluştur
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

-- Watch room members tablosu
CREATE TABLE IF NOT EXISTS watch_room_members (
  room_id uuid REFERENCES watch_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- Watch room messages tablosu
CREATE TABLE IF NOT EXISTS watch_room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES watch_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Watch room video state tablosu (yeni eklenen)
CREATE TABLE IF NOT EXISTS watch_room_video_state (
  room_id uuid PRIMARY KEY REFERENCES watch_rooms(id) ON DELETE CASCADE,
  is_playing boolean DEFAULT false,
  playback_time integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Video states tablosu (alternatif isim için - eski kod uyumluluğu)
CREATE TABLE IF NOT EXISTS video_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES watch_rooms(id) ON DELETE CASCADE,
  is_playing boolean DEFAULT false,
  playback_time integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Watch room participants tablosu (members'ın alternatifi)
CREATE TABLE IF NOT EXISTS watch_room_participants (
  room_id uuid REFERENCES watch_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- RLS Policies
ALTER TABLE watch_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_room_video_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_room_participants ENABLE ROW LEVEL SECURITY;

-- Watch rooms policies
DROP POLICY IF EXISTS "Users can view watch rooms" ON watch_rooms;
CREATE POLICY "Users can view watch rooms" ON watch_rooms
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can create watch rooms" ON watch_rooms;
CREATE POLICY "Users can create watch rooms" ON watch_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own watch rooms" ON watch_rooms;
CREATE POLICY "Users can update their own watch rooms" ON watch_rooms
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own watch rooms" ON watch_rooms;
CREATE POLICY "Users can delete their own watch rooms" ON watch_rooms
  FOR DELETE USING (auth.uid() = created_by);

-- Watch room members policies
DROP POLICY IF EXISTS "Users can view room members" ON watch_room_members;
CREATE POLICY "Users can view room members" ON watch_room_members
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can join rooms" ON watch_room_members;
CREATE POLICY "Users can join rooms" ON watch_room_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave rooms" ON watch_room_members;
CREATE POLICY "Users can leave rooms" ON watch_room_members
  FOR DELETE USING (auth.uid() = user_id);

-- Watch room participants policies (aynı members gibi)
DROP POLICY IF EXISTS "Users can view room participants" ON watch_room_participants;
CREATE POLICY "Users can view room participants" ON watch_room_participants
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can join as participants" ON watch_room_participants;
CREATE POLICY "Users can join as participants" ON watch_room_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave as participants" ON watch_room_participants;
CREATE POLICY "Users can leave as participants" ON watch_room_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Watch room messages policies  
DROP POLICY IF EXISTS "Users can view room messages" ON watch_room_messages;
CREATE POLICY "Users can view room messages" ON watch_room_messages
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can send messages" ON watch_room_messages;
CREATE POLICY "Users can send messages" ON watch_room_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Video state policies
DROP POLICY IF EXISTS "Users can view video state" ON watch_room_video_state;
CREATE POLICY "Users can view video state" ON watch_room_video_state
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Room creators can update video state" ON watch_room_video_state;
CREATE POLICY "Room creators can update video state" ON watch_room_video_state
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM watch_rooms 
      WHERE watch_rooms.id = room_id 
      AND watch_rooms.created_by = auth.uid()
    )
  );

-- Video states policies (alternatif tablo için)
DROP POLICY IF EXISTS "Users can view video states" ON video_states;
CREATE POLICY "Users can view video states" ON video_states
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Room creators can update video states" ON video_states;
CREATE POLICY "Room creators can update video states" ON video_states
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM watch_rooms 
      WHERE watch_rooms.id = room_id 
      AND watch_rooms.created_by = auth.uid()
    )
  );

-- Indexler
CREATE INDEX IF NOT EXISTS idx_watch_rooms_created_by ON watch_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_watch_rooms_created_at ON watch_rooms(created_at);
CREATE INDEX IF NOT EXISTS idx_watch_room_members_room_id ON watch_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_watch_room_messages_room_id ON watch_room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_video_states_room_id ON video_states(room_id);
CREATE INDEX IF NOT EXISTS idx_watch_room_participants_room_id ON watch_room_participants(room_id);

COMMIT; 