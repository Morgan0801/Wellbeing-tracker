-- ============================================
-- FIX ULTIME : DÉSACTIVER RLS + SYNC USERS + CRÉER TAGS
-- ⚠️ NE PAS UTILISER EN PRODUCTION !
-- ============================================

-- ÉTAPE 1: Désactiver RLS
ALTER TABLE focus_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_tags DISABLE ROW LEVEL SECURITY;

RAISE NOTICE '✅ RLS désactivé sur focus_sessions et session_tags';

-- ÉTAPE 2: Synchroniser auth.users vers public.users
DO $$
DECLARE
  auth_user RECORD;
  public_user_count INTEGER;
BEGIN
  -- Pour chaque utilisateur dans auth.users
  FOR auth_user IN SELECT id FROM auth.users LOOP
    -- Vérifier s'il existe déjà dans public.users
    SELECT COUNT(*) INTO public_user_count
    FROM public.users
    WHERE id = auth_user.id;

    -- S'il n'existe pas, le créer
    IF public_user_count = 0 THEN
      INSERT INTO public.users (id, settings)
      VALUES (
        auth_user.id,
        '{"theme": "light", "widgets_visible": ["mood", "weather", "stats"]}'::jsonb
      );
      RAISE NOTICE '✅ Utilisateur % synchronisé dans public.users', auth_user.id;
    END IF;
  END LOOP;
END;
$$;

-- ÉTAPE 3: Créer les tags par défaut pour tous les utilisateurs
DO $$
DECLARE
  user_record RECORD;
  tag_count INTEGER;
BEGIN
  -- Pour chaque utilisateur dans public.users
  FOR user_record IN SELECT id FROM public.users LOOP
    -- Vérifier si l'utilisateur a déjà des tags
    SELECT COUNT(*) INTO tag_count
    FROM session_tags
    WHERE user_id = user_record.id;

    -- Si pas de tags, les créer
    IF tag_count = 0 THEN
      INSERT INTO session_tags (user_id, name, emoji, color, is_default)
      VALUES
        (user_record.id, 'perso', '🏠', '#42A5F5', true),
        (user_record.id, 'pro', '💼', '#5C6BC0', true),
        (user_record.id, 'sport', '💪', '#66BB6A', true),
        (user_record.id, 'etudes', '📚', '#FFA726', true),
        (user_record.id, 'projet', '🚀', '#AB47BC', true),
        (user_record.id, 'loisirs', '🎨', '#EC407A', true)
      ON CONFLICT (user_id, name) DO NOTHING;

      RAISE NOTICE '✅ Tags créés pour utilisateur %', user_record.id;
    ELSE
      RAISE NOTICE '✅ Utilisateur % a déjà % tags', user_record.id, tag_count;
    END IF;
  END LOOP;
END;
$$;

-- VÉRIFICATION FINALE
SELECT '✅✅✅ CONFIGURATION TERMINÉE ✅✅✅' as status;

-- Afficher le statut RLS
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '⚠️ RLS ACTIVÉ' ELSE '✅ RLS DÉSACTIVÉ (mode dev)' END as rls_status
FROM pg_tables
WHERE tablename IN ('focus_sessions', 'session_tags')
ORDER BY tablename;

-- Afficher les utilisateurs et leurs tags
SELECT
  u.id as user_id,
  COUNT(st.id) as nombre_tags
FROM public.users u
LEFT JOIN session_tags st ON st.user_id = u.id
GROUP BY u.id;

-- Afficher tous les tags créés
SELECT
  user_id,
  name,
  emoji,
  color,
  is_default
FROM session_tags
ORDER BY user_id, is_default DESC, name;
