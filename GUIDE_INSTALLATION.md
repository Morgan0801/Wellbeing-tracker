# 🚀 Guide d'Installation - Wellbeing Tracker v4.0

## ⏱️ Installation : 2 minutes

---

## 📋 Ce qui a été corrigé

✅ **Corrections techniques** :
- Imports de composants (InsightsPage)
- Tables Supabase (`moods` au lieu de `mood_logs`, `mood_domains` au lieu de `domain_impacts`)
- Système de badges automatique amélioré

✅ **Nouvelles fonctionnalités** :
- **Insights avancés** : Croisements de données dynamiques (sommeil/humeur, habitudes/humeur, productivité/humeur)
- **Filtres temporels** : Analyses sur 7, 30 ou 90 jours
- **Statistiques visuelles** : Graphiques et corrélations multiples
- **Recommandations personnalisées** : Conseils basés sur vos données

---

## 🔧 Installation

### Étape 1 : Extraire l'archive

```bash
tar -xzf wellbeing-tracker-v4.tar.gz
cd wellbeing-tracker
```

### Étape 2 : Installer les dépendances (si première installation)

```bash
npm install
```

### Étape 3 : Configurer Supabase

Si ce n'est pas déjà fait, créez un fichier `.env` :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
```

### Étape 4 : Lancer l'application

```bash
npm run dev
```

---

## ✅ Vérification

Une fois lancée, vérifiez que :

- [ ] Le dashboard s'affiche sans erreur
- [ ] Vous pouvez créer un nouveau mood
- [ ] L'onglet **Insights** affiche les analyses croisées
- [ ] Les badges se débloquent automatiquement
- [ ] Les filtres temporels fonctionnent (7j/30j/90j)

---

## 🎯 Nouvelles fonctionnalités Insights

### 1. Domaines de vie & Humeur
Analyse l'impact de chaque domaine (travail, sport, amour, etc.) sur votre humeur.

### 2. Sommeil & Humeur
Corrélation entre vos heures de sommeil et votre humeur quotidienne.

### 3. Habitudes & Humeur
Impact de vos habitudes par catégorie sur votre bien-être.

### 4. Productivité & Humeur
Relation entre les types de tâches complétées et votre humeur.

---

## ❓ En cas de problème

### Erreur 403 sur Firebase
C'est normal si vous n'utilisez pas Firebase. Cette erreur n'affecte pas l'application.

### Écran blanc
1. Vérifiez la console (F12) pour les erreurs
2. Vérifiez votre connexion Supabase (fichier `.env`)
3. Videz le cache : `Ctrl + Shift + R`

### Les données ne s'enregistrent pas
1. Vérifiez les noms de tables dans Supabase
2. Assurez-vous que les tables `moods` et `mood_domains` existent
3. Vérifiez les permissions RLS (Row Level Security)

---

## 📞 Support

Pour toute question ou problème :
- Vérifiez les erreurs dans la console (F12)
- Consultez les logs Supabase
- Contactez-moi avec le message d'erreur exact

---

## 🎉 Profitez de l'application !

Toutes les fonctionnalités sont maintenant opérationnelles et corrigées.
