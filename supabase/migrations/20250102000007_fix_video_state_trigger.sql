-- Fix video state trigger issue by removing problematic trigger
-- Remove the problematic trigger and function
DROP TRIGGER IF EXISTS update_watch_room_video_state_timestamp ON public.watch_room_video_state;
DROP FUNCTION IF EXISTS update_video_state_timestamp();

-- Add missing columns if they don't exist (for manual tracking if needed)
DO $$
BEGIN
    -- Add last_updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'watch_room_video_state' 
                   AND column_name = 'last_updated_at') THEN
        ALTER TABLE public.watch_room_video_state 
        ADD COLUMN last_updated_at timestamp with time zone DEFAULT now();
    END IF;
    
    -- Add last_updated_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'watch_room_video_state' 
                   AND column_name = 'last_updated_by') THEN
        ALTER TABLE public.watch_room_video_state 
        ADD COLUMN last_updated_by uuid REFERENCES auth.users(id);
    END IF;
END $$;

-- Note: We're not recreating the trigger since the app doesn't use these timestamp fields
-- This eliminates the trigger error while keeping the table structure consistent 