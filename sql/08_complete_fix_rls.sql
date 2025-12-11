-- ============================================
-- RÉPARATION COMPLÈTE RLS - Focus Sessions & Tags
-- À exécuter si le diagnostic montre des problèmes
-- ============================================

-- ============================================
-- PARTIE 1: FOCUS_SESSIONS - Nettoyer et recréer
-- ============================================

-- 1. Supprimer TOUTES les anciennes politiques
DROP POLICY IF EXISTS "Users can manage own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can view own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can insert own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can update own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can delete own focus sessions" ON focus_sessions;

-- 2. S'assurer que RLS est activé
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Créer les bonnes politiques (séparées par opération)
CREATE POLICY "focus_sessions_select_policy"
  ON focus_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "focus_sessions_insert_policy"
  ON focus_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "focus_sessions_update_policy"
  ON focus_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "focus_sessions_delete_policy"
  ON focus_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- PARTIE 2: SESSION_TAGS - Nettoyer et recréer
-- ============================================

-- 1. Supprimer TOUTES les anciennes politiques
DROP POLICY IF EXISTS "Users can view own session tags" ON session_tags;
DROP POLICY IF EXISTS "Users can create own session tags" ON session_tags;
DROP POLICY IF EXISTS "Users can update own custom tags" ON session_tags;
DROP POLICY IF EXISTS "Users can delete own custom tags" ON session_tags;
DROP POLICY IF EXISTS "session_tags_select_policy" ON session_tags;
DROP POLICY IF EXISTS "session_tags_insert_policy" ON session_tags;
DROP POLICY IF EXISTS "session_tags_update_policy" ON session_tags;
DROP POLICY IF EXISTS "session_tags_delete_policy" ON session_tags;

-- 2. S'assurer que RLS est activé
ALTER TABLE session_tags ENABLE ROW LEVEL SECURITY;

-- 3. Créer les bonnes politiques
CREATE POLICY "session_tags_select_policy"
  ON session_tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "session_tags_insert_policy"
  ON session_tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "session_tags_update_policy"
  ON session_tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_default = false)
  WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "session_tags_delete_policy"
  ON session_tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_default = false);

-- ============================================
-- PARTIE 3: CRÉER LES TAGS PAR DÉFAUT
-- ============================================

-- Fonction pour créer les tags par défaut
CREATE OR REPLACE FUNCTION create_default_session_tags(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO session_tags (user_id, name, emoji, color, is_default)
  VALUES
    (p_user_id, 'perso', '🏠', '#42A5F5', true),
    (p_user_id, 'pro', '💼', '#5C6BC0', true),
    (p_user_id, 'sport', '💪', '#66BB6A', true),
    (p_user_id, 'etudes', '📚', '#FFA726', true),
    (p_user_id, 'projet', '🚀', '#AB47BC', true),
    (p_user_id, 'loisirs', '🎨', '#EC407A', true)
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$;

-- Trigger pour créer automatiquement les tags lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user_session_tags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_default_session_tags(NEW.id);
  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created_session_tags ON auth.users;

-- Créer le nouveau trigger
CREATE TRIGGER on_auth_user_created_session_tags
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_session_tags();

-- Créer les tags pour les utilisateurs existants
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM create_default_session_tags(user_record.id);
  END LOOP;
END;
$$;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

SELECT '✅ Politiques RLS recréées avec succès !' as status;

-- Afficher les politiques actives
SELECT
  tablename,
  policyname,
  cmd as operation,
  CASE WHEN qual IS NOT NULL THEN 'USING clause OK' ELSE 'No USING' END as using_check,
  CASE WHEN with_check IS NOT NULL THEN 'WITH CHECK clause OK' ELSE 'No WITH CHECK' END as with_check_status
FROM pg_policies
WHERE tablename IN ('focus_sessions', 'session_tags')
ORDER BY tablename, policyname;

-- Compter les tags créés
SELECT
  COUNT(*) as total_tags,
  COUNT(*) FILTER (WHERE is_default = true) as default_tags,
  COUNT(*) FILTER (WHERE is_default = false) as custom_tags
FROM session_tags;
