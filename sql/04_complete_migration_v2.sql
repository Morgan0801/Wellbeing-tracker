-- ============================================
-- MIGRATION COMPLÈTE - WellBeing Tracker v2.0
-- Nouvelles fonctionnalités : Activity Tracking, Focus Sessions, 
-- Water Logs, Symptoms, Achievements
-- ============================================
-- Exécuter dans le SQL Editor de Supabase
-- ============================================

-- ============================================
-- PARTIE 1: ACTIVITY TRACKING SYSTEM
-- Remplace l'ancien système domain_impacts
-- ============================================

-- Table des types d'activités disponibles
CREATE TABLE IF NOT EXISTS activity_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📌',
  category TEXT NOT NULL CHECK (category IN ('sport', 'social', 'travail', 'loisirs', 'sante', 'custom')),
  is_default BOOLEAN DEFAULT FALSE, -- Les activités par défaut de l'app
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertion des activités par défaut (pour chaque nouvel utilisateur)
-- Ces activités seront copiées pour chaque user via un trigger ou à l'inscription
CREATE TABLE IF NOT EXISTS default_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  category TEXT NOT NULL
);

-- Activités par défaut
INSERT INTO default_activities (name, emoji, category) VALUES
  ('Sport / Exercice', '💪', 'sport'),
  ('Méditation', '🧘', 'sante'),
  ('Vu la famille', '👨‍👩‍👧', 'social'),
  ('Vu des amis', '👥', 'social'),
  ('Sorti en couple', '❤️', 'social'),
  ('Travaillé', '💼', 'travail'),
  ('Bien dormi', '😴', 'sante'),
  ('Mangé sainement', '🥗', 'sante'),
  ('Lu / Appris', '📚', 'loisirs'),
  ('Nature / Extérieur', '🌳', 'loisirs'),
  ('Musique / Art', '🎨', 'loisirs'),
  ('Jeux vidéo', '🎮', 'loisirs'),
  ('Alcool', '🍺', 'sante'),
  ('Café (3+ tasses)', '☕', 'sante')
ON CONFLICT DO NOTHING;

-- Logs des activités faites chaque jour (lié aux moods)
CREATE TABLE IF NOT EXISTS mood_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mood_id UUID NOT NULL REFERENCES moods(id) ON DELETE CASCADE,
  activity_type_id UUID NOT NULL REFERENCES activity_types(id) ON DELETE CASCADE,
  done BOOLEAN NOT NULL DEFAULT TRUE, -- true = fait, false = explicitement pas fait
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mood_id, activity_type_id)
);

-- Index pour les corrélations
CREATE INDEX IF NOT EXISTS idx_mood_activities_activity ON mood_activities(activity_type_id);
CREATE INDEX IF NOT EXISTS idx_mood_activities_mood ON mood_activities(mood_id);

-- ============================================
-- PARTIE 2: FOCUS SESSIONS (POMODORO)
-- ============================================

CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- Optionnel: lié à une tâche
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  session_type TEXT NOT NULL CHECK (session_type IN ('pomodoro', 'short_break', 'long_break')) DEFAULT 'pomodoro',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les statistiques
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_date ON focus_sessions(start_time);

-- ============================================
-- PARTIE 3: WATER TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS water_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INTEGER NOT NULL DEFAULT 250,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Objectif d'eau quotidien par utilisateur
CREATE TABLE IF NOT EXISTS water_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  daily_goal_ml INTEGER NOT NULL DEFAULT 2000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, date);

-- ============================================
-- PARTIE 4: SYMPTOM TRACKING
-- ============================================

-- Types de symptômes
CREATE TABLE IF NOT EXISTS symptom_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🤒',
  category TEXT NOT NULL CHECK (category IN ('physique', 'mental', 'energie', 'custom')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Symptômes par défaut
INSERT INTO symptom_types (name, emoji, category, is_default) VALUES
  ('Maux de tête', '🤕', 'physique', TRUE),
  ('Fatigue', '😴', 'energie', TRUE),
  ('Anxiété', '😰', 'mental', TRUE),
  ('Mal de dos', '🔙', 'physique', TRUE),
  ('Insomnie', '😵', 'physique', TRUE),
  ('Irritabilité', '😤', 'mental', TRUE),
  ('Manque de concentration', '🧠', 'mental', TRUE),
  ('Nausée', '🤢', 'physique', TRUE),
  ('Douleurs musculaires', '💪', 'physique', TRUE),
  ('Énergie basse', '🔋', 'energie', TRUE)
ON CONFLICT DO NOTHING;

-- Logs de symptômes
CREATE TABLE IF NOT EXISTS symptom_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_id UUID REFERENCES moods(id) ON DELETE SET NULL, -- Optionnel: lié à un mood
  symptom_type_id UUID NOT NULL REFERENCES symptom_types(id) ON DELETE CASCADE,
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 5),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_date ON symptom_logs(user_id, date);

