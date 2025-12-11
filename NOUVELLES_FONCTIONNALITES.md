# Nouvelles Fonctionnalités - Insights et Corrélations

## 📊 Vue d'ensemble

Toutes les données collectées sont maintenant exploitées dans des insights et statistiques avancés avec des corrélations entre les différentes métriques.

## ✨ Nouveautés

### 1. **Insights Sommeil** (SleepPage)
   - **Comparaison Seul(e) vs En Couple**
     - Qualité du sommeil moyenne dans chaque situation
     - Durée du sommeil moyenne
     - Sommeil profond moyen
     - Conclusion automatique sur quelle situation améliore ton sommeil

   - **Corrélation Sommeil ↔ Humeur**
     - Impact du sommeil sur l'humeur du lendemain
     - Comparaison humeur après bon sommeil (8+/10) vs mauvais sommeil (<8/10)
     - Détection de corrélation forte

   - **Corrélation Sommeil ↔ Énergie**
     - Impact de la durée du sommeil sur le niveau d'énergie
     - Comparaison énergie après 7h+ de sommeil vs <7h
     - Affichage de l'impact en points d'énergie

### 2. **Insights Énergie** (MoodPage)
   - **Niveau d'énergie moyen**
     - Moyenne sur 30 jours
     - Tendance (hausse/baisse par rapport aux 7 jours précédents)

   - **Activités qui boostent l'énergie**
     - Top 5 des activités qui augmentent ton énergie
     - Différence de points d'énergie avec/sans l'activité
     - Nombre d'observations

   - **Activités qui drainent l'énergie**
     - Top 5 des activités qui réduisent ton énergie
     - Impact négatif mesuré en points
     - Nombre d'observations

### 3. **Insights Croisés** (Dashboard)
   Combine TOUTES les données pour générer des insights intelligents :

   - **Impact du sommeil sur l'humeur** : "Ton humeur est meilleure de X points après une bonne nuit"
   - **Top activité positive** : "Sport améliore ton humeur de +2.3 points en moyenne !"
   - **Activités à éviter** : "Écrans tard semble réduire ton humeur de -1.5 points"
   - **Boost d'énergie** : "Marche te donne un boost d'énergie de +1.8 points"
   - **Draineur d'énergie** : "Réunions réduit ton énergie de -2.1 points"
   - **Tendance humeur** : "Ton humeur augmente de 1.2 points cette semaine"
   - **Qualité sommeil** : "Excellente semaine de sommeil ! Qualité moyenne de 8.5/10"

### 4. **Améliorations existantes**
   - **ActivityInsights** continue de fonctionner avec les corrélations activités-humeur
   - **MoodInsights** continue d'afficher les meilleurs/pires moments et domaines de vie

## 🎯 Données utilisées

### Précédemment inutilisées :
- ✅ `slept_alone` (sommeil seul vs en couple) → Maintenant dans SleepInsights
- ✅ `energy_level` (niveau d'énergie) → Maintenant dans EnergyInsights et corrélations
- ✅ Activités et leur impact sur l'énergie → Maintenant dans EnergyInsights
- ✅ Corrélations croisées sommeil-humeur-énergie → Maintenant dans CrossInsights

### Déjà utilisées :
- ✅ Activités et leur impact sur l'humeur → ActivityInsights
- ✅ Domaines de vie et émotions → MoodInsights
- ✅ Statistiques de sommeil → SleepStatsChart

## 📍 Où trouver les insights

1. **Dashboard** :
   - [CrossInsights](src/components/Dashboard/CrossInsights.tsx) - Insights croisés combinant toutes les données

2. **Page Mood** :
   - [MoodInsights](src/components/Mood/MoodInsights.tsx) - Meilleurs/pires moments, émotions fréquentes
   - [ActivityInsights](src/components/Mood/ActivityInsights.tsx) - Impact des activités sur l'humeur
   - [EnergyInsights](src/components/Mood/EnergyInsights.tsx) - Analyse du niveau d'énergie ⭐ NOUVEAU

3. **Page Sommeil** :
   - [SleepInsights](src/components/Sleep/SleepInsights.tsx) - Comparaison seul/couple, corrélations sommeil-humeur-énergie ⭐ NOUVEAU

## 🔧 Hooks créés

- [useSleepCorrelations](src/hooks/useSleepCorrelations.ts) - Calcule les corrélations sommeil
- [useEnergyCorrelations](src/hooks/useEnergyCorrelations.ts) - Calcule les corrélations énergie
- [useActivityCorrelations](src/hooks/useActivityCorrelations.ts) - Déjà existant, corrélations activités-humeur

## 💡 Prochaines améliorations possibles

- Corrélations entre activités et qualité du sommeil
- Impact des habitudes sur l'humeur et l'énergie
- Suggestions personnalisées basées sur les insights
- Export des insights en PDF
- Graphiques de corrélations visuels (scatter plots)
