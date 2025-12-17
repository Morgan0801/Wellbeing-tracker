# Améliorations Focus/Pomodoro Timer

## 📋 Résumé des fonctionnalités implémentées

### 1. **Objectif de Session** ✅
- Champ texte pour définir l'objectif avant chaque session Pomodoro
- Affichage de l'objectif pendant la session en cours
- Stockage en base de données et affichage dans l'historique

### 2. **Sélection de Tags Améliorée** ✅
- **Recherche** : Filtre instantané des tags par nom ou emoji
- **Tags récents** : Affichage des 5 derniers tags utilisés en haut de liste
- **Favoris** : Système d'étoiles pour marquer les tags favoris (localStorage)
- **Tri intelligent** : Favoris → Récents → Alphabétique
- Animations fluides avec Framer Motion
- Boutons d'action au survol (favori, suppression)

### 3. **Suivi Qualité du Focus** ✅
- **PreSessionModal** : Évaluation du niveau d'énergie (1-5) avant de commencer
- **DistractionTracker** : Bouton flottant pendant les sessions pour logger les distractions
  - 5 types : 📱 Téléphone, 🔔 Notification, 👤 Personne, 💭 Pensée, ❓ Autre
- **PostSessionModal** : Après la session
  - Qualité du focus (1-5)
  - Mood de session (6 emojis prédéfinis)
  - Notes optionnelles
- **Affichage dans l'historique** : Toutes les métriques visibles par session

## 📁 Fichiers créés

### Composants
- `src/components/Focus/PreSessionModal.tsx` ✅
- `src/components/Focus/PostSessionModal.tsx` ✅
- `src/components/Focus/DistractionTracker.tsx` ✅
- `src/components/Focus/EnhancedTagSelector.tsx` ✅

### Script SQL
- `sql/18_focus_improvements.sql` ✅

## 📁 Fichiers modifiés

- `src/types/index.ts` - Ajout des nouveaux types et constantes
- `src/hooks/useFocusEnhanced.ts` - Nouveaux champs et mutations
- `src/components/Focus/PomodoroTimer.tsx` - Intégration des modals et tracker
- `src/components/Focus/FocusHistory.tsx` - Affichage des métriques

## 🗄️ Migration Base de Données

### 1. Exécuter le script SQL

