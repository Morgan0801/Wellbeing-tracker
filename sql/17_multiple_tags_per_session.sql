-- ============================================
-- PERMETTRE PLUSIEURS TAGS PAR SESSION
-- ============================================

-- 1. Créer une table de liaison (many-to-many)
CREATE TABLE IF NOT EXISTS focus_session_tag_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_session_tag UNIQUE(session_id, tag_name)
);

-- 2. Index pour requêtes performantes
CREATE INDEX IF NOT EXISTS idx_session_tag_links_session
  ON focus_session_tag_links(session_id);

CREATE INDEX IF NOT EXISTS idx_session_tag_links_tag
  ON focus_session_tag_links(tag_name);

-- 3. Migration des données existantes
-- Migrer le champ category vers la table de liaison
INSERT INTO focus_session_tag_links (session_id, tag_name)
SELECT id, category
FROM focus_sessions
WHERE category IS NOT NULL
ON CONFLICT (session_id, tag_name) DO NOTHING;

-- 4. RLS désactivé pour dev (comme focus_sessions)
ALTER TABLE focus_session_tag_links DISABLE ROW LEVEL SECURITY;

-- 5. Fonction helper pour récupérer les tags d'une session
CREATE OR REPLACE FUNCTION get_session_tags(p_session_id UUID)
RETURNS TEXT[] AS $$
  SELECT ARRAY_AGG(tag_name ORDER BY tag_name)
  FROM focus_session_tag_links
  WHERE session_id = p_session_id;
$$ LANGUAGE SQL STABLE;

-- 6. Vue enrichie avec tags (optionnel, pour faciliter les requêtes)
CREATE OR REPLACE VIEW focus_sessions_with_tags AS
SELECT
  fs.*,
  COALESCE(
    (SELECT ARRAY_AGG(fstl.tag_name ORDER BY fstl.tag_name)
     FROM focus_session_tag_links fstl
     WHERE fstl.session_id = fs.id),
    ARRAY[]::TEXT[]
  ) as tags
FROM focus_sessions fs;

-- 7. Vérification
SELECT '✅ Table de liaison créée et données migrées' as status;

SELECT
  COUNT(*) as total_links,
  COUNT(DISTINCT session_id) as sessions_with_tags,
  COUNT(DISTINCT tag_name) as unique_tags
FROM focus_session_tag_links;
