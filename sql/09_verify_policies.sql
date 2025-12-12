-- ============================================
-- VÉRIFICATION DES POLITIQUES RLS
-- ============================================

-- 1. Vérifier les politiques pour focus_sessions
SELECT
  policyname,
  cmd,
  roles,
  CASE WHEN qual IS NOT NULL THEN '✅ USING OK' ELSE '❌ NO USING' END as using_clause,
  CASE WHEN with_check IS NOT NULL THEN '✅ WITH CHECK OK' ELSE '❌ NO WITH CHECK' END as with_check_clause
FROM pg_policies
WHERE tablename = 'focus_sessions'
ORDER BY policyname;

-- 2. Vérifier les politiques pour session_tags
SELECT
  policyname,
  cmd,
  roles,
  CASE WHEN qual IS NOT NULL THEN '✅ USING OK' ELSE '❌ NO USING' END as using_clause,
  CASE WHEN with_check IS NOT NULL THEN '✅ WITH CHECK OK' ELSE '❌ NO WITH CHECK' END as with_check_clause
FROM pg_policies
WHERE tablename = 'session_tags'
ORDER BY policyname;

-- 3. Vérifier que RLS est activé
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ACTIVÉ' ELSE '❌ RLS DÉSACTIVÉ' END as rls_status
FROM pg_tables
WHERE tablename IN ('focus_sessions', 'session_tags')
ORDER BY tablename;

-- 4. Compter les tags existants
SELECT COUNT(*) as nombre_tags FROM session_tags;

-- 5. Vérifier l'utilisateur actuel (auth)
SELECT
  CASE
    WHEN auth.uid() IS NOT NULL THEN CONCAT('✅ Utilisateur connecté: ', auth.uid()::text)
    ELSE '❌ AUCUN UTILISATEUR CONNECTÉ - PROBLÈME D''AUTHENTIFICATION'
  END as auth_status;
