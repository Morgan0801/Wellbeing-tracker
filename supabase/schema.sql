-- ============================================
-- WELLBEING TRACKER - SUPABASE SCHEMA
-- Phase 1 + 2: Fondations + Mood Tracker
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{"theme": "light", "widgets_visible": ["mood", "weather", "stats"]}'::jsonb
);

-- ============================================
-- TABLE: moods
-- ============================================
CREATE TABLE IF NOT EXISTS moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score_global INTEGER NOT NULL CHECK (score_global >= 1 AND score_global <= 10),
  emotions TEXT[] DEFAULT '{}',
  note TEXT,
  weather JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_moods_user_id ON moods(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_datetime ON moods(datetime DESC);

-- ============================================
-- TABLE: mood_domains
-- ============================================
CREATE TABLE IF NOT EXISTS mood_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mood_id UUID NOT NULL REFERENCES moods(id) ON DELETE CASCADE,
  domain TEXT NOT NULL CHECK (domain IN ('travail', 'sport', 'amour', 'amis', 'famille', 'finances', 'loisirs', 'bienetre')),
  impact INTEGER NOT NULL CHECK (impact >= -5 AND impact <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_mood_domains_mood_id ON mood_domains(mood_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_domains ENABLE ROW LEVEL SECURITY;

-- Pour Phase 1, on permet tout (authentification simple côté client)
-- En production, tu devrais implémenter une vraie authentification Supabase

-- Policy pour users: tout le monde peut tout faire (simple pour Phase 1)
CREATE POLICY "Enable all access for users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Policy pour moods: tout le monde peut tout faire (simple pour Phase 1)
CREATE POLICY "Enable all access for moods" ON moods
  FOR ALL USING (true) WITH CHECK (true);

-- Policy pour mood_domains: tout le monde peut tout faire (simple pour Phase 1)
CREATE POLICY "Enable all access for mood_domains" ON mood_domains
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- NOTES D'INSTALLATION
-- ============================================
-- 1. Copie tout ce script
-- 2. Va dans ton projet Supabase
-- 3. Clique sur "SQL Editor" dans la sidebar
-- 4. Colle le script et clique sur "Run"
-- 5. Vérifie que les tables sont créées dans "Table Editor"
-- 
-- Les policies RLS sont volontairement permissives pour Phase 1
-- En Phase 3+, on implémentera une vraie authentification avec
-- des policies basées sur user_id
-- ============================================
