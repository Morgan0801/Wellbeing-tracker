-- ============================================
-- VÉRIFIER ET FIXER FOCUS_SESSIONS
-- ============================================

-- 1. Vérifier le statut RLS
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '❌ RLS ACTIVÉ (PROBLÈME)' ELSE '✅ RLS DÉSACTIVÉ' END as rls_status
FROM pg_tables
WHERE tablename IN ('focus_sessions', 'session_tags')
ORDER BY tablename;

-- 2. S'assurer que RLS est bien désactivé
ALTER TABLE focus_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_tags DISABLE ROW LEVEL SECURITY;

-- 3. Supprimer aussi la contrainte FK sur focus_sessions si elle existe
ALTER TABLE focus_sessions DROP CONSTRAINT IF EXISTS focus_sessions_user_id_fkey;
ALTER TABLE focus_sessions DROP CONSTRAINT IF EXISTS focus_sessions_task_id_fkey;

SELECT '✅ Contraintes supprimées sur focus_sessions' as status;

-- 4. Vérifier les colonnes de focus_sessions
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'focus_sessions'
ORDER BY ordinal_position;
