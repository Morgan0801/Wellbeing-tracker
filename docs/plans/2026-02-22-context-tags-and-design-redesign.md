# Design Doc — Tags Contexte de Vie & Refonte Design
**Date :** 22 Février 2026
**Projet :** WellBeing Tracker
**Statut :** Approuvé

---

## Objectif

1. Ajouter des **tags de contexte de vie** (Vacances, Ski, Van life...) dans le formulaire de saisie de mood
2. **Refonte visuelle** du modal, de la page Mood, du dashboard et du design global

---

## Feature 1 : Tags Contexte de Vie

### Approche retenue : Catégorie `contexte` dans le système activity_types existant

**Pourquoi :** Réutilise l'infrastructure existante (`activity_types`, `mood_activities`, `ActivityCheckboxes`). Les tags sont riches (emoji + nom), persistent en DB, et permettent des corrélations futures.

### Migrations DB (Supabase — projet "Perso" dfjkqrajelqgoqtcukkx)

1. **ALTER TABLE** `activity_types` : ajouter `'contexte'` dans le CHECK constraint de la colonne `category`
2. **Insérer tags par défaut** dans `activity_types` (`is_default=true`) :
   - 🏖️ Vacances (contexte)
   - ✈️ Voyage (contexte)
   - 🎉 Weekend (contexte)
   - ⛷️ Ski (contexte)
   - 🚐 Van life (contexte)
   - 🏠 Télétravail (contexte)
   - 😤 Période stressante (contexte)
   - 😌 Temps libre (contexte)
   - 🏔️ Sport intensif (contexte)

### Changements Code

- `src/types/index.ts` : Ajouter `'contexte'` à `ACTIVITY_CATEGORIES` avec emoji 🌍, couleur distincte
- `src/components/Mood/ActivityCheckboxes.tsx` : La section `contexte` s'affiche **en tête**, style pills horizontaux scrollables (pas de grid), visuellement différent des activités
- `src/hooks/useActivities.ts` : Vérifier que `addActivityType` supporte la catégorie `contexte` (déjà OK)

### UX Étape 3 du Modal

```
┌─────────────────────────────────────────────┐
│ 🌍 Contexte de vie                           │
│ [🏖️ Vacances] [✈️ Voyage] [🚐 Van life]      │
│ [⛷️ Ski] [🎉 Weekend]  [+ Ajouter]           │
├─────────────────────────────────────────────┤
│ 💪 Sport & Santé                             │
│ [🏃 Running] [🧘 Yoga] [💊 Vitamines]...    │
└─────────────────────────────────────────────┘
```

---

## Feature 2 : Refonte Design

### 2.1 Modal de Saisie (MoodModal.tsx)

- **Barre de progression** : remplace "Étape X sur 5" par une barre animée avec points cliquables
- **Step 1 (Score)** : slider becomes a visual emoji grid with color accent + energy slider polished
- **Step 2 (Émotions)** : pills triées positif / neutre / négatif avec fond légèrement coloré par groupe
- **Step 3 (Activités + Contexte)** : contexte en pills scrollables, activités en grid
- **Step 4 (Domaines)** : sliders avec gradient couleur dynamique (rouge ← 0 → vert)
- **Step 5 (Note)** : textarea plus grande, card propre

### 2.2 Page Mood — Historique (MoodHistory.tsx)

- Cartes redesignées : accent couleur gauche selon score, context tags en pills
- Timeline visuelle au lieu d'une liste plate
- En-tête avec stat du jour mise en avant

### 2.3 Dashboard Widget

- Bouton "Log rapide" plus visible
- Affichage du contexte actif dans le widget mood

### 2.4 Design Global

- Glassmorphism et ombres améliorés sur cards importantes
- Correction PERF-06 : supprimer la transition CSS `*` globale (`src/index.css` ~ligne 258-262)
- Animations Framer Motion plus fluides

---

## Fichiers à Modifier

| Fichier | Type de changement |
|---------|-------------------|
| `src/types/index.ts` | Ajouter catégorie `contexte` dans ACTIVITY_CATEGORIES |
| `src/components/Mood/ActivityCheckboxes.tsx` | Pills contexte en haut, style distinctif |
| `src/components/Mood/MoodModal.tsx` | Barre de progression, design des steps |
| `src/components/Mood/MoodHistory.tsx` | Refonte cartes, timeline |
| `src/components/Mood/MoodPage.tsx` | Header stats amélioré |
| `src/index.css` | Supprimer transition * globale |
| Supabase SQL | Migrations activity_types |

---

## Non-inclus dans ce scope

- Tests unitaires
- Pagination historique
- Notifications push
