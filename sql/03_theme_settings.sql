-- ============================================
-- TABLE THEME_SETTINGS
-- Gère la personnalisation visuelle pour chaque utilisateur
-- ============================================

-- Supprimer la table si elle existe (pour recréation propre)
DROP TABLE IF EXISTS theme_settings CASCADE;

-- Créer la table
CREATE TABLE theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Informations du thème
  theme_name TEXT DEFAULT 'Ocean Blue',
  is_custom BOOLEAN DEFAULT false,
  
  -- Couleurs (stockées en JSONB pour flexibilité)
  colors JSONB DEFAULT '{
    "primary": "#3B82F6",
    "secondary": "#8B5CF6",
    "accent": "#F59E0B",
    "background": "#FFFFFF",
    "foreground": "#1F2937",
    "muted": "#F3F4F6",
    "border": "#E5E7EB"
  }'::jsonb,
  
  -- Paramètres visuels
  spacing TEXT DEFAULT 'normal' CHECK (spacing IN ('compact', 'normal', 'spacious')),
  radius INTEGER DEFAULT 12 CHECK (radius >= 0 AND radius <= 50),
  font TEXT DEFAULT 'inter' CHECK (font IN ('inter', 'poppins', 'roboto')),
  
  -- Effets visuels (stockés en JSONB)
  effects JSONB DEFAULT '{
    "glassmorphism": false,
    "neumorphism": false,
    "shadows": "md",
    "animations": true
  }'::jsonb,
  
  -- Image de fond (URL optionnelle)
  background_image TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte: un seul thème par utilisateur
  UNIQUE(user_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_theme_settings_user_id ON theme_settings(user_id);

-- Row Level Security
ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for theme_settings" ON theme_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Message de confirmation
SELECT 'Table theme_settings créée avec succès! 🎨' as message;
