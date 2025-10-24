# 🚀 GUIDE D'INSTALLATION RAPIDE

## ⚡ Installation Express (3 étapes)

### 1️⃣ SUPABASE SQL (5 min)
Ouvre Supabase → SQL Editor → Exécute dans cet ordre :

```sql
-- FICHIER 1: sql/01_sleep_logs_migration.sql
-- (Ajoute rem_hours, deep_hours, avg_heart_rate)

-- FICHIER 2: sql/02_notification_settings.sql
-- (Crée la table notifications)

-- FICHIER 3: sql/03_theme_settings.sql
-- (Crée la table thèmes)
```

### 2️⃣ EXTRACTION (1 min)
```bash
cd wellbeing-tracker
tar -xzf wellbeing-tracker-fix.tar.gz
```

### 3️⃣ LANCEMENT (30 sec)
```bash
npm run dev
```

---

## ✅ TEST RAPIDE

Après installation, vérifie :
1. ✔️ **Sommeil** : Enregistre une nuit → REM/Deep/HeartRate visibles
2. ✔️ **Moodboard** : Ajoute un item → Apparaît immédiatement
3. ✔️ **XP** : Enregistre un mood → +15 XP s'affiche
4. ✔️ **Insights** : Clique sur "7 jours" → Graphique change
5. ✔️ **Notifications** : Ouvre la page → Pas de loader infini

---

## 🎯 RÉSUMÉ DES CORRECTIONS

| Problème | Solution | Fichier |
|----------|----------|---------|
| 🛏️ Données sommeil non enregistrées | Migration SQL + Hook corrigé | `01_sleep_logs_migration.sql` + `useSleep.ts` |
| 📅 Calendrier trop grand | Taille réduite max-w-lg | `SleepPage.tsx` |
| 🖼️ Moodboard pas de refresh | Ajout await | `MoodboardModal.tsx` |
| 🎮 Pas de XP mood | Intégration auto XP | `useMood.ts` |
| 📊 Graphique humeur vide | Correction datetime | `useInsights.ts` |
| 🔔 Loader infini notifications | Création table | `02_notification_settings.sql` |
| 🎨 Loader infini thème | Création table | `03_theme_settings.sql` |

---

## 🆘 DÉPANNAGE RAPIDE

**❌ Erreur "column rem_hours does not exist"**
→ Exécute `01_sleep_logs_migration.sql` sur Supabase

**❌ Erreur "relation notification_settings does not exist"**
→ Exécute `02_notification_settings.sql` sur Supabase

**❌ Erreur "relation theme_settings does not exist"**
→ Exécute `03_theme_settings.sql` sur Supabase

**❌ Graphiques Insights toujours vides**
→ Efface le cache (Ctrl+Shift+R) + Vérifie que tu as des données

---

## 📁 CONTENU DE L'ARCHIVE

```
wellbeing-tracker-fix.tar.gz
│
├── README.md                     📖 Documentation complète
├── GUIDE_RAPIDE.md              ⚡ Ce guide
│
├── sql/
│   ├── 01_sleep_logs_migration.sql    🛏️ CRITIQUE
│   ├── 02_notification_settings.sql   🔔 Requis
│   └── 03_theme_settings.sql          🎨 Requis
│
└── src/
    ├── hooks/
    │   ├── useSleep.ts              ✅ Corrigé
    │   ├── useMood.ts               ✅ + XP auto
    │   └── useInsights.ts           ✅ + datetime
    │
    └── components/
        ├── Sleep/
        │   └── SleepPage.tsx        ✅ Calendrier réduit
        └── Moodboard/
            └── MoodboardModal.tsx   ✅ Await ajouté
```

---

## 🎊 PRÊT ? C'EST PARTI !

1. Télécharge `wellbeing-tracker-fix.tar.gz`
2. Exécute les 3 SQL sur Supabase
3. Extrais l'archive dans ton projet
4. Lance `npm run dev`
5. Profite ! 🚀

**Questions ?** Ouvre README.md pour plus de détails !