**Option A : Via Supabase SQL Editor**
1. Aller sur [https://supabase.com](https://supabase.com)
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Copier-coller le contenu de `sql/18_focus_improvements.sql`
5. Cliquer sur **Run**

**Option B : Via CLI Supabase**
```bash
supabase db push
```

### 2. Vérifications

Le script SQL ajoute :

**Colonnes dans `focus_sessions`** :
- `objective` (TEXT) - Objectif de la session
- `pre_energy_level` (INTEGER 1-5) - Niveau d'énergie pré-session
- `post_focus_quality` (INTEGER 1-5) - Qualité du focus post-session
- `distractions_count` (INTEGER) - Nombre de distractions
- `session_mood` (TEXT) - Emoji mood

**Nouvelle table `distraction_logs`** :
- Logs détaillés des distractions par session
- Types : phone, notification, person, thought, other

**Colonnes dans `session_tags`** :
- `is_favorite` (BOOLEAN) - Tag favori
- `sort_order` (INTEGER) - Ordre personnalisé

**Vues** :
- `focus_session_quality_stats` - Stats agrégées par session
- `daily_focus_quality` - Moyennes quotidiennes

## 🚀 Démarrage

### 1. Installer les dépendances (si nécessaire)
```bash
npm install
```

### 2. Lancer le serveur de développement
```bash
npm run dev
```

### 3. Tester les nouvelles fonctionnalités

#### Test 1 : Démarrer une session avec objectif
1. Aller sur l'onglet Focus
2. Sélectionner des tags (recherche, favoris)
3. Cliquer sur "Démarrer"
4. **Modal pré-session s'affiche** :
   - Remplir l'objectif
   - Sélectionner le niveau d'énergie
5. Session démarre avec objectif affiché

#### Test 2 : Logger des distractions
1. Pendant une session active (Pomodoro)
2. **Bouton flottant en bas à droite** apparaît
3. Cliquer dessus
4. Sélectionner un type de distraction
5. Compteur s'incrémente

#### Test 3 : Terminer une session
1. Cliquer sur "Terminer maintenant" (bouton vert ✓)
2. **Modal post-session s'affiche** :
   - Résumé (durée, distractions, objectif)
   - Évaluer qualité du focus
   - Sélectionner mood
   - Ajouter notes optionnelles
3. Enregistrer

#### Test 4 : Consulter l'historique
1. Aller dans l'historique des sessions
2. **Nouvelles infos visibles** :
   - 🎯 Objectif
   - ⚡ Énergie + emoji
   - ⭐ Focus
   - 🚨 Distractions
   - Emoji mood

## 🎨 UI/UX Highlights

### EnhancedTagSelector
- Barre de recherche avec icône
- Section "Récents" avec Clock icon
- Chips animés (hover scale, tap feedback)
- Étoile jaune pour favoris
- Actions au hover (favori + suppression)
- Compteur de sélection (x/5)
- Bouton "Effacer" pour reset

### PreSessionModal
- 5 boutons d'énergie avec emojis + couleurs dynamiques
- Input objectif avec compteur de caractères (200 max)
- Boutons "Passer" et "Démarrer"
- Animations Framer Motion

### PostSessionModal
- Card résumé avec gradient
- 5 boutons qualité focus (même style énergie)
- 6 boutons mood en grid
- Textarea notes avec compteur (300 max)
- Boutons "Passer" et "Enregistrer"

### DistractionTracker
- Position fixée bottom-right
- Bouton compact avec compteur
- Expansion au clic avec 5 types
- Badge rouge si distractions > 0
- AnimatePresence pour transitions

## 🔧 Structure des Données

### FocusSession (TypeScript)
```typescript
interface FocusSession {
  // ... champs existants
  objective?: string;
  pre_energy_level?: number; // 1-5
  post_focus_quality?: number; // 1-5
  distractions_count?: number;
  session_mood?: string; // emoji
}
```

### Constantes
```typescript
ENERGY_LEVELS = [
  { value: 1, label: 'Très faible', emoji: '😴', color: '#EF4444' },
  { value: 2, label: 'Faible', emoji: '😔', color: '#F97316' },
  { value: 3, label: 'Moyen', emoji: '😐', color: '#EAB308' },
  { value: 4, label: 'Bon', emoji: '🙂', color: '#84CC16' },
  { value: 5, label: 'Excellent', emoji: '🔥', color: '#22C55E' },
];

DISTRACTION_TYPES = [
  { type: 'phone', label: 'Téléphone', emoji: '📱' },
  { type: 'notification', label: 'Notification', emoji: '🔔' },
  { type: 'person', label: 'Personne', emoji: '👤' },
  { type: 'thought', label: 'Pensée vagabonde', emoji: '💭' },
  { type: 'other', label: 'Autre', emoji: '❓' },
];

SESSION_MOODS = [
  { emoji: '🎯', label: 'Concentré' },
  { emoji: '😤', label: 'Frustré' },
  { emoji: '😌', label: 'Calme' },
  { emoji: '🚀', label: 'Productif' },
  { emoji: '😵', label: 'Fatigué' },
  { emoji: '💪', label: 'Motivé' },
];
```

## 📊 Insights Futurs (Non implémenté)

Le composant `FocusQualityInsights.tsx` peut être créé ultérieurement pour afficher :
- Énergie moyenne / Focus moyen / Distractions par session
- Top 3 créneaux horaires (meilleure énergie)
- Graphique corrélation énergie ↔ focus
- Répartition distractions par type

## ✅ Checklist de déploiement

- [x] Script SQL créé
- [x] Types TypeScript mis à jour
- [x] Hook useFocusEnhanced modifié
- [x] Composants créés (4)
- [x] PomodoroTimer intégré
- [x] FocusHistory modifié
- [ ] **IMPORTANT : Exécuter le script SQL sur Supabase**
- [ ] Tester en local
- [ ] Build production (`npm run build`)
- [ ] Déployer

## 🐛 Troubleshooting

### Erreur "Column does not exist"
→ Le script SQL n'a pas été exécuté. Aller dans Supabase SQL Editor et exécuter `sql/18_focus_improvements.sql`

### Tags récents ne s'affichent pas
→ Normal si aucune session n'a été complétée avec des tags. Compléter quelques sessions pour voir apparaître la section.

### Favoris ne persistent pas
→ Vérifier que localStorage fonctionne. Ouvrir DevTools → Application → Local Storage → Clé `favorite-tags`

### Distraction Tracker ne s'affiche pas
→ Normal si :
- Session n'est pas en cours (isRunning = false)
- Mode n'est pas 'pomodoro' (seulement pour focus)

## 📝 Notes

- Tous les champs sont **optionnels** : l'utilisateur peut passer les modals
- Le système est **rétrocompatible** : les anciennes sessions sans métriques fonctionnent normalement
- Les breaks (pause courte/longue) **ne déclenchent pas les modals** : seulement les sessions Pomodoro
- Le compteur de distractions est **local** pendant la session, puis sauvegardé à la fin

Bon développement ! 🚀
