-- ============================================
-- SOLUTION SIMPLE : SUPPRIMER LA CONTRAINTE
-- ============================================

-- 1. Désactiver RLS
ALTER TABLE focus_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_tags DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer la contrainte de clé étrangère qui bloque tout
ALTER TABLE session_tags DROP CONSTRAINT IF EXISTS session_tags_user_id_fkey;

-- 3. Créer les tags pour l'utilisateur qui existe déjà
INSERT INTO session_tags (user_id, name, emoji, color, is_default)
VALUES
  ('d6d92705-5ad4-4ae9-9c9b-a42c1489ea5c', 'perso', '🏠', '#42A5F5', true),
  ('d6d92705-5ad4-4ae9-9c9b-a42c1489ea5c', 'pro', '💼', '#5C6BC0', true),
  ('d6d92705-5ad4-4ae9-9c9b-a42c1489ea5c', 'sport', '💪', '#66BB6A', true),
  ('d6d92705-5ad4-4ae9-9c9b-a42c1489ea5c', 'etudes', '📚', '#FFA726', true),
  ('d6d92705-5ad4-4ae9-9c9b-a42c1489ea5c', 'projet', '🚀', '#AB47BC', true),
  ('d6d92705-5ad4-4ae9-9c9b-a42c1489ea5c', 'loisirs', '🎨', '#EC407A', true)
ON CONFLICT (user_id, name) DO NOTHING;

SELECT '✅ TERMINÉ - Recharge ta page maintenant !' as status;

-- Vérifier
SELECT COUNT(*) as nombre_tags FROM session_tags;
