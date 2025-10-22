-- ============================================
-- PHASE 4 - WELLBEING TRACKER
-- Nouvelles tables : Goals, Gratitude, Moodboard, Gamification
-- ============================================

-- TABLE : goals (Objectifs à long terme)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'perso', 'pro', 'sante', 'finances', 'loisirs'
  target_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : goal_milestones (Jalons d'objectifs)
CREATE TABLE IF NOT EXISTS goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : gratitude_entries (Journal de gratitude)
CREATE TABLE IF NOT EXISTS gratitude_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  entry_1 TEXT NOT NULL,
  entry_2 TEXT,
  entry_3 TEXT,
  mood_emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : moodboard_items (Moodboard - images et citations)
CREATE TABLE IF NOT EXISTS moodboard_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'image', 'quote', 'affirmation'
  content TEXT NOT NULL, -- URL pour image, texte pour quote/affirmation
  author TEXT, -- Pour les citations
  category TEXT, -- 'motivation', 'calme', 'joie', 'inspiration'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : user_gamification (Gamification - XP, niveaux, badges)
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_xp INT DEFAULT 0,
  level INT DEFAULT 1,
  badges JSONB DEFAULT '[]', -- Array de badges débloqués
  last_activity_date DATE,
  streak_days INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE : xp_history (Historique des gains XP)
CREATE TABLE IF NOT EXISTS xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'mood_log', 'habit_complete', 'task_complete', etc.
  xp_gained INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEX pour optimiser les performances
-- ============================================

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_user_id ON gratitude_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_date ON gratitude_entries(date);
CREATE INDEX IF NOT EXISTS idx_moodboard_user_id ON moodboard_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON xp_history(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE gratitude_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE moodboard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (pour l'instant : tout autorisé)
CREATE POLICY "Enable all for authenticated users" ON goals FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON goal_milestones FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON gratitude_entries FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON moodboard_items FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON user_gamification FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON xp_history FOR ALL USING (true);

-- ============================================
-- FONCTIONS UTILES
-- ============================================

-- Fonction pour calculer le niveau à partir du XP
-- Formule : niveau = floor(sqrt(total_xp / 100)) + 1
-- Niveau 1 : 0-99 XP, Niveau 2 : 100-399 XP, Niveau 3 : 400-899 XP, etc.
CREATE OR REPLACE FUNCTION calculate_level(xp INT)
RETURNS INT AS $$
BEGIN
  RETURN FLOOR(SQRT(xp / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le niveau quand le XP change
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := calculate_level(NEW.total_xp);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_level
BEFORE UPDATE OF total_xp ON user_gamification
FOR EACH ROW
EXECUTE FUNCTION update_user_level();

-- ============================================
-- DONNÉES DE TEST (optionnel)
-- ============================================

-- Catégories de goals
COMMENT ON COLUMN goals.category IS 'Catégories: perso, pro, sante, finances, loisirs';

-- Types moodboard
COMMENT ON COLUMN moodboard_items.type IS 'Types: image, quote, affirmation';
COMMENT ON COLUMN moodboard_items.category IS 'Catégories: motivation, calme, joie, inspiration';

-- Actions XP
COMMENT ON COLUMN xp_history.action_type IS 'Types: mood_log, habit_complete, task_complete, goal_complete, gratitude_log, streak_bonus';
