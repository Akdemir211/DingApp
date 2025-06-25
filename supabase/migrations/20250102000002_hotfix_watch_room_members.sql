-- Hotfix for watch_room_members RLS policy
-- Completely rebuild the policy to ensure it works

BEGIN;

-- First disable RLS temporarily
ALTER TABLE watch_room_members DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for this table
DROP POLICY IF EXISTS "watch_room_members_select" ON watch_room_members;
DROP POLICY IF EXISTS "watch_room_members_insert" ON watch_room_members;
DROP POLICY IF EXISTS "watch_room_members_update" ON watch_room_members;
DROP POLICY IF EXISTS "watch_room_members_delete" ON watch_room_members;

-- Re-enable RLS
ALTER TABLE watch_room_members ENABLE ROW LEVEL SECURITY;

-- Create new simple and working policies
CREATE POLICY "watch_room_members_select_policy" 
ON watch_room_members FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "watch_room_members_insert_policy" 
ON watch_room_members FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watch_room_members_delete_policy" 
ON watch_room_members FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

COMMIT; 