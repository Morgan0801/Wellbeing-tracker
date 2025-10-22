# WellBeing-Tracker — Patch correctifs (Sleep / Gamification / Insights / UI formulaires)
Date: 2025-10-22 08:43

## Contenu du patch
Ce patch contient **uniquement** les fichiers modifiés à déposer à la **racine** de votre projet existant pour écraser les versions actuelles :

- src/hooks/useSleep.ts
- src/hooks/useInsights.ts
- src/hooks/useGamification.ts
- src/components/Gratitude/GratitudeModal.tsx
- src/components/Moodboard/MoodboardModal.tsx
- src/components/Goals/GoalModal.tsx

## Résumé des correctifs

### 1) Sommeil (crash à l’ouverture)
- Unification **hook ↔ page** : le hook expose maintenant `isLoading` (et `loading` en alias) ainsi que les helpers attendus par la page : `getAverageSleep`, `getAverageQuality`, `getAverageREM`, `getAverageDeep`, `getAverageHeartRate`.
- Auth cohérente : utilisation de `useAuthStore()` (ID utilisateur) au lieu de `supabase.auth.getUser()`.
- Requêtes filtrées par `user_id` et clés de cache `['sleep-logs', user?.id]`.
- Invalidation de cache alignée sur la même clé.

### 2) Progression (Gamification) — « Impossible de charger les données… »
- Auth cohérente via `useAuthStore()`.
- Ajout de la requête `xpHistory` (`from('xp_history')`) avec filtre `user_id`, ordre desc, limite 50 ; **retourne `xpHistory`** au composant.
- Clé de cache `['gamification', user?.id]` et `['xp-history', user?.id]`.
- `loading` combine le chargement principal + l’historique (`isLoading || isHistoryLoading`).

### 3) Insights — « Pas encore de données… » malgré des entrées
- Correction du **retour** du hook : `return { insights, isLoading, loading: isLoading }`.
- Filtre de période **inclusif** (inclut les bornes) via `isWithinInterval` au lieu de `isAfter && isBefore`.
- Application du filtre inclusif aux humeurs, sommeil et logs d’habitudes.

### 4) UI formulaires (texte blanc sur fond blanc)
- Uniformisation des champs input/textarea des modales **Gratitude / Moodboard / Goals** avec classes :
  `bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`.

## Installation
1. Placez ce fichier `wellbeing-tracker_patch.tar.gz` à la **racine de votre projet** (là où se trouve le dossier `src/`).
2. **Windows PowerShell** :
   ```powershell
   tar -xzf wellbeing-tracker_patch.tar.gz
   ```
   (Les fichiers seront écrasés avec les versions corrigées.)

3. Réinstallez si besoin les deps (facultatif) :
   ```bash
   npm install
   ```

4. Lancez le projet :
   ```bash
   npm run dev
   ```

## Notes
- Ce patch **n’efface pas** vos dossiers miroirs (ex. `components-manquants`, `phase5-package`). Pour éviter de futures confusions, je recommande de conserver **une seule source de vérité** dans `src/` et d’archiver le reste.
- Si vous utilisez une autre méthode d’authentification, les hooks corrigés reposent **uniquement** sur `useAuthStore()` (comme *Mood* / *Habits* / *Tasks*).

Bon test !
