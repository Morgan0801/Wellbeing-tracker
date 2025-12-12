-- ============================================
-- DÉSACTIVER RLS + CRÉER TAGS (VERSION CORRIGÉE)
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

-- Créer les tags par défaut pour TOUS les utilisateurs (auth.users ET public.users)
DO $$
DECLARE
  v_user_id UUID;
  tag_count INTEGER;
  user_source TEXT;
BEGIN
  -- OPTION 1: Chercher dans auth.users (utilisateurs Supabase Auth)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    user_source := 'auth.users';
  ELSE
    -- OPTION 2: Chercher dans public.users (utilisateurs locaux)
    SELECT id INTO v_user_id FROM public.users LIMIT 1;
    user_source := 'public.users';
  END IF;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE '✅ Utilisateur trouvé dans % : %', user_source, v_user_id;

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

      RAISE NOTICE '✅ 6 tags par défaut créés pour utilisateur %', v_user_id;
    ELSE
      RAISE NOTICE '✅ Utilisateur % a déjà % tags', v_user_id, tag_count;
    END IF;
  ELSE
    RAISE NOTICE '❌ Aucun utilisateur trouvé ni dans auth.users ni dans public.users';
    RAISE NOTICE '💡 Connecte-toi à l''application puis réexécute ce script';
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

-- Afficher les utilisateurs disponibles pour debug
SELECT 'Utilisateurs dans auth.users:' as info, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Utilisateurs dans public.users:' as info, COUNT(*) as count FROM public.users;
