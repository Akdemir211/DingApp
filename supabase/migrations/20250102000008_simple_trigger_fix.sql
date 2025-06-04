-- Simple fix: just remove the problematic trigger
DROP TRIGGER IF EXISTS update_watch_room_video_state_timestamp ON public.watch_room_video_state;
DROP FUNCTION IF EXISTS update_video_state_timestamp(); 