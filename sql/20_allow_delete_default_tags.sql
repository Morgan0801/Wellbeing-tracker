-- =====================================================
-- Migration: Allow deletion of default tags
-- =====================================================
-- This migration allows users to delete their own tags,
-- including default ones.
-- =====================================================

-- Update DELETE policy to allow deleting all user tags (including defaults)
DROP POLICY IF EXISTS "Users can delete own tags" ON session_tags;

CREATE POLICY "Users can delete own tags" ON session_tags
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Optionally, also allow updating default tags
DROP POLICY IF EXISTS "Users can update own tags" ON session_tags;

CREATE POLICY "Users can update own tags" ON session_tags
  FOR UPDATE USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
