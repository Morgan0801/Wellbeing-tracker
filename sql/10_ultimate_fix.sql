-- ============================================
-- RÉPARATION ULTIME - FORCE CLEAN & REBUILD
-- À exécuter si rien d'autre ne marche
-- ============================================

-- ============================================
-- ÉTAPE 1: DÉSACTIVER RLS TEMPORAIREMENT
-- ============================================
ALTER TABLE focus_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_tags DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 2: SUPPRIMER TOUTES LES POLITIQUES
-- ============================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Supprimer toutes les politiques de focus_sessions
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'focus_sessions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON focus_sessions';
    END LOOP;

    -- Supprimer toutes les politiques de session_tags
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'session_tags') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON session_tags';
    END LOOP;
END $$;

-- ============================================
-- ÉTAPE 3: CRÉER LES NOUVELLES POLITIQUES
-- ============================================

-- FOCUS_SESSIONS
CREATE POLICY "focus_sessions_select"
  ON focus_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "focus_sessions_insert"
  ON focus_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "focus_sessions_update"
  ON focus_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "focus_sessions_delete"
  ON focus_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- SESSION_TAGS
CREATE POLICY "session_tags_select"
  ON session_tags
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "session_tags_insert"
  ON session_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "session_tags_update"
  ON session_tags
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_default = false)
  WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "session_tags_delete"
  ON session_tags
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_default = false);

-- ============================================
-- ÉTAPE 4: RÉACTIVER RLS
-- ============================================
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_tags ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 5: FORCER LA CRÉATION DES TAGS PAR DÉFAUT
-- ============================================

-- Recréer la fonction si elle n'existe pas
CREATE OR REPLACE FUNCTION create_default_session_tags(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Créer les tags pour TOUS les utilisateurs existants
DO $$
DECLARE
  user_record RECORD;
  tag_count INTEGER;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Vérifier si l'utilisateur a déjà des tags
    SELECT COUNT(*) INTO tag_count
    FROM session_tags
    WHERE user_id = user_record.id;

    -- Si pas de tags, les créer
    IF tag_count = 0 THEN
      PERFORM create_default_session_tags(user_record.id);
      RAISE NOTICE 'Tags créés pour utilisateur %', user_record.id;
    END IF;
  END LOOP;
END;
$$;

-- Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created_session_tags ON auth.users;

CREATE TRIGGER on_auth_user_created_session_tags
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_session_tags();

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

SELECT '🎉 RÉPARATION TERMINÉE !' as status;

-- Vérifier les politiques
SELECT
  'focus_sessions' as table_name,
  COUNT(*) as nombre_politiques
FROM pg_policies
WHERE tablename = 'focus_sessions'
UNION ALL
SELECT
  'session_tags' as table_name,
  COUNT(*) as nombre_politiques
FROM pg_policies
WHERE tablename = 'session_tags';

-- Vérifier RLS activé
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅ ACTIVÉ' ELSE '❌ DÉSACTIVÉ' END as rls_status
FROM pg_tables
WHERE tablename IN ('focus_sessions', 'session_tags')
ORDER BY tablename;

-- Compter les tags
SELECT
  user_id,
  COUNT(*) as nombre_tags
FROM session_tags
GROUP BY user_id;

-- Afficher quelques tags pour vérifier
SELECT
  name,
  emoji,
  color,
  is_default
FROM session_tags
LIMIT 10;
