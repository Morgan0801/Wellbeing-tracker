# 🎯 Insights Avancés - Documentation Complète

## 📊 Vue d'ensemble

**100% des données collectées** sont exploitées dans des insights et corrélations intelligentes entre toutes les métriques.

---

## ✨ Nouveaux Composants d'Insights

### 1. **AdvancedMoodInsights** (MoodPage) ⭐ NOUVEAU

Analyse les patterns comportementaux et temporels pour identifier ce qui fonctionne le mieux pour toi.

#### 🕐 Meilleur Moment de la Journée
- **Analyse par période** : Matin (5h-12h), Après-midi (12h-18h), Soirée (18h-5h)
- **Métriques** : Humeur moyenne, énergie moyenne par période
- **Activités fréquentes** : Top 3 des activités dans ton meilleur moment
- **Exemple** : "Tu es au top en Après-midi avec une humeur de 8.2/10 !"

#### 📊 Variations Journalières
- **Comparaison des 3 périodes** : Voir comment ton humeur et énergie varient dans la journée
- **Optimisation** : Identifie les moments où tu es naturellement plus performant(e)

#### 💝 Pattern Social vs Temps pour Soi
- **Analyse comparative** :
  - Moments sociaux (Famille, Amis, Couple, Sortie)
  - Temps pour soi (activités solo)
- **Métriques** : Humeur et énergie moyennes dans chaque situation
- **Conclusion automatique** :
  - "Tu t'épanouis dans les moments sociaux ! Humeur +1.5 points"
  - "Tu te ressources dans la solitude ! Humeur +1.2 points"
  - "Équilibre parfait ! Tu te sens aussi bien seul(e) qu'avec d'autres"

#### ✨ Combinaisons Gagnantes
- **Détection automatique** : Identifie les combinaisons d'activités qui marchent le mieux
- **Seuil de qualité** : Uniquement les combos avec 7+/10 d'humeur
- **Exemples** :
  - "Sport + Nature : combo parfait avec 8.5/10 d'humeur !"
  - "Méditation + Lecture + Bien dormi : 9.2/10 d'humeur"
- **Données affichées** : Humeur moyenne, énergie moyenne, nombre d'observations

---

### 2. **CrossInsights Améliorés** (Dashboard) 🚀

Combine **TOUTES** les données pour générer jusqu'à **12 types d'insights intelligents**.

#### Nouveaux insights ajoutés :

**8. ⏰ Meilleur Moment**
- "Tu es au top en Soirée avec une humeur de 8.5/10 !"

**9. 💝 Pattern Social**
- "Les moments sociaux boostent ton humeur de +1.8 points !"
- "Tu te ressources mieux dans la solitude (+1.5 points)"

**10. 💑 Sommeil Seul vs Couple**
- "Tu dors mieux en couple ! Qualité +1.2 points"
- "Tu dors mieux seul(e) ! Qualité +0.8 points"

**11. ✨ Combinaison Gagnante**
- "Sport + Nature + Bien dormi : combo parfait avec 8.8/10 d'humeur !"

**12. ⚡ Niveau d'Énergie Global**
- "Super énergie ce mois ! Moyenne de 7.5/10"
- "Ton énergie est basse (4.2/10). Pense à te reposer !"

---

## 🔧 Nouveaux Hooks

### **useAdvancedMoodInsights**

```typescript
const {
  timeOfDayPatterns,      // Patterns par période de la journée
  bestTimeOfDay,          // Ton meilleur moment
  socialPatterns,         // Social vs Seul
  winningCombinations,    // Combinaisons d'activités gagnantes
  hasSufficientData,
} = useAdvancedMoodInsights(30); // 30 derniers jours
```

**Analyses incluses** :
- ✅ Pattern temporel (matin, après-midi, soirée)
- ✅ Activités fréquentes par période
- ✅ Comparaison social vs solo
- ✅ Combinaisons d'activités (2+ activités sur une même journée)
- ✅ Filtrage par seuil de qualité (7+/10)

---

## 📈 Insights par Catégorie

### 🌙 Sommeil
1. **Seul vs Couple** : Comparaison qualité, durée, sommeil profond
2. **Impact sur Humeur** : Corrélation sommeil → humeur lendemain
3. **Impact sur Énergie** : Corrélation durée → niveau d'énergie
4. **Qualité Récente** : Tendance sur 7 derniers jours

### 😊 Humeur
1. **Meilleur/Pire Moment** : Jours extrêmes avec notes
2. **Émotions Fréquentes** : Top 5 émotions
3. **Domaines de Vie** : Meilleur/pire domaine
4. **Tendance** : Évolution sur 7 derniers jours
5. **Meilleur Moment** : Période de la journée optimale

### 🔋 Énergie
1. **Niveau Moyen** : Moyenne sur 30 jours
2. **Tendance** : Hausse/baisse par rapport aux 7 jours précédents
3. **Boosters** : Top 5 activités qui augmentent l'énergie
4. **Drainers** : Top 5 activités qui réduisent l'énergie
5. **Patterns Temporels** : Énergie par période de journée

### 🎯 Activités
1. **Impact Humeur** : Corrélations activités ↔ humeur
2. **Impact Énergie** : Corrélations activités ↔ énergie
3. **Patterns Sociaux** : Social vs solo
4. **Combinaisons** : Synergies entre activités
5. **Moments Optimaux** : Quelles activités à quel moment

