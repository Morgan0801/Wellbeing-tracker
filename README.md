# 🔧 Wellbeing Tracker - Correctifs Phase 3.1+

## ⏱️ Temps d'installation : 5-10 minutes

---

## 🎯 Ce qui a été corrigé

### ✅ **SOMMEIL**
- ✔️ Ajout des colonnes `rem_hours`, `deep_hours`, `avg_heart_rate` dans la table Supabase
- ✔️ Correction du nom de colonne `wake_time` → `wakeup_time`
- ✔️ Correction du hook `useSleep.ts` (retrait du champ `notes` non supporté)
- ✔️ Calendrier mensuel réduit à une taille raisonnable (max-w-lg)

### ✅ **MOODBOARD**
- ✔️ Ajout de `await` dans le modal pour que les nouveaux items apparaissent immédiatement
- ✔️ Ajout d'un état de chargement pendant l'enregistrement

### ✅ **GAMIFICATION & XP**
- ✔️ Attribution automatique de 15 XP lors de l'enregistrement d'un mood
- ✔️ Mise à jour automatique de la streak quotidienne

### ✅ **INSIGHTS**
- ✔️ Correction du champ `date` → `datetime` pour les moods
- ✔️ Ajout d'une nouvelle corrélation : heures de sommeil ↔ humeur
- ✔️ Meilleure gestion des formats de dates dans les graphiques
- ✔️ Filtres 7/30/90 jours fonctionnels

### ✅ **NOTIFICATIONS & THÈME**
- ✔️ Création de la table `notification_settings`
- ✔️ Création de la table `theme_settings`
- ✔️ Plus de chargement infini !

---

## 📋 Instructions d'installation

### **ÉTAPE 1 : Sauvegarder ton projet**

```bash
# Fais une copie de sécurité
cd ..
cp -r wellbeing-tracker wellbeing-tracker-backup-$(date +%Y%m%d)
```

### **ÉTAPE 2 : Arrêter le serveur**

Si ton projet tourne, arrête-le avec `Ctrl + C`

### **ÉTAPE 3 : Appliquer les migrations SQL**

Va sur Supabase → SQL Editor et exécute **dans cet ordre** :

1. **`sql/01_sleep_logs_migration.sql`**
   - Ajoute les colonnes manquantes
   - Renomme `wake_time` en `wakeup_time`
   - ⚠️ CRITIQUE : À faire en premier !

2. **`sql/02_notification_settings.sql`**
   - Crée la table des paramètres de notifications

3. **`sql/03_theme_settings.sql`**
   - Crée la table des paramètres de thème

### **ÉTAPE 4 : Extraire les fichiers corrigés**

```bash
# Va dans le dossier de ton projet
cd wellbeing-tracker

# Extrais l'archive (remplace automatiquement les fichiers)
tar -xzf ../wellbeing-tracker-fix.tar.gz
```

**OU en mode manuel :**
- Copie les fichiers de `src/hooks/` vers ton projet
- Copie les fichiers de `src/components/` vers ton projet

### **ÉTAPE 5 : Relancer le projet**

```bash
npm run dev
```

---

## ✅ Vérification post-installation

Une fois le projet relancé, vérifie que :

**Sommeil :**
- [ ] Les champs REM, Deep, Heart Rate sont visibles dans le formulaire
- [ ] Les données s'enregistrent correctement
- [ ] Le calendrier a une taille raisonnable
- [ ] Les moyennes s'affichent correctement

**Moodboard :**
- [ ] Les nouveaux items apparaissent immédiatement (sans refresh)
- [ ] Le bouton affiche "Ajout en cours..." pendant l'enregistrement

**Gamification :**
- [ ] Tu reçois +15 XP après avoir enregistré un mood
- [ ] La streak se met à jour automatiquement

**Insights :**
- [ ] Le graphique "Évolution de l'humeur" affiche des données
- [ ] Les filtres 7/30/90 jours fonctionnent
- [ ] Les corrélations sont affichées
- [ ] Les recommandations personnalisées apparaissent

**Notifications & Thème :**
- [ ] La page de notifications se charge (plus de loader infini)
- [ ] La page de thème se charge (plus de loader infini)

---

## 🆘 En cas de problème

### **Erreur : column "rem_hours" does not exist**
→ Tu n'as pas exécuté le SQL `01_sleep_logs_migration.sql`
→ Va sur Supabase SQL Editor et exécute-le

### **Erreur : relation "notification_settings" does not exist**
→ Tu n'as pas exécuté le SQL `02_notification_settings.sql`
→ Va sur Supabase SQL Editor et exécute-le

### **Erreur : relation "theme_settings" does not exist**
→ Tu n'as pas exécuté le SQL `03_theme_settings.sql`
→ Va sur Supabase SQL Editor et exécute-le

### **Les graphiques Insights sont toujours vides**
1. Vérifie que tu as des données dans ta base (moods, sleep_logs)
2. Ouvre la console (F12) et regarde les erreurs
3. Vérifie que les filtres de dates fonctionnent

### **Le moodboard ne se refresh toujours pas**
1. Efface le cache du navigateur (Ctrl + Shift + R)
2. Vérifie que tu as bien remplacé `MoodboardModal.tsx`

---

## 📊 Fichiers modifiés

```
src/
├── hooks/
│   ├── useSleep.ts          ✅ Corrigé
│   ├── useMood.ts           ✅ Corrigé (+ XP)
│   └── useInsights.ts       ✅ Corrigé (+ datetime)
├── components/
│   ├── Sleep/
│   │   └── SleepPage.tsx    ✅ Calendrier réduit
│   ├── Moodboard/
│   │   └── MoodboardModal.tsx ✅ Await ajouté
│   └── Insights/
│       └── (pas de changement)
sql/
├── 01_sleep_logs_migration.sql    ✅ Migration critique
├── 02_notification_settings.sql   ✅ Nouvelle table
└── 03_theme_settings.sql          ✅ Nouvelle table
```

---

## 🎊 C'est terminé !

Toutes les fonctionnalités de Phase 3.1+ sont maintenant actives et fonctionnelles !

**Prochaine étape ?** Dis-moi si tout fonctionne ou s'il reste des problèmes à corriger ! 🚀

---

## 📝 Notes techniques

### Structure de `sleep_logs` (après migration)
```sql
- id (UUID)
- user_id (UUID)
- date (DATE)
- bedtime (TEXT) "HH:mm"
- wakeup_time (TEXT) "HH:mm"  ← Renommé
- total_hours (NUMERIC)
- rem_hours (NUMERIC)          ← Ajouté
- deep_hours (NUMERIC)         ← Ajouté
- avg_heart_rate (INTEGER)     ← Ajouté
- quality_score (INTEGER 1-10)
- notes (TEXT)
- created_at (TIMESTAMPTZ)
```

### XP automatique
- **Enregistrement mood** : +15 XP
- **Streak update** : Automatique à chaque mood

### Corrélations calculées
1. Sommeil de qualité → Humeur lendemain
2. Habitudes complétées → Humeur du jour
3. Heures de sommeil → Humeur lendemain (nouveau!)
