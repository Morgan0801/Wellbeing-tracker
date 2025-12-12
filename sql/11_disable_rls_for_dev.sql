-- ============================================
-- DÉSACTIVER RLS POUR DÉVELOPPEMENT LOCAL
-- ⚠️ NE PAS UTILISER EN PRODUCTION !
-- ============================================

-- Désactiver RLS sur focus_sessions
ALTER TABLE focus_sessions DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur session_tags
ALTER TABLE session_tags DISABLE ROW LEVEL SECURITY;

-- Vérification
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '⚠️ RLS ACTIVÉ' ELSE '✅ RLS DÉSACTIVÉ (mode dev)' END as rls_status
FROM pg_tables
WHERE tablename IN ('focus_sessions', 'session_tags')
ORDER BY tablename;

-- Créer les tags par défaut pour l'utilisateur existant
DO $$
DECLARE
  v_user_id UUID;
  tag_count INTEGER;
BEGIN
  -- Récupérer le premier utilisateur
  SELECT id INTO v_user_id FROM public.users LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Vérifier si l'utilisateur a déjà des tags
    SELECT COUNT(*) INTO tag_count
    FROM session_tags
    WHERE user_id = v_user_id;

    -- Si pas de tags, les créer
    IF tag_count = 0 THEN
      INSERT INTO session_tags (user_id, name, emoji, color, is_default)
      VALUES
        (v_user_id, 'perso', '🏠', '#42A5F5', true),
        (v_user_id, 'pro', '💼', '#5C6BC0', true),
        (v_user_id, 'sport', '💪', '#66BB6A', true),
        (v_user_id, 'etudes', '📚', '#FFA726', true),
        (v_user_id, 'projet', '🚀', '#AB47BC', true),
        (v_user_id, 'loisirs', '🎨', '#EC407A', true)
      ON CONFLICT (user_id, name) DO NOTHING;

      RAISE NOTICE '✅ Tags créés pour utilisateur %', v_user_id;
    ELSE
      RAISE NOTICE '✅ Utilisateur % a déjà % tags', v_user_id, tag_count;
    END IF;
  ELSE
    RAISE NOTICE '❌ Aucun utilisateur trouvé dans la table users';
  END IF;
END;
$$;

SELECT '✅ RLS désactivé - Application fonctionnelle en mode développement' as status;

-- Afficher les tags créés
SELECT
  user_id,
  name,
  emoji,
  color,
  is_default
FROM session_tags
ORDER BY user_id, is_default DESC, name;
