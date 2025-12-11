-- ============================================
-- DIAGNOSTIC RLS - Vérifier l'état actuel
-- ============================================

-- 1. Vérifier que RLS est activé
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('focus_sessions', 'session_tags')
ORDER BY tablename;

-- 2. Lister TOUTES les politiques actuelles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('focus_sessions', 'session_tags')
ORDER BY tablename, policyname;

-- 3. Vérifier les colonnes de focus_sessions
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'focus_sessions'
ORDER BY ordinal_position;

-- 4. Vérifier les colonnes de session_tags
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'session_tags'
ORDER BY ordinal_position;

-- 5. Compter les tags existants (pour voir si les tags par défaut ont été créés)
SELECT
  user_id,
  COUNT(*) as tag_count,
  COUNT(*) FILTER (WHERE is_default = true) as default_tags,
  COUNT(*) FILTER (WHERE is_default = false) as custom_tags
FROM session_tags
GROUP BY user_id;

-- 6. Afficher quelques tags pour voir le format
SELECT
  name,
  emoji,
  color,
  is_default
FROM session_tags
LIMIT 10;
