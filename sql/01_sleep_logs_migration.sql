-- ============================================
-- MIGRATION SLEEP_LOGS - Phase 3.1 COMPLETE
-- Ajoute: rem_hours, deep_hours, avg_heart_rate
-- Corrige: wake_time → wakeup_time
-- ============================================

-- ÉTAPE 1: Ajouter les nouvelles colonnes
ALTER TABLE sleep_logs 
  ADD COLUMN IF NOT EXISTS rem_hours NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deep_hours NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_heart_rate INTEGER DEFAULT 60;

-- ÉTAPE 2: Renommer wake_time en wakeup_time (pour cohérence avec le code)
ALTER TABLE sleep_logs 
  RENAME COLUMN wake_time TO wakeup_time;

-- ÉTAPE 3: Mettre à jour les contraintes de validation
ALTER TABLE sleep_logs
  ADD CONSTRAINT check_rem_hours CHECK (rem_hours >= 0 AND rem_hours <= 24),
  ADD CONSTRAINT check_deep_hours CHECK (deep_hours >= 0 AND deep_hours <= 24),
  ADD CONSTRAINT check_avg_heart_rate CHECK (avg_heart_rate >= 30 AND avg_heart_rate <= 220);

-- ÉTAPE 4: Mettre à jour les données existantes avec des valeurs par défaut raisonnables
-- (REM = ~25% du sommeil total, Deep = ~20% du sommeil total)
UPDATE sleep_logs
SET 
  rem_hours = COALESCE(rem_hours, total_hours * 0.25),
  deep_hours = COALESCE(deep_hours, total_hours * 0.20),
  avg_heart_rate = COALESCE(avg_heart_rate, 60)
WHERE rem_hours = 0 OR deep_hours = 0 OR avg_heart_rate = 60;

-- Message de confirmation
SELECT 
  'Migration sleep_logs terminée! ✅' as message,
  COUNT(*) as total_logs_updated
FROM sleep_logs;

-- Vérification de la structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'sleep_logs'
ORDER BY ordinal_position;
