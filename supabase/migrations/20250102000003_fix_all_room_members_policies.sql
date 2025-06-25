-- Fix all room members RLS policies for consistent behavior
-- Ensures room creators can join their own rooms without issues

BEGIN;

-- Fix chat_room_members
ALTER TABLE chat_room_members DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_room_members_select" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_insert" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_delete" ON chat_room_members;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_room_members_select_policy" ON chat_room_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "chat_room_members_insert_policy" ON chat_room_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_room_members_delete_policy" ON chat_room_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix study_room_members 
ALTER TABLE study_room_members DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "study_room_members_select" ON study_room_members;
DROP POLICY IF EXISTS "study_room_members_insert" ON study_room_members;
DROP POLICY IF EXISTS "study_room_members_update" ON study_room_members;
DROP POLICY IF EXISTS "study_room_members_delete" ON study_room_members;
ALTER TABLE study_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "study_room_members_select_policy" ON study_room_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "study_room_members_insert_policy" ON study_room_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "study_room_members_update_policy" ON study_room_members FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "study_room_members_delete_policy" ON study_room_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

COMMIT; 