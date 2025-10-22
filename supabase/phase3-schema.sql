-- ============================================
-- WELLBEING TRACKER - PHASE 3 SCHEMA
-- Habits + Tasks + Sleep
-- ============================================

-- ============================================
-- TABLE: habits
-- ============================================
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sante_sport', 'bienetre_mental', 'productivite', 'alimentation', 'loisirs')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', '2x_week', '3x_week', 'weekly')),
  quantifiable BOOLEAN DEFAULT false,
  unit TEXT,
  color TEXT NOT NULL DEFAULT '#66BB6A',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);

-- ============================================
-- TABLE: habit_logs
-- ============================================
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  quantity NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date DESC);

-- ============================================
-- TABLE: tasks
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quadrant INTEGER NOT NULL CHECK (quadrant IN (1, 2, 3, 4)),
  deadline TIMESTAMP WITH TIME ZONE,
  recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_quadrant ON tasks(quadrant);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- ============================================
-- TABLE: sleep_logs
-- ============================================
CREATE TABLE IF NOT EXISTS sleep_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_hours NUMERIC NOT NULL,
  rem_hours NUMERIC NOT NULL,
  deep_hours NUMERIC NOT NULL,
  avg_heart_rate INTEGER NOT NULL,
  bedtime TIME NOT NULL,
  wakeup_time TIME NOT NULL,
  quality_score INTEGER NOT NULL CHECK (quality_score >= 1 AND quality_score <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_id ON sleep_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_date ON sleep_logs(date DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

-- Policies permissives pour Phase 3 (simple)
CREATE POLICY "Enable all access for habits" ON habits
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for habit_logs" ON habit_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for sleep_logs" ON sleep_logs
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- MESSAGE DE CONFIRMATION
-- ============================================
SELECT 'Phase 3 tables créées avec succès! 🎉' as message;
