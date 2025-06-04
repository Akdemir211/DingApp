-- Clean Watch Rooms Setup
-- Bu dosya watch rooms sistemini sıfırdan kurmak için kullanılır

-- 1. Watch Rooms tablosu (Ana tablo)
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

-- 2. Watch Room Members tablosu (Üye yönetimi)
CREATE TABLE IF NOT EXISTS watch_room_members (
  room_id uuid REFERENCES watch_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- 3. Watch Room Messages tablosu (Chat mesajları)
CREATE TABLE IF NOT EXISTS watch_room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES watch_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. Watch Room Video State tablosu (Video senkronizasyonu)
CREATE TABLE IF NOT EXISTS watch_room_video_state (
  room_id uuid PRIMARY KEY REFERENCES watch_rooms(id) ON DELETE CASCADE,
  is_playing boolean DEFAULT false,
  playback_time numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- RLS (Row Level Security) aktifleştir
ALTER TABLE watch_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_room_video_state ENABLE ROW LEVEL SECURITY;

-- Watch Rooms RLS Policies
CREATE POLICY "Users can view all watch rooms" ON watch_rooms
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create watch rooms" ON watch_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own watch rooms" ON watch_rooms
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own watch rooms" ON watch_rooms
  FOR DELETE USING (auth.uid() = created_by);

-- Watch Room Members RLS Policies
CREATE POLICY "Users can view room members" ON watch_room_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can join rooms" ON watch_room_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON watch_room_members
  FOR DELETE USING (auth.uid() = user_id);

-- Watch Room Messages RLS Policies
CREATE POLICY "Users can view room messages" ON watch_room_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM watch_room_members 
      WHERE room_id = watch_room_messages.room_id 
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM watch_rooms 
      WHERE id = watch_room_messages.room_id 
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Members can send messages" ON watch_room_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (EXISTS (
      SELECT 1 FROM watch_room_members 
      WHERE room_id = watch_room_messages.room_id 
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM watch_rooms 
      WHERE id = watch_room_messages.room_id 
      AND created_by = auth.uid()
    ))
  );

-- Watch Room Video State RLS Policies
CREATE POLICY "Users can view video state for their rooms" ON watch_room_video_state
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM watch_room_members 
      WHERE room_id = watch_room_video_state.room_id 
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM watch_rooms 
      WHERE id = watch_room_video_state.room_id 
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Room creators can update video state" ON watch_room_video_state
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM watch_rooms 
      WHERE id = watch_room_video_state.room_id 
      AND created_by = auth.uid()
    )
  );

-- Realtime abonelik ayarları
ALTER PUBLICATION supabase_realtime ADD TABLE watch_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE watch_room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE watch_room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE watch_room_video_state;

-- İndeksler (Performans için)
CREATE INDEX IF NOT EXISTS idx_watch_rooms_created_by ON watch_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_watch_room_members_room_id ON watch_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_watch_room_messages_room_id ON watch_room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_watch_room_messages_created_at ON watch_room_messages(created_at);

-- Video state'i otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_video_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Video state güncelleme trigger'ı
DROP TRIGGER IF EXISTS update_watch_room_video_state_timestamp ON watch_room_video_state;
CREATE TRIGGER update_watch_room_video_state_timestamp
    BEFORE UPDATE ON watch_room_video_state
    FOR EACH ROW
    EXECUTE FUNCTION update_video_state_timestamp();

-- Başarı mesajı
SELECT 'Watch rooms tabloları başarıyla oluşturuldu!' as result; 