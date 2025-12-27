-- =====================================================
-- Migration: Fix RLS Performance Warnings
-- =====================================================
-- This migration fixes the Supabase performance warnings by replacing
-- auth.uid() with (select auth.uid()) in all RLS policies.
-- This prevents PostgreSQL from re-evaluating the function for each row.
-- =====================================================

-- =====================================================
-- 1. ACTIVITY_TYPES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own activity types" ON activity_types;
DROP POLICY IF EXISTS "Users can insert own activity types" ON activity_types;
DROP POLICY IF EXISTS "Users can update own activity types" ON activity_types;
DROP POLICY IF EXISTS "Users can delete own activity types" ON activity_types;

CREATE POLICY "Users can view own activity types" ON activity_types
  FOR SELECT USING ((select auth.uid()) = user_id OR is_default = TRUE);

CREATE POLICY "Users can insert own activity types" ON activity_types
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own activity types" ON activity_types
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own activity types" ON activity_types
  FOR DELETE USING ((select auth.uid()) = user_id AND is_default = FALSE);

-- =====================================================
-- 2. MOOD_ACTIVITIES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own mood activities" ON mood_activities;

CREATE POLICY "Users can manage own mood activities" ON mood_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM moods
      WHERE moods.id = mood_activities.mood_id
      AND moods.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 3. FOCUS_SESSIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can insert own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can update own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can delete own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Enable all access for focus_sessions" ON focus_sessions;

CREATE POLICY "Users can view own focus sessions" ON focus_sessions
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own focus sessions" ON focus_sessions
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own focus sessions" ON focus_sessions
  FOR UPDATE USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own focus sessions" ON focus_sessions
  FOR DELETE USING ((select auth.uid()) = user_id);

-- =====================================================
-- 4. SESSION_TAGS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own tags" ON session_tags;
DROP POLICY IF EXISTS "Users can insert own tags" ON session_tags;
DROP POLICY IF EXISTS "Users can update own tags" ON session_tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON session_tags;
DROP POLICY IF EXISTS "Enable all access for session_tags" ON session_tags;

CREATE POLICY "Users can view own tags" ON session_tags
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own tags" ON session_tags
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own tags" ON session_tags
  FOR UPDATE USING ((select auth.uid()) = user_id AND is_default = FALSE)
  WITH CHECK ((select auth.uid()) = user_id AND is_default = FALSE);

CREATE POLICY "Users can delete own tags" ON session_tags
  FOR DELETE USING ((select auth.uid()) = user_id AND is_default = FALSE);

-- =====================================================
-- 5. WATER_LOGS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own water logs" ON water_logs;

CREATE POLICY "Users can manage own water logs" ON water_logs
  FOR ALL USING ((select auth.uid()) = user_id);

-- =====================================================
-- 6. WATER_GOALS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own water goals" ON water_goals;

CREATE POLICY "Users can manage own water goals" ON water_goals
  FOR ALL USING ((select auth.uid()) = user_id);

-- =====================================================
-- 7. SYMPTOM_TYPES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own symptom types" ON symptom_types;
DROP POLICY IF EXISTS "Users can insert own symptom types" ON symptom_types;
DROP POLICY IF EXISTS "Users can update own symptom types" ON symptom_types;
DROP POLICY IF EXISTS "Users can delete own symptom types" ON symptom_types;

CREATE POLICY "Users can view own symptom types" ON symptom_types
  FOR SELECT USING ((select auth.uid()) = user_id OR is_default = TRUE);

CREATE POLICY "Users can insert own symptom types" ON symptom_types
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own symptom types" ON symptom_types
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own symptom types" ON symptom_types
  FOR DELETE USING ((select auth.uid()) = user_id AND is_default = FALSE);

-- =====================================================
-- 8. SYMPTOM_LOGS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own symptom logs" ON symptom_logs;
DROP POLICY IF EXISTS "Users can insert own symptom logs" ON symptom_logs;
DROP POLICY IF EXISTS "Users can manage own symptom logs" ON symptom_logs;

CREATE POLICY "Users can view own symptom logs" ON symptom_logs
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own symptom logs" ON symptom_logs
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- =====================================================
-- 9. MOODS TABLE (if policies exist)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own moods" ON moods;
DROP POLICY IF EXISTS "Users can insert own moods" ON moods;
DROP POLICY IF EXISTS "Users can update own moods" ON moods;
DROP POLICY IF EXISTS "Users can delete own moods" ON moods;
DROP POLICY IF EXISTS "Enable all access for moods" ON moods;

