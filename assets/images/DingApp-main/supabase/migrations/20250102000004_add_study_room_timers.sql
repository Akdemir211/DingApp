-- Add synchronized timer system for study rooms
-- This allows multiple users to share a single timer state

BEGIN;

-- Study room timer state table
CREATE TABLE IF NOT EXISTS study_room_timer_state (
  room_id uuid PRIMARY KEY REFERENCES study_rooms(id) ON DELETE CASCADE,
  is_running boolean DEFAULT false,
  start_time timestamptz,
  pause_time timestamptz,
  total_paused_duration integer DEFAULT 0, -- in seconds
  current_session_id uuid REFERENCES study_sessions(id) ON DELETE SET NULL,
  started_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Timer events log for audit trail
CREATE TABLE IF NOT EXISTS study_room_timer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('start', 'pause', 'resume', 'reset')),
  timestamp timestamptz DEFAULT now(),
  elapsed_seconds integer
);

-- Update function for timer state
CREATE OR REPLACE FUNCTION update_timer_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp update
CREATE TRIGGER timer_state_updated_at
  BEFORE UPDATE ON study_room_timer_state
  FOR EACH ROW
  EXECUTE FUNCTION update_timer_state_timestamp();

-- RLS Policies for timer state
ALTER TABLE study_room_timer_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_room_timer_events ENABLE ROW LEVEL SECURITY;

-- Timer state policies
CREATE POLICY "timer_state_select_policy" ON study_room_timer_state
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM study_room_members 
    WHERE room_id = study_room_timer_state.room_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "timer_state_insert_policy" ON study_room_timer_state
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM study_room_members 
    WHERE room_id = study_room_timer_state.room_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "timer_state_update_policy" ON study_room_timer_state
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM study_room_members 
    WHERE room_id = study_room_timer_state.room_id 
    AND user_id = auth.uid()
  )
);

-- Timer events policies
CREATE POLICY "timer_events_select_policy" ON study_room_timer_events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM study_room_members 
    WHERE room_id = study_room_timer_events.room_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "timer_events_insert_policy" ON study_room_timer_events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add timer state to realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'study_room_timer_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE study_room_timer_state;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'study_room_timer_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE study_room_timer_events;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_timer_state_room_id ON study_room_timer_state(room_id);
CREATE INDEX IF NOT EXISTS idx_timer_events_room_id ON study_room_timer_events(room_id);
CREATE INDEX IF NOT EXISTS idx_timer_events_timestamp ON study_room_timer_events(timestamp);

COMMIT; 