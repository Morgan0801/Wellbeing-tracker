-- ============================================
-- FIX RLS POLICIES - Focus Sessions & Tags
-- Correction des politiques pour permettre INSERT
-- ============================================

-- 1. SUPPRIMER l'ancienne politique trop restrictive
DROP POLICY IF EXISTS "Users can manage own focus sessions" ON focus_sessions;

-- 2. CRÉER des politiques séparées pour SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "Users can view own focus sessions"
  ON focus_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus sessions"
  ON focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus sessions"
  ON focus_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus sessions"
  ON focus_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- 3. VÉRIFIER que session_tags a bien ses politiques (déjà dans script précédent)
-- Pas besoin de les recréer si elles existent déjà

-- 4. TEST RAPIDE
SELECT '✅ Politiques RLS corrigées pour focus_sessions !' as status;

-- Vérifier les politiques actives
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('focus_sessions', 'session_tags')
ORDER BY tablename, policyname;
