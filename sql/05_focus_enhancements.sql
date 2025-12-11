-- ============================================
-- FOCUS ENHANCEMENTS MIGRATION
-- Ajoute le système de tags, évaluations qualité, et entrées manuelles
-- ============================================

-- 1. ÉTENDRE la table focus_sessions
-- ----------------------------------------
ALTER TABLE focus_sessions
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS is_manual_entry BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER;

-- Index pour filtrage par catégorie
CREATE INDEX IF NOT EXISTS idx_focus_sessions_category
  ON focus_sessions(category)
  WHERE category IS NOT NULL;

-- Backfill : durée réelle = durée prévue pour sessions existantes
UPDATE focus_sessions
SET actual_duration_minutes = duration_minutes
WHERE actual_duration_minutes IS NULL;

-- 2. CRÉER table session_tags (tags personnalisables)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS session_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📌',
  color TEXT NOT NULL DEFAULT '#78909C',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT session_tags_user_name_unique UNIQUE(user_id, name)
);

-- Index pour requêtes utilisateur
CREATE INDEX IF NOT EXISTS idx_session_tags_user
  ON session_tags(user_id);

-- 3. RLS POLICIES pour session_tags
-- ----------------------------------------
ALTER TABLE session_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session tags"
  ON session_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own session tags"
  ON session_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom tags"
  ON session_tags FOR UPDATE
  USING (auth.uid() = user_id AND is_default = FALSE);

CREATE POLICY "Users can delete own custom tags"
  ON session_tags FOR DELETE
  USING (auth.uid() = user_id AND is_default = FALSE);

-- 4. FONCTION : Créer tags par défaut pour utilisateur
-- ----------------------------------------
CREATE OR REPLACE FUNCTION create_default_session_tags(p_user_id UUID)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER : Créer tags par défaut lors inscription
-- ----------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user_session_tags()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_session_tags(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_session_tags ON auth.users;

CREATE TRIGGER on_auth_user_created_session_tags
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_session_tags();

-- 6. BACKFILL : Créer tags pour utilisateurs existants
-- ----------------------------------------
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM create_default_session_tags(user_record.id);
  END LOOP;
END;
$$;

-- 7. VÉRIFICATION
-- ----------------------------------------
SELECT '✅ Migration Focus terminée avec succès !' as status;
SELECT COUNT(*) as total_tags FROM session_tags;
