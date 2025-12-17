-- ============================================
-- FOCUS IMPROVEMENTS MIGRATION
-- Session Objectives + Focus Quality Metrics
-- ============================================

-- =====================
-- 1. SESSION OBJECTIVE
-- =====================

-- Add objective field to focus_sessions
ALTER TABLE focus_sessions
ADD COLUMN IF NOT EXISTS objective TEXT;

-- Index for searching objectives
CREATE INDEX IF NOT EXISTS idx_focus_sessions_objective
  ON focus_sessions(objective)
  WHERE objective IS NOT NULL;

-- ========================
-- 2. FOCUS QUALITY METRICS
-- ========================

-- Add pre/post session metrics
ALTER TABLE focus_sessions
ADD COLUMN IF NOT EXISTS pre_energy_level INTEGER CHECK (pre_energy_level BETWEEN 1 AND 5);

ALTER TABLE focus_sessions
ADD COLUMN IF NOT EXISTS post_focus_quality INTEGER CHECK (post_focus_quality BETWEEN 1 AND 5);

ALTER TABLE focus_sessions
ADD COLUMN IF NOT EXISTS distractions_count INTEGER DEFAULT 0;

ALTER TABLE focus_sessions
ADD COLUMN IF NOT EXISTS session_mood TEXT;

-- Indexes for quality metrics
CREATE INDEX IF NOT EXISTS idx_focus_sessions_energy
  ON focus_sessions(pre_energy_level)
  WHERE pre_energy_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_focus_sessions_quality
  ON focus_sessions(post_focus_quality)
  WHERE post_focus_quality IS NOT NULL;

-- ========================
-- 3. DISTRACTION LOGS
-- ========================

-- Create distraction_logs table
CREATE TABLE IF NOT EXISTS distraction_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  distraction_type TEXT NOT NULL CHECK (
    distraction_type IN ('phone', 'notification', 'person', 'thought', 'other')
  ),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for distraction_logs
CREATE INDEX IF NOT EXISTS idx_distraction_logs_session
  ON distraction_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_distraction_logs_user
  ON distraction_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_distraction_logs_type
  ON distraction_logs(distraction_type);

-- ========================
-- 4. TAG IMPROVEMENTS
-- ========================

-- Add favorite and sort_order to session_tags
ALTER TABLE session_tags
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

ALTER TABLE session_tags
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Index for sorting tags
CREATE INDEX IF NOT EXISTS idx_session_tags_sort
  ON session_tags(user_id, is_favorite DESC, sort_order ASC);

-- ========================
-- 5. RLS POLICIES
-- ========================

-- RLS for distraction_logs (disabled for dev)
ALTER TABLE distraction_logs DISABLE ROW LEVEL SECURITY;

-- For production, enable these:
-- ALTER TABLE distraction_logs ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can view own distraction logs"
--   ON distraction_logs FOR SELECT
--   USING (auth.uid() = user_id);
--
-- CREATE POLICY "Users can create own distraction logs"
--   ON distraction_logs FOR INSERT
--   WITH CHECK (auth.uid() = user_id);
--
-- CREATE POLICY "Users can delete own distraction logs"
--   ON distraction_logs FOR DELETE
--   USING (auth.uid() = user_id);

-- ========================
-- 6. HELPER VIEWS
-- ========================

-- View for aggregated session stats
CREATE OR REPLACE VIEW focus_session_quality_stats AS
SELECT
  fs.id as session_id,
  fs.user_id,
  fs.start_time,
  fs.duration_minutes,
  fs.pre_energy_level,
  fs.post_focus_quality,
  fs.session_mood,
  fs.objective,
  COALESCE(
    (SELECT COUNT(*) FROM distraction_logs dl WHERE dl.session_id = fs.id),
    fs.distractions_count,
    0
  ) as total_distractions
FROM focus_sessions fs
WHERE fs.completed = true;

-- View for daily focus quality averages
CREATE OR REPLACE VIEW daily_focus_quality AS
SELECT
  DATE(start_time) as date,
  user_id,
  AVG(pre_energy_level) as avg_energy,
  AVG(post_focus_quality) as avg_focus,
  SUM(COALESCE(distractions_count, 0)) as total_distractions,
  COUNT(*) as session_count
FROM focus_sessions
WHERE completed = true
  AND pre_energy_level IS NOT NULL
GROUP BY DATE(start_time), user_id
ORDER BY date DESC;

-- ========================
-- 7. VERIFICATION
-- ========================

SELECT '===== Focus Improvements Migration Complete =====' as status;

-- Verify new columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'focus_sessions'
  AND column_name IN ('objective', 'pre_energy_level', 'post_focus_quality', 'distractions_count', 'session_mood')
ORDER BY column_name;

-- Verify distraction_logs table
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'distraction_logs') as column_count
FROM information_schema.tables
WHERE table_name = 'distraction_logs';