---

## 💡 Exemples d'Insights Générés

### Dashboard - CrossInsights
```
😴 Ton humeur est meilleure de 1.8 points après une bonne nuit.
💪 Sport améliore ton humeur de 2.3 points en moyenne !
📱 Écrans tard semble réduire ton humeur de -1.5 points.
🚶 Marche te donne un boost d'énergie de +1.8 points.
⏰ Tu es au top en Après-midi avec une humeur de 8.2/10 !
💝 Les moments sociaux boostent ton humeur de +1.5 points !
✨ Sport + Nature + Méditation : combo parfait avec 8.8/10 d'humeur !
```

### MoodPage - AdvancedMoodInsights
```
🕐 Meilleur Moment : Après-midi
   Humeur: 8.2/10 | Énergie: 7.5/10
   Activités fréquentes: 💼 Travail, 🧠 Deep Work, ☕ Caféine++

📊 Variations Journalières :
   Matin:      Humeur 7.1 | Énergie 6.2
   Après-midi: Humeur 8.2 | Énergie 7.5
   Soirée:     Humeur 7.8 | Énergie 5.9

💝 Social vs Temps pour soi :
   Moments sociaux:  Humeur 8.4/10 | Énergie 7.2/10 (45 entrées)
   Temps pour soi:   Humeur 6.9/10 | Énergie 6.5/10 (38 entrées)
   → Tu t'épanouis dans les moments sociaux ! Humeur +1.5 points

✨ Combinaisons Gagnantes :
   1. 💪 Sport + 🚶 Marche + 😴 Bien dormi
      Humeur: 8.8/10 | Énergie: 8.2/10 (12 fois)

   2. ❤️ Couple + 🎉 Sortie + 🌳 Nature
      Humeur: 8.5/10 | Énergie: 7.8/10 (8 fois)
```

---

## 🎨 Améliorations Visuelles

### Codes Couleur
- **Vert** 🟢 : Insights positifs (boost, amélioration)
- **Orange** 🟠 : Warnings (baisse, attention requise)
- **Bleu** 🔵 : Info (patterns neutres, observations)

### Icônes Contextuelles
- ⏰ Temps / Moments
- 💝 Social / Couple
- 🧘 Solo / Introspection
- ✨ Combinaisons / Synergies
- ⚡ Énergie / Boost
- 🔋 Batterie / Niveau
- 📊 Tendances / Stats
- 🌙 Sommeil
- 💪 Sport / Activité

---

## 📍 Localisation des Insights

### **Dashboard**
- [CrossInsights](src/components/Dashboard/CrossInsights.tsx) - 12 types d'insights intelligents

### **Page Mood**
- [MoodInsights](src/components/Mood/MoodInsights.tsx) - Meilleurs/pires moments, émotions, domaines
- [ActivityInsights](src/components/Mood/ActivityInsights.tsx) - Impact activités sur humeur
- [EnergyInsights](src/components/Mood/EnergyInsights.tsx) - Analyse niveau d'énergie
- [AdvancedMoodInsights](src/components/Mood/AdvancedMoodInsights.tsx) - Patterns temporels, social, combinaisons ⭐

### **Page Sommeil**
- [SleepInsights](src/components/Sleep/SleepInsights.tsx) - Seul/couple, corrélations sommeil-humeur-énergie

---

## 🔬 Algorithmes et Seuils

### Seuils de Significativité
- **Minimum données** : 3-5 entrées selon le type d'insight
- **Corrélation forte** : |différence| > 0.5 pour humeur, > 0.8 pour pattern social
- **Combinaison valide** : 2+ observations avec humeur ≥ 7/10
- **Pattern temporel** : Basé sur heures (5-12h, 12-18h, 18-5h)

### Calculs de Corrélations
```typescript
// Exemple : Corrélation activité-humeur
avgMoodWith = moyenne(humeurs des jours avec activité)
avgMoodWithout = moyenne(humeurs des jours sans activité)
difference = avgMoodWith - avgMoodWithout
isSignificant = |difference| > 0.5 ET min 5 jours avec/sans
```

---

## 🚀 Prochaines Améliorations Possibles

1. **Machine Learning** : Prédiction de l'humeur basée sur les patterns
2. **Recommandations** : Suggestions personnalisées d'activités
3. **Alertes** : Notifications si patterns négatifs détectés
4. **Comparaisons temporelles** : Mois vs mois, saison vs saison
5. **Graphiques avancés** : Heatmaps de corrélations, scatter plots
6. **Export insights** : PDF avec tous les insights personnalisés

---

## ✅ Résumé

### Données exploitées à 100% :
✅ `slept_alone` (sommeil seul/couple)
✅ `energy_level` (niveau d'énergie)
✅ Activités contextuelles (sport, social, travail, loisirs, santé)
✅ Patterns temporels (heures de la journée)
✅ Patterns sociaux (seul vs avec autres)
✅ Combinaisons d'activités
✅ Corrélations croisées (sommeil ↔ humeur ↔ énergie ↔ activités)

### Insights générés : **12 types** au total
### Composants créés : **6 nouveaux**
### Hooks créés : **3 nouveaux**
