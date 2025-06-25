-- Video state table for synchronized video playback
CREATE TABLE IF NOT EXISTS public.watch_room_video_state (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid NOT NULL REFERENCES public.watch_rooms(id) ON DELETE CASCADE,
    is_playing boolean DEFAULT false,
    playback_time numeric DEFAULT 0,
    last_updated_at timestamp with time zone DEFAULT now(),
    last_updated_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(room_id)
);

-- Enable RLS
ALTER TABLE public.watch_room_video_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Simplified to work with existing tables
CREATE POLICY "Users can view video state for accessible rooms" ON public.watch_room_video_state
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.watch_rooms 
        WHERE id = watch_room_video_state.room_id 
        AND (created_by = auth.uid() OR is_private = false)
    )
);

CREATE POLICY "Room creators can update video state" ON public.watch_room_video_state
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.watch_rooms 
        WHERE id = watch_room_video_state.room_id 
        AND created_by = auth.uid()
    )
);

-- Enable realtime for video state synchronization (if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'watch_room_video_state'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_room_video_state;
    END IF;
END $$;

-- Function to update video state timestamp
CREATE OR REPLACE FUNCTION update_video_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = now();
    NEW.last_updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_watch_room_video_state_timestamp ON public.watch_room_video_state;
CREATE TRIGGER update_watch_room_video_state_timestamp
    BEFORE UPDATE ON public.watch_room_video_state
    FOR EACH ROW
    EXECUTE FUNCTION update_video_state_timestamp();

-- Insert initial state for existing rooms
INSERT INTO public.watch_room_video_state (room_id, is_playing, playback_time)
SELECT id, false, 0 
FROM public.watch_rooms 
WHERE id NOT IN (SELECT room_id FROM public.watch_room_video_state)
ON CONFLICT (room_id) DO NOTHING; 