-- ============================================
-- PARTIE 5: ACHIEVEMENTS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS achievement_types (
  id TEXT PRIMARY KEY, -- ex: 'streak_7', 'mood_100', etc.
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  category TEXT NOT NULL CHECK (category IN ('streak', 'count', 'special', 'milestone'))
);

-- Achievements prédéfinis
INSERT INTO achievement_types (id, name, description, emoji, xp_reward, category) VALUES
  ('streak_7', 'Une semaine parfaite', '7 jours consécutifs de logging', '🔥', 100, 'streak'),
  ('streak_30', 'Un mois de constance', '30 jours consécutifs', '🏆', 500, 'streak'),
  ('streak_100', 'Centurion', '100 jours consécutifs', '💯', 1000, 'streak'),
  ('mood_50', 'Explorateur émotionnel', '50 entrées mood', '🎭', 100, 'count'),
  ('mood_100', 'Maître des émotions', '100 entrées mood', '🧘', 250, 'count'),
  ('habits_all_day', 'Journée parfaite', 'Toutes les habitudes faites en 1 jour', '⭐', 50, 'special'),
  ('first_mood', 'Premier pas', 'Première entrée mood', '👶', 25, 'milestone'),
  ('first_habit', 'Nouvelle habitude', 'Première habitude créée', '🌱', 25, 'milestone'),
  ('wellness_80', 'Excellent wellbeing', 'Score wellness 80+', '💎', 100, 'special'),
  ('focus_100', 'Concentration intense', '100 sessions Pomodoro complétées', '🎯', 300, 'count')
ON CONFLICT (id) DO NOTHING;

-- Achievements débloqués par utilisateur
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievement_types(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- ============================================
-- PARTIE 6: MISE À JOUR MOODS (energy_level requis)
-- ============================================

ALTER TABLE moods 
  ADD COLUMN IF NOT EXISTS energy_level INTEGER DEFAULT 5 CHECK (energy_level >= 1 AND energy_level <= 10);

-- ============================================
-- PARTIE 7: RLS POLICIES (Row Level Security)
-- ============================================

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies pour activity_types
CREATE POLICY "Users can view own activity types" ON activity_types
  FOR SELECT USING (auth.uid() = user_id OR is_default = TRUE);
CREATE POLICY "Users can insert own activity types" ON activity_types
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity types" ON activity_types
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activity types" ON activity_types
  FOR DELETE USING (auth.uid() = user_id AND is_default = FALSE);

-- Policies pour mood_activities
CREATE POLICY "Users can manage own mood activities" ON mood_activities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM moods WHERE moods.id = mood_activities.mood_id AND moods.user_id = auth.uid())
  );

-- Policies pour focus_sessions
CREATE POLICY "Users can manage own focus sessions" ON focus_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour water_logs
CREATE POLICY "Users can manage own water logs" ON water_logs
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour water_goals
CREATE POLICY "Users can manage own water goals" ON water_goals
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour symptom_types
CREATE POLICY "Users can view symptoms" ON symptom_types
  FOR SELECT USING (auth.uid() = user_id OR is_default = TRUE);
CREATE POLICY "Users can insert own symptoms" ON symptom_types
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own symptoms" ON symptom_types
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own symptoms" ON symptom_types
  FOR DELETE USING (auth.uid() = user_id AND is_default = FALSE);

-- Policies pour symptom_logs
CREATE POLICY "Users can manage own symptom logs" ON symptom_logs
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

SELECT 'Migration terminée avec succès! ✅' as status;

-- Liste des nouvelles tables créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'activity_types', 'mood_activities', 'focus_sessions', 
    'water_logs', 'water_goals', 'symptom_types', 
    'symptom_logs', 'achievement_types', 'user_achievements',
    'default_activities'
  )
ORDER BY table_name;
