# PLAN D'IMPLEMENTATION - WellBeing Tracker
## Audit Complet & Feuille de Route

> **Date:** 15 Février 2026
> **App:** WellBeing Tracker (React 18 + TypeScript + Supabase + Vite)
> **Score Global Actuel:** 6.4/10

---

## TABLE DES MATIERES

1. [Resume de l'Audit](#1-resume-de-laudit)
2. [Bugs Critiques a Corriger](#2-bugs-critiques-a-corriger)
3. [Problemes de Performance](#3-problemes-de-performance)
4. [Ameliorations de Securite](#4-ameliorations-de-securite)
5. [Ameliorations UX/UI](#5-ameliorations-uxui)
6. [Nouvelles Fonctionnalites](#6-nouvelles-fonctionnalites)
7. [Refactoring & Qualite de Code](#7-refactoring--qualite-de-code)
8. [Tests & Monitoring](#8-tests--monitoring)
9. [Priorites & Planning](#9-priorites--planning)

---

## 1. RESUME DE L'AUDIT

### Points Forts
| Aspect | Score | Detail |
|--------|-------|--------|
| **Completude fonctionnelle** | 9/10 | Mood, habits, focus, sleep, gamification, AI, water, gratitude, goals, moodboard |
| **Architecture** | 8/10 | Bonne organisation par feature, React Query bien utilise |
| **UI/UX Visuel** | 8/10 | Design soigne, animations Framer Motion fluides, palette wellness |
| **Stack technique** | 8/10 | Choix modernes et coherents (Vite, Zustand, TanStack Query, Tailwind) |

### Points Faibles
| Aspect | Score | Detail |
|--------|-------|--------|
| **Tests** | 2/10 | Aucun test unitaire, integration, ou E2E |
| **Gestion d'erreurs** | 4/10 | Pas d'Error Boundaries, erreurs silencieuses |
| **Securite** | 5/10 | Cle API Gemini exposee cote client, auth localStorage |
| **Documentation** | 5/10 | Logique complexe non documentee (correlations, algorithmes) |
| **Performance** | 6/10 | Invalidation cache trop large, pas de pagination |
| **Accessibilite** | 6/10 | ARIA labels manquants, pas de focus trap dans les modals |

---

## 2. BUGS CRITIQUES A CORRIGER

### BUG-01: XP non deduit quand une tache est decochee
- **Fichier:** `src/hooks/useTasks.ts`
- **Probleme:** Quand on decoche une tache, le early return empeche la deduction de XP
- **Impact:** L'XP ne fait qu'augmenter, jamais diminuer - systeme de gamification fausse
- **Correction:** Restructurer la logique pour gerer les deux cas (ajout et retrait d'XP) avant le return

### BUG-02: Operations multi-etapes non atomiques
- **Fichier:** `src/hooks/useMood.ts`
- **Probleme:** L'ajout d'un mood + ses domains + XP = 3 inserts separes sans transaction
- **Impact:** Si l'etape 2 echoue, on a un mood sans domains (donnees orphelines)
- **Correction:** Utiliser une fonction Supabase RPC qui fait les 3 operations en une transaction PostgreSQL

### BUG-03: Filtre duplique dans useGamification
- **Fichier:** `src/hooks/useGamification.ts`
- **Probleme:** `.eq('user_id', user.id)` apparait deux fois dans la meme requete
- **Impact:** Mineur (la requete fonctionne mais c'est un code smell)
- **Correction:** Supprimer le doublon

### BUG-04: Gestion des tags legacy incompletes dans Focus
- **Fichier:** `src/hooks/useFocusEnhanced.ts`
- **Probleme:** Fallback `session.category` vs `session.tags` - si les deux existent, `category` est ignore
- **Impact:** Des sessions anciennes peuvent perdre leur categorie lors de la migration vers les tags multiples
- **Correction:** Script de migration pour convertir tous les `category` existants en tags, puis supprimer le champ legacy

### BUG-05: Parsing de dates inconsistant
- **Fichiers:** `src/hooks/useInsights.ts`, `src/lib/gemini.ts`, composants divers
- **Probleme:** Certaines tables utilisent `datetime`, d'autres `date`, d'autres `created_at`
- **Impact:** `parseISO` echoue silencieusement si le format ne correspond pas
- **Correction:** Creer une fonction utilitaire `parseEntityDate(entity)` qui normalise tous les formats

### BUG-06: RLS potentiellement desactive en production
- **Fichier:** `sql/11_disable_rls_for_dev.sql` et `sql/12_disable_rls_fix.sql`
- **Probleme:** 20+ fichiers de migration RLS indiquent un historique de problemes - le RLS pourrait etre desactive
- **Impact:** CRITIQUE - N'importe qui pourrait lire/ecrire les donnees de tous les utilisateurs
- **Correction:** Audit complet des politiques RLS actuelles via `supabase db inspect`, re-activer et tester

---

## 3. PROBLEMES DE PERFORMANCE

### PERF-01: Invalidation de cache trop large
- **Fichiers:** Tous les hooks avec mutations
- **Probleme:** `queryClient.invalidateQueries({ queryKey: ['moods'] })` invalide TOUTES les requetes mood
- **Impact:** Re-fetch inutile de donnees, flash de loading, mauvaise UX
- **Correction:** Utiliser `setQueryData` pour mise a jour optimiste + invalidation ciblee

### PERF-02: Pas de pagination sur les historiques
- **Fichiers:** `FocusHistory.tsx`, `MoodHistory.tsx`, `SleepPage.tsx`
- **Probleme:** Toutes les sessions/moods sont chargees en memoire
- **Impact:** Lenteur croissante avec l'usage (1000+ entrees = probleme)
- **Correction:** Implementer cursor-based pagination avec `useInfiniteQuery`

### PERF-03: Hook useAI charge tout a chaque appel
- **Fichier:** `src/hooks/useAI.ts`
- **Probleme:** 13 requetes Supabase en parallele pour chaque appel AI, meme si seule une partie est necessaire
- **Impact:** Latence et bande passante gaspillees
- **Correction:** Charger uniquement les donnees necessaires selon le type d'analyse demandee

### PERF-04: Composants lourds sans memoisation
- **Fichiers:** Composants de statistiques, graphiques Recharts
- **Probleme:** `todayStats`, `weekStats`, listes filtrees recalculees a chaque render
- **Impact:** Janks visuels avec beaucoup de donnees
- **Correction:** `useMemo` pour les calculs couteux, `React.memo` pour les items de listes

### PERF-05: Contexte AI trop volumineux
- **Fichier:** `src/lib/gemini.ts`
- **Probleme:** Le prompt systeme serialise 3000+ caracteres de statistiques en texte brut
- **Impact:** Tokens Gemini gaspilles, latence accrue
- **Correction:** Condenser le contexte, utiliser des embeddings ou un resume structure

### PERF-06: Transition CSS globale sur tous les elements
- **Fichier:** `src/index.css` (ligne 258-262)
- **Probleme:** `* { transition-property: color, background-color... }` s'applique a TOUT
- **Impact:** Performances de rendering degradees, animations inattendues
- **Correction:** Appliquer les transitions uniquement aux elements interactifs

---

## 4. AMELIORATIONS DE SECURITE

### SEC-01: Cle API Gemini exposee cote client
- **Fichier:** `src/lib/gemini.ts`
- **Probleme:** `import.meta.env.VITE_GEMINI_API_KEY` est inclus dans le bundle JS visible par tous
- **Impact:** N'importe qui peut utiliser votre cle API Gemini a vos frais
- **Correction:** Creer une Supabase Edge Function qui sert de proxy pour les appels Gemini. Le front appelle l'Edge Function, qui appelle Gemini avec la cle stockee en secret.

### SEC-02: Auth basee sur localStorage
- **Fichier:** `src/stores/authStore.ts`
- **Probleme:** Le token/user est stocke en clair dans localStorage via Zustand persist
- **Impact:** Vulnerable au XSS - un script malveillant peut voler la session
- **Correction:** Utiliser l'auth Supabase native avec cookies HTTP-only (supabase.auth.getSession())

### SEC-03: Logs de donnees utilisateur en console
- **Fichier:** `src/lib/gemini.ts`
- **Probleme:** `console.log('Raw Response:', assistantMessage.substring(0, 500))`
- **Impact:** Les donnees personnelles apparaissent dans la console du navigateur
- **Correction:** Supprimer tous les console.log en production (ou utiliser un flag de debug)

### SEC-04: Pas de rate limiting sur les requetes AI
- **Fichier:** `src/hooks/useAI.ts`
- **Probleme:** Aucune limite sur le nombre d'appels AI par utilisateur/par jour
- **Impact:** Un utilisateur peut generer des couts Gemini illimites
- **Correction:** Ajouter un compteur d'appels AI cote Supabase avec un maximum quotidien

---

## 5. AMELIORATIONS UX/UI

### UX-01: Ajouter des Error Boundaries React
- **Fichier:** `src/App.tsx` et chaque page principale
- **Probleme:** Si un composant crash, toute l'app tombe
- **Correction:** Wrapper chaque page dans un ErrorBoundary avec un fallback UI agreable
- **Bonus:** Permettre a l'utilisateur de "reessayer" sans recharger l'app

### UX-02: Etats vides plus informatifs
- **Fichier:** `src/components/ui/EmptyState.tsx` (existe deja)
- **Probleme:** Certaines pages n'utilisent pas d'etat vide quand il n'y a pas de donnees
- **Correction:** Ajouter des etats vides guides (avec CTA "Ajouter votre premier...") sur toutes les pages

### UX-03: Feedback haptique et sonore
- **Probleme:** Les actions importantes (completer une habitude, finir un pomodoro) n'ont que du visuel
- **Correction:** Ajouter vibration API sur mobile + sons optionnels (avec setting pour desactiver)

### UX-04: Mode hors-ligne (Offline First)
- **Probleme:** L'app ne fonctionne pas sans connexion internet
- **Correction:** Implementer un Service Worker avec cache des donnees recentes + sync quand la connexion revient

### UX-05: Onboarding / Tutorial premiere utilisation
- **Probleme:** Un nouvel utilisateur arrive sur un dashboard vide sans savoir quoi faire
- **Correction:** Wizard d'onboarding en 4-5 etapes : choisir ses habitudes, definir un premier objectif, premier mood

### UX-06: Ameliorer les transitions de page
- **Fichier:** `src/App.tsx`
- **Probleme:** Le systeme d'onglets sans React Router ne supporte pas les gestures swipe ou l'historique navigateur
- **Correction:** Considerer l'ajout de gestures swipe entre onglets (touch) + AnimatePresence pour transitions

### UX-07: Ajouter un Pull-to-Refresh mobile
- **Probleme:** Sur mobile, pas de moyen intuitif de rafraichir les donnees
- **Correction:** Implementer un pull-to-refresh natif avec invalidation des queries

### UX-08: Notifications push reelles
- **Fichier:** `src/hooks/useNotifications.ts`
- **Probleme:** Les notifications semblent etre uniquement des settings sans implementation push reelle
- **Correction:** Implementer Web Push Notifications via Service Worker + Supabase Edge Function pour les rappels

### UX-09: Widget rapide sur la page d'accueil
- **Probleme:** Pour logger son humeur, il faut naviguer vers la page Mood
- **Correction:** Ajouter un "Quick Log" sur le dashboard : mood rapide en 1 clic + habitudes du jour

---

## 6. NOUVELLES FONCTIONNALITES

### FEAT-01: Journal / Notes personnelles
- **Description:** Section journal pour ecrire librement ses pensees du jour
- **Pourquoi:** Complement naturel au mood tracking - l'ecriture aide au bien-etre
- **Implementation:** Table `journal_entries(id, user_id, content, mood_id?, date, tags)` + page avec editeur riche simple

### FEAT-02: Rappels intelligents bases sur les patterns
- **Description:** L'IA detecte vos patterns et suggere des rappels
- **Exemple:** "Vous etes toujours plus heureux quand vous faites du sport le matin. Rappel a 7h ?"
- **Implementation:** Analyse des correlations existantes + generation de rappels personnalises

### FEAT-03: Mode Social / Challenges avec amis
- **Description:** Partager des challenges d'habitudes avec des amis
- **Exemple:** "Challenge 30 jours meditation avec @ami"
- **Implementation:** Table `challenges`, `challenge_participants`, systeme d'invitations

### FEAT-04: Meditation guidee integree
- **Description:** Timer de meditation avec sons d'ambiance et exercices de respiration
- **Pourquoi:** Complement naturel du focus timer et du suivi bien-etre
- **Implementation:** Composant `MeditationPage` avec timer, sons (rain, nature, white noise), guide de respiration anime

### FEAT-05: Suivi nutritionnel basique
- **Description:** Logger ses repas simplement (qualite 1-5, type de repas, hydratation liee)
- **Pourquoi:** La nutrition impacte l'humeur et l'energie - correlation precieuse
- **Implementation:** Table `meal_logs(id, user_id, meal_type, quality, notes, date)` + integration dans les correlations

### FEAT-06: Export avance et rapports periodiques
- **Fichier existant:** `src/components/Export/ExportPage.tsx`
- **Amelioration:** Ajouter des rapports hebdomadaires/mensuels automatiques envoyes par email
- **Implementation:** Edge Function CRON qui genere un PDF resume et l'envoie

### FEAT-07: Themes sombres ameliores + theme auto
- **Fichier existant:** `src/lib/themes.ts`
- **Amelioration:** Le dark mode existe dans le CSS mais les themes ne semblent pas avoir de variante sombre
- **Correction:** Ajouter une variante dark pour chaque theme (ocean dark, forest dark, etc.) + auto basee sur l'heure

### FEAT-08: Streaks visuels et calendrier global
- **Description:** Vue calendrier unifiee montrant TOUTES les activites (mood, habits, focus, sleep)
- **Pourquoi:** Vision globale de sa consistance au fil du temps
- **Implementation:** Composant calendrier heatmap avec superposition de couleurs par type d'activite

### FEAT-09: Import de donnees depuis d'autres apps
- **Description:** Import CSV/JSON depuis Apple Health, Fitbit, Google Fit
- **Pourquoi:** Facilite la migration et enrichit les donnees
- **Implementation:** Parsers pour formats courants + page d'import avec mapping de champs

### FEAT-10: Systeme de quetes IA dynamiques
- **Fichier existant:** `src/types/phase5-types.ts` (Quest type existe)
- **Amelioration:** L'IA genere des quetes personnalisees basees sur vos habitudes et objectifs
- **Exemple:** "Cette semaine, essayez de mediter 3 fois" base sur vos patterns

### FEAT-11: Widget de respiration rapide
- **Description:** Exercice de respiration accessible depuis n'importe quelle page (FAB ou menu +)
- **Pourquoi:** Utile en moment de stress - acces rapide essentiel
- **Implementation:** Animation cercle qui grandit/retrecit avec guide (4-7-8, box breathing)

### FEAT-12: Suivi des symptomes physiques
- **Description:** Logger les symptomes physiques (mal de tete, fatigue, douleurs)
- **Pourquoi:** Correlation entre symptomes physiques et humeur/sommeil
- **Implementation:** Table `symptom_logs`, selecteur de symptomes avec intensite, integration correlations

---

## 7. REFACTORING & QUALITE DE CODE

### REF-01: Creer un module utilitaire de dates
- **Probleme:** Parsing de dates duplique dans 5+ fichiers
- **Solution:** `src/lib/dates.ts` avec `parseEntityDate()`, `formatRelative()`, `isWithinRange()`

### REF-02: Extraire le parsing JSON des reponses AI
- **Probleme:** Le meme pattern d'extraction JSON des blocs markdown est repete 3+ fois dans `gemini.ts`
- **Solution:** `parseJsonFromMarkdown(text: string): T` dans `src/lib/ai-utils.ts`

### REF-03: Uniformiser les messages d'erreur (i18n)
- **Probleme:** Messages d'erreur melanges anglais/francais
- **Solution:** `src/lib/errors.ts` avec constantes bilingues et fonction `getErrorMessage(code)`

### REF-04: Ajouter des types stricts partout
- **Probleme:** Usage de `any` dans certains hooks (useInsights, useAI)
- **Solution:** Typer explicitement tous les retours de hooks et les reponses Supabase

### REF-05: Implementer une couche de service
- **Probleme:** La logique metier est directement dans les hooks React
- **Solution:** Creer `src/services/` avec des classes/fonctions pures pour la logique (moodService, habitService, etc.) - les hooks deviennent de simples wrappers React Query

### REF-06: Optimiser les imports Recharts
- **Probleme:** Recharts est une grosse librairie (300kb+), probablement importee en entier
- **Solution:** Verifier le tree-shaking, utiliser des imports specifiques

### REF-07: Nettoyer les migrations SQL
- **Probleme:** 20+ fichiers de migration avec des noms comme "ultimate_fix", "final_fix", "simple_fix"
- **Solution:** Consolider en un seul schema propre + script de migration pour les instances existantes

---

## 8. TESTS & MONITORING

### TEST-01: Tests unitaires des hooks
- **Priorite:** HAUTE
- **Outils:** Vitest + React Testing Library
- **Cibles prioritaires:**
  - `useTasks.ts` (bug XP)
  - `useGamification.ts` (calculs de niveau)
  - `useMood.ts` (ajout avec domains)
  - `useFocusEnhanced.ts` (statistiques)
- **Config:** Ajouter `vitest` dans `vite.config.ts`, creer `src/__tests__/`

### TEST-02: Tests d'integration
- **Priorite:** MOYENNE
- **Cibles:**
  - Flow complet : login -> ajouter mood -> voir dans historique
  - Flow : creer habitude -> la completer -> voir XP augmenter
  - Flow : session focus -> voir stats mises a jour

### TEST-03: Tests E2E
- **Priorite:** BASSE (apres les corrections critiques)
- **Outils:** Playwright
- **Cibles:** Parcours utilisateur complets sur les 3-4 features principales

### TEST-04: Monitoring d'erreurs
- **Probleme:** Aucune visibilite sur les erreurs en production
- **Solution:** Integrer Sentry (gratuit pour petits volumes) pour capter les erreurs runtime

### TEST-05: Analytics d'usage
- **Probleme:** Pas de donnees sur comment les utilisateurs utilisent l'app
- **Solution:** Posthog ou Plausible (privacy-friendly) pour comprendre les features les plus/moins utilisees

---

## 9. PRIORITES & PLANNING

### Phase 1 - CORRECTIFS CRITIQUES (Semaines 1-2)
| ID | Tache | Effort | Impact |
|----|-------|--------|--------|
| BUG-01 | Fix XP non deduit | 1h | CRITIQUE |
| BUG-02 | Transactions atomiques mood | 3h | HAUT |
| BUG-06 | Audit + fix RLS policies | 4h | CRITIQUE |
| SEC-01 | Proxy Gemini via Edge Function | 4h | CRITIQUE |
| SEC-03 | Supprimer console.log production | 1h | MOYEN |
| UX-01 | Error Boundaries | 3h | HAUT |

### Phase 2 - PERFORMANCE & SECURITE (Semaines 3-4)
| ID | Tache | Effort | Impact |
|----|-------|--------|--------|
| SEC-02 | Migrer auth vers Supabase native | 6h | HAUT |
| SEC-04 | Rate limiting appels AI | 3h | MOYEN |
| PERF-01 | Optimiser invalidation cache | 4h | HAUT |
| PERF-02 | Pagination historiques | 6h | HAUT |
| PERF-06 | Fix transition CSS globale | 1h | MOYEN |
| BUG-03 | Fix filtre duplique gamification | 0.5h | BAS |
| BUG-04 | Migration tags legacy focus | 2h | MOYEN |
| BUG-05 | Utilitaire parsing dates | 2h | MOYEN |

### Phase 3 - QUALITE & TESTS (Semaines 5-6)
| ID | Tache | Effort | Impact |
|----|-------|--------|--------|
| TEST-01 | Tests unitaires hooks critiques | 8h | HAUT |
| REF-01 | Module utilitaire dates | 2h | MOYEN |
| REF-02 | Extraction parsing JSON AI | 2h | MOYEN |
| REF-03 | Uniformiser messages erreur | 3h | MOYEN |
| REF-04 | Types stricts partout | 4h | MOYEN |
| TEST-04 | Integration Sentry | 2h | HAUT |

### Phase 4 - UX POLISH (Semaines 7-8)
| ID | Tache | Effort | Impact |
|----|-------|--------|--------|
| UX-02 | Etats vides guides | 3h | MOYEN |
| UX-05 | Onboarding wizard | 8h | HAUT |
| UX-06 | Transitions de page swipe | 4h | MOYEN |
| UX-09 | Widget Quick Log dashboard | 4h | HAUT |
| FEAT-07 | Themes dark ameliores | 4h | MOYEN |
| FEAT-11 | Widget respiration rapide | 4h | MOYEN |

### Phase 5 - NOUVELLES FEATURES (Semaines 9-12)
| ID | Tache | Effort | Impact |
|----|-------|--------|--------|
| FEAT-01 | Journal personnel | 12h | HAUT |
| FEAT-04 | Meditation guidee | 10h | HAUT |
| FEAT-08 | Calendrier global unifie | 8h | MOYEN |
| FEAT-10 | Quetes IA dynamiques | 10h | HAUT |
| FEAT-02 | Rappels intelligents | 8h | MOYEN |
| UX-08 | Notifications push reelles | 8h | HAUT |
| UX-04 | Mode offline | 12h | MOYEN |

### Phase 6 - EXPANSION (Semaines 13+)
| ID | Tache | Effort | Impact |
|----|-------|--------|--------|
| FEAT-03 | Mode social / challenges | 20h | HAUT |
| FEAT-05 | Suivi nutritionnel | 10h | MOYEN |
| FEAT-06 | Rapports email periodiques | 8h | MOYEN |
| FEAT-09 | Import donnees externes | 12h | MOYEN |
| FEAT-12 | Suivi symptomes physiques | 8h | MOYEN |
| REF-05 | Couche de services | 12h | MOYEN |
| TEST-02 | Tests integration | 8h | MOYEN |
| TEST-03 | Tests E2E Playwright | 10h | BAS |

---

## RESUME VISUEL DES SCORES

```
AVANT CORRECTIONS:
Architecture      ████████░░ 8/10
Completude        █████████░ 9/10
UI/UX             ████████░░ 8/10
Performance       ██████░░░░ 6/10
Securite          █████░░░░░ 5/10
Gestion erreurs   ████░░░░░░ 4/10
Tests             ██░░░░░░░░ 2/10
Documentation     █████░░░░░ 5/10
Accessibilite     ██████░░░░ 6/10
─────────────────────────────────
GLOBAL            ██████░░░░ 6.4/10

OBJECTIF APRES PHASE 4:
Architecture      █████████░ 9/10
Completude        █████████░ 9/10
UI/UX             █████████░ 9/10
Performance       ████████░░ 8/10
Securite          ████████░░ 8/10
Gestion erreurs   ████████░░ 8/10
Tests             ██████░░░░ 6/10
Documentation     ███████░░░ 7/10
Accessibilite     ████████░░ 8/10
─────────────────────────────────
GLOBAL            ████████░░ 8/10
```

---

## NOTE FINALE

L'application WellBeing Tracker est **impressionnante en termes de fonctionnalites**. Le design est soigne, l'integration AI avec Gemini est bien pensee, et la palette wellness cree une experience agreable.

Les corrections critiques (Phases 1-2) sont indispensables avant toute mise en production. Une fois ces fondations solidifiees, les nouvelles fonctionnalites (journal, meditation, quetes IA) transformeront l'app en un veritable compagnon de bien-etre complet.

**Prochaine etape recommandee :** Commencer par la Phase 1 - les 6 corrections critiques qui peuvent etre faites en quelques jours et qui ameliorent immediatement la fiabilite de l'app.