CREATE POLICY "Users can view own moods" ON moods
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own moods" ON moods
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own moods" ON moods
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own moods" ON moods
  FOR DELETE USING ((select auth.uid()) = user_id);

-- =====================================================
-- 10. MOOD_DOMAINS TABLE (if policies exist)
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own mood domains" ON mood_domains;
DROP POLICY IF EXISTS "Enable all access for mood_domains" ON mood_domains;

CREATE POLICY "Users can manage own mood domains" ON mood_domains
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM moods
      WHERE moods.id = mood_domains.mood_id
      AND moods.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 11. HABITS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own habits" ON habits;
DROP POLICY IF EXISTS "Enable all access for habits" ON habits;

CREATE POLICY "Users can manage own habits" ON habits
  FOR ALL USING ((select auth.uid()) = user_id);

-- =====================================================
-- 12. HABIT_LOGS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Enable all access for habit_logs" ON habit_logs;

CREATE POLICY "Users can manage own habit logs" ON habit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM habits
      WHERE habits.id = habit_logs.habit_id
      AND habits.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 13. TASKS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
DROP POLICY IF EXISTS "Enable all access for tasks" ON tasks;

CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING ((select auth.uid()) = user_id);

-- =====================================================
-- 14. SLEEP_LOGS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own sleep logs" ON sleep_logs;
DROP POLICY IF EXISTS "Enable all access for sleep_logs" ON sleep_logs;

CREATE POLICY "Users can manage own sleep logs" ON sleep_logs
  FOR ALL USING ((select auth.uid()) = user_id);

-- =====================================================
-- 15. GOALS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own goals" ON goals;
DROP POLICY IF EXISTS "Enable all access for goals" ON goals;

CREATE POLICY "Users can manage own goals" ON goals
  FOR ALL USING ((select auth.uid()) = user_id);

-- =====================================================
-- 16. GOAL_MILESTONES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own goal milestones" ON goal_milestones;
DROP POLICY IF EXISTS "Enable all access for goal_milestones" ON goal_milestones;

CREATE POLICY "Users can manage own goal milestones" ON goal_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_milestones.goal_id
      AND goals.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 17. GRATITUDE_ENTRIES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own gratitude entries" ON gratitude_entries;
DROP POLICY IF EXISTS "Enable all access for gratitude_entries" ON gratitude_entries;

CREATE POLICY "Users can manage own gratitude entries" ON gratitude_entries
  FOR ALL USING ((select auth.uid()) = user_id);

-- =====================================================
-- 18. USER_GAMIFICATION TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own gamification" ON user_gamification;
DROP POLICY IF EXISTS "Enable all access for user_gamification" ON user_gamification;

CREATE POLICY "Users can manage own gamification" ON user_gamification
  FOR ALL USING ((select auth.uid()) = user_id);

-- =====================================================
-- 19. XP_HISTORY TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own xp history" ON xp_history;
DROP POLICY IF EXISTS "Enable all access for xp_history" ON xp_history;

CREATE POLICY "Users can view own xp history" ON xp_history
  FOR ALL USING ((select auth.uid()) = user_id);

-- =====================================================
-- 20. NOTIFICATION_SETTINGS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Enable all access for notification_settings" ON notification_settings;

CREATE POLICY "Users can manage own notification settings" ON notification_settings
  FOR ALL USING ((select auth.uid()) = user_id);

-- =====================================================
-- 21. THEME_SETTINGS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own theme settings" ON theme_settings;
DROP POLICY IF EXISTS "Enable all access for theme_settings" ON theme_settings;

CREATE POLICY "Users can manage own theme settings" ON theme_settings
  FOR ALL USING ((select auth.uid()) = user_id);

-- =====================================================
-- 22. MOODBOARD_ITEMS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can manage own moodboard items" ON moodboard_items;
DROP POLICY IF EXISTS "Enable all access for moodboard_items" ON moodboard_items;

CREATE POLICY "Users can manage own moodboard items" ON moodboard_items
  FOR ALL USING ((select auth.uid()) = user_id);

-- =====================================================
-- 23. USERS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable all access for users" ON users;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING ((select auth.uid()) = id);

-- =====================================================
-- VERIFICATION: List all policies after migration
-- =====================================================
-- Run this query in Supabase SQL Editor to verify:
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
