Audit Complet & Opportunités d'Intégration IA - Wellbeing Tracker
📊 AUDIT DU PROJET ACTUEL
Résumé Exécutif
Wellbeing Tracker est une application complète de suivi du bien-être et de la productivité qui combine :
15 pages/fonctionnalités distinctes
25+ tables de base de données
Suivi multi-dimensionnel du bien-être (mental, physique, productivité, social)
Système de gamification (XP, niveaux, badges)
Analytics avancés avec corrélations croisées
Stack Technique
Frontend: React 18 + TypeScript + Vite
UI: TailwindCSS + Framer Motion + Recharts
Backend: Supabase (PostgreSQL + Auth)
State: Zustand + React Query
IA déjà installée: @anthropic-ai/claude-agent-sdk 0.1.27
Fonctionnalités Existantes (15 Modules)
1. Mood Tracking (Suivi d'Humeur)
Score global 1-10
35+ émotions (positives, neutres, négatives)
8 domaines de vie avec impact individuel (travail, sport, amour, amis, famille, finances, loisirs, bien-être mental)
Niveau d'énergie (1-10)
Niveau de stress (1-10)
25+ activités prédéfinies
Intégration météo automatique
Notes contextuelles
+15 XP par entrée
2. Habits Tracking (Suivi d'Habitudes)
4 quadrants organisés (Vitalité & Santé, Bien-être Mental, Productivité, Loisirs)
Fréquences flexibles (quotidien, 2x/semaine, 3x/semaine, hebdo)
Habitudes quantifiables (ex: "3km course", "2L eau")
Heatmap calendrier avec historique
Statistiques par habitude
3. Tasks Management (Gestion de Tâches)
Matrice d'Eisenhower (4 quadrants)
Vue matricielle + vue calendrier
Deadlines avec détection retards
Tâches récurrentes
Horaires planifiés avec durée
Section "Tâches du jour"
Historique tâches complétées (7 derniers jours)
4. Focus/Pomodoro Timer (RÉCEMMENT AMÉLIORÉ)
3 modes de timer (Pomodoro 25min, Pause courte 5min, Pause longue 15min)
Animation tasse de café qui se remplit/vide
Système de tags personnalisables (emoji + couleur)
Tags multiples par session
Notation qualité (1-5 étoiles)
Entrée manuelle pour sessions hors-ligne
Historique avec édition/suppression
Statistiques complètes (total minutes, sessions, moyennes, breakdown par tag)
Notifications navigateur
5. Sleep Tracking (Suivi Sommeil)
Heures totales + REM + sommeil profond
Rythme cardiaque moyen
Heure coucher/réveil
Score qualité (1-10)
Seul vs en couple
Vue calendrier mensuel avec heatmap qualité
Insights sommeil (solo vs couple, sommeil→humeur, sommeil→énergie)
6. Goals (Objectifs)
5 catégories (Personnel, Professionnel, Santé, Finances, Loisirs)
Dates cibles
Système de jalons (sous-objectifs)
Suivi progression
Marquage complétion avec timestamp
7. Gratitude Journal
Entrées quotidiennes (3 choses)
Emoji d'humeur par entrée
Vue historique
8. Moodboard
3 types de contenu (Images URL, Citations, Affirmations)
4 catégories (Motivation, Calme, Joie, Inspiration)
Galerie visuelle
9. Advanced Insights (Analyses Avancées)
Filtres période (7/30/90 jours)
Heatmaps humeur et sommeil
Analyse corrélation sommeil-humeur
Impact habitudes sur humeur et sommeil
Impact domaines
Insights completion tâches
10. Dashboard
En-tête performance avec salutation personnalisée
Cartes résumé (layout Bento) : humeur du jour, sommeil, habitudes, XP
CrossInsights : 12 types d'insights intelligents
Impact sommeil→humeur
Top activité positive
Activités à éviter
Boosters d'énergie
Draineurs d'énergie
Tendances humeur
Tendances sommeil
Meilleur moment de la journée
Patterns social vs solo
Sommeil seul vs en couple
Combinaisons gagnantes d'activités
Niveau énergétique global
Objectifs actifs
Habitudes du jour
Graphiques XP et sommeil (7 jours)
11. Gamification
Système XP (10-100 XP par action)
Progression niveaux (formule: level = √(XP/100) + 1)
Badges d'achievement
Streaks quotidiens
Historique XP (50 dernières actions)
Quêtes (défis quotidiens/hebdo/mensuels)
12-15. Autres Features
CalendarPage : Vue unifiée tous événements
ExportPage : Export PDF/JSON
NotificationsSettings : Configuration notifications
ThemeSettings : Mode clair/sombre, thèmes personnalisés
WaterPage : Suivi hydratation
Architecture de Données
Tables principales (25+) :
users, moods, mood_domains, mood_activities, activity_types
habits, habit_logs
tasks
sleep_logs
focus_sessions, session_tags, focus_session_tag_links
goals, goal_milestones
gratitude_entries
moodboard_items
user_gamification, xp_history
water_logs, water_goals
notification_settings, theme_settings
Fonctions PostgreSQL (RPC) :
add_xp() : Ajout XP centralisé
calculate_level() : Calcul niveau
update_user_level() : Trigger auto-update niveau