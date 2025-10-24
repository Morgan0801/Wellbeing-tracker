-- ============================================
-- TABLE NOTIFICATION_SETTINGS
-- Gère les paramètres de rappels pour chaque utilisateur
-- ============================================

-- Supprimer la table si elle existe (pour recréation propre)
DROP TABLE IF EXISTS notification_settings CASCADE;

-- Créer la table
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Paramètres par catégorie
  habits_enabled BOOLEAN DEFAULT true,
  habits_time TEXT DEFAULT '09:00',
  
  sleep_enabled BOOLEAN DEFAULT true,
  sleep_time TEXT DEFAULT '22:00',
  
  mood_enabled BOOLEAN DEFAULT true,
  mood_time TEXT DEFAULT '20:00',
  
  gratitude_enabled BOOLEAN DEFAULT true,
  gratitude_time TEXT DEFAULT '21:00',
  
  tasks_enabled BOOLEAN DEFAULT true,
  
  -- Options générales
  sound_enabled BOOLEAN DEFAULT true,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte: un seul paramétrage par utilisateur
  UNIQUE(user_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);

-- Row Level Security
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for notification_settings" ON notification_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Message de confirmation
SELECT 'Table notification_settings créée avec succès! 🔔' as message;
