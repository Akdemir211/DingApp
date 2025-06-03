-- Fix watch_room_members RLS policy for room creation
-- The issue: Creator couldn't join their own room due to strict policy

BEGIN;

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "watch_room_members_insert" ON watch_room_members;

-- Create a simpler policy that allows users to add themselves to any room
-- Room-level access control should be handled at application level
CREATE POLICY "watch_room_members_insert" ON watch_room_members 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

COMMIT; 