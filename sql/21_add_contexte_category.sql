-- Migration: Ajouter la catégorie 'contexte' à activity_types
-- Date: 2026-02-22

-- 1. Mise à jour de la contrainte CHECK
ALTER TABLE activity_types
  DROP CONSTRAINT IF EXISTS activity_types_category_check;

ALTER TABLE activity_types
  ADD CONSTRAINT activity_types_category_check
  CHECK (category = ANY (ARRAY[
    'sport'::text, 'social'::text, 'travail'::text,
    'loisirs'::text, 'sante'::text, 'custom'::text, 'contexte'::text
  ]));

-- 2. Insertion des activités par défaut (idempotent)
INSERT INTO activity_types (name, emoji, category, is_default, is_active)
SELECT v.name, v.emoji, v.category::text, true, true
FROM (VALUES
  ('Sport',              '💪', 'sport'),
  ('Marche',             '🚶', 'sport'),
  ('Yoga',               '🧘', 'sport'),
  ('Famille',            '👨‍👩‍👧', 'social'),
  ('Amis',               '👥', 'social'),
  ('Couple',             '❤️', 'social'),
  ('Sortie',             '🎉', 'social'),
  ('Travail',            '💼', 'travail'),
  ('Deep Work',          '🧠', 'travail'),
  ('Réunions',           '🤝', 'travail'),
  ('Méditation',         '🧘', 'sante'),
  ('Bien dormi',         '😴', 'sante'),
  ('Hydraté',            '💧', 'sante'),
  ('Sain',               '🥗', 'sante'),
  ('Vitamines',          '💊', 'sante'),
  ('Lecture',            '📚', 'loisirs'),
  ('Nature',             '🌳', 'loisirs'),
  ('Musique',            '🎵', 'loisirs'),
  ('Gaming',             '🎮', 'loisirs'),
  ('Créatif',            '🎨', 'loisirs'),
  ('Séries',             '📺', 'loisirs'),
  ('Alcool',             '🍺', 'sante'),
  ('Caféine++',          '☕', 'sante'),
  ('Malbouffe',          '🍔', 'sante'),
  ('Écrans tard',        '📱', 'sante'),
  ('Vacances',           '🏖️', 'contexte'),
  ('Voyage',             '✈️', 'contexte'),
  ('Weekend',            '🎉', 'contexte'),
  ('Ski',                '⛷️', 'contexte'),
  ('Van life',           '🚐', 'contexte'),
  ('Télétravail',        '🏠', 'contexte'),
  ('Période stressante', '😤', 'contexte'),
  ('Temps libre',        '😌', 'contexte'),
  ('Sport intensif',     '🏔️', 'contexte')
) AS v(name, emoji, category)
WHERE NOT EXISTS (
  SELECT 1 FROM activity_types at2
  WHERE at2.name = v.name AND at2.is_default = true
);
