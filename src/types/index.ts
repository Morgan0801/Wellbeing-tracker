// Types pour l'application Wellbeing Tracker

export interface User {
  id: string;
  created_at: string;
  settings?: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  widgets_visible: string[];
}

export interface Mood {
  id: string;
  user_id: string;
  datetime: string;
  score_global: number;
  emotions: string[];
  note?: string;
  weather?: WeatherData;
}

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  icon: string;
}

export interface MoodDomain {
  id: string;
  mood_id: string;
  domain: DomainType;
  impact: number;
}

export type DomainType = 
  | 'travail' | 'sport' | 'amour' | 'amis' 
  | 'famille' | 'finances' | 'loisirs' | 'bienetre';

export const DOMAINS: { type: DomainType; label: string; emoji: string; color: string }[] = [
  { type: 'travail', label: 'Travail', emoji: '💼', color: '#5C6BC0' },
  { type: 'sport', label: 'Sport & Santé', emoji: '💪', color: '#66BB6A' },
  { type: 'amour', label: 'Relation Amoureuse', emoji: '❤️', color: '#EC407A' },
  { type: 'amis', label: 'Amis & Vie Sociale', emoji: '👥', color: '#42A5F5' },
  { type: 'famille', label: 'Famille', emoji: '🏠', color: '#AB47BC' },
  { type: 'finances', label: 'Finances', emoji: '💰', color: '#FFA726' },
  { type: 'loisirs', label: 'Loisirs & Créativité', emoji: '🎨', color: '#26C6DA' },
  { type: 'bienetre', label: 'Bien-être Mental', emoji: '🧘', color: '#9CCC65' },
];

export const EMOTIONS = [
  // Positives
  { emoji: '😊', label: 'Heureux', type: 'positive' },
  { emoji: '😌', label: 'Serein', type: 'positive' },
  { emoji: '💪', label: 'Motivé', type: 'positive' },
  { emoji: '🌟', label: 'Inspiré', type: 'positive' },
  { emoji: '😄', label: 'Joyeux', type: 'positive' },
  { emoji: '🥰', label: 'Aimé', type: 'positive' },
  { emoji: '🔥', label: 'Énergique', type: 'positive' },
  { emoji: '😎', label: 'Confiant', type: 'positive' },
  { emoji: '🙏', label: 'Reconnaissant', type: 'positive' },
  { emoji: '🎯', label: 'Concentré', type: 'positive' },
  { emoji: '✨', label: 'Optimiste', type: 'positive' },
  { emoji: '💫', label: 'Accompli', type: 'positive' },
  // Neutres
  { emoji: '😐', label: 'Neutre', type: 'neutral' },
  { emoji: '🤔', label: 'Pensif', type: 'neutral' },
  { emoji: '😴', label: 'Fatigué', type: 'neutral' },
  { emoji: '😕', label: 'Incertain', type: 'neutral' },
  { emoji: '🥱', label: 'Ennuyé', type: 'neutral' },
  { emoji: '😶', label: 'Indifférent', type: 'neutral' },
  { emoji: '🤷', label: 'Perplexe', type: 'neutral' },
  // Négatives
  { emoji: '😰', label: 'Anxieux', type: 'negative' },
  { emoji: '😢', label: 'Triste', type: 'negative' },
  { emoji: '😠', label: 'En colère', type: 'negative' },
  { emoji: '😔', label: 'Découragé', type: 'negative' },
  { emoji: '😩', label: 'Submergé', type: 'negative' },
  { emoji: '😞', label: 'Déçu', type: 'negative' },
  { emoji: '😣', label: 'Frustré', type: 'negative' },
  { emoji: '🙁', label: 'Pessimiste', type: 'negative' },
  { emoji: '😖', label: 'Stressé', type: 'negative' },
  { emoji: '🦥', label: 'Paresseux', type: 'negative' },
  { emoji: '😑', label: 'Laxiste', type: 'negative' },
  { emoji: '🤦', label: 'Dépassé', type: 'negative' },
  { emoji: '😤', label: 'Impatient', type: 'negative' },
  { emoji: '😓', label: 'Épuisé', type: 'negative' },
  { emoji: '😬', label: 'Nerveux', type: 'negative' },
  { emoji: '🥺', label: 'Vulnérable', type: 'negative' },
  { emoji: '😪', label: 'Démotivé', type: 'negative' },
];

export const MOOD_LEVELS = [
  { range: [1, 2], emoji: '😢', label: 'Très mal', color: '#D32F2F' },
  { range: [3, 4], emoji: '😕', label: 'Pas bien', color: '#F57C00' },
  { range: [5, 6], emoji: '😐', label: 'Moyen', color: '#FDD835' },
  { range: [7, 8], emoji: '🙂', label: 'Bien', color: '#9CCC65' },
  { range: [9, 10], emoji: '😊', label: 'Très bien', color: '#66BB6A' },
];

// HABITS
export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  quantifiable: boolean;
  unit?: string;
  color: string;
  created_at: string;
}

export type HabitCategory = 'sante_sport' | 'bienetre_mental' | 'productivite' | 'alimentation' | 'loisirs';
export type HabitFrequency = 'daily' | '2x_week' | '3x_week' | 'weekly';

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
  quantity?: number;
}

export const HABIT_CATEGORIES: { type: HabitCategory; label: string; emoji: string; color: string }[] = [
  { type: 'sante_sport', label: 'Santé & Sport', emoji: '💪', color: '#66BB6A' },
  { type: 'bienetre_mental', label: 'Bien-être Mental', emoji: '🧘', color: '#9CCC65' },
  { type: 'productivite', label: 'Productivité', emoji: '⚡', color: '#42A5F5' },
  { type: 'alimentation', label: 'Alimentation', emoji: '🥗', color: '#FFA726' },
  { type: 'loisirs', label: 'Loisirs', emoji: '🎨', color: '#AB47BC' },
];

export const HABIT_FREQUENCIES: { value: HabitFrequency; label: string }[] = [
  { value: 'daily', label: 'Quotidien' },
  { value: '2x_week', label: '2x par semaine' },
  { value: '3x_week', label: '3x par semaine' },
  { value: 'weekly', label: 'Hebdomadaire' },
];

// TASKS
export interface Task {
  id: string;
  user_id: string;
  title: string;
  quadrant: 1 | 2 | 3 | 4;
  deadline?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  recurring: boolean;
  recurrence_pattern?: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export const TASK_QUADRANTS = [
  { id: 1, label: 'Urgent & Important', description: 'À faire immédiatement', color: '#EF4444', emoji: '🔥' },
  { id: 2, label: 'Important', description: 'À planifier', color: '#3B82F6', emoji: '🎯' },
  { id: 3, label: 'Urgent', description: 'À déléguer', color: '#F59E0B', emoji: '⚡' },
  { id: 4, label: 'Ni urgent ni important', description: 'À éliminer', color: '#9CA3AF', emoji: '📦' },
] as const;

// SLEEP
export interface SleepLog {
  id: string;
  user_id: string;
  date: string;
  total_hours: number;
  rem_hours: number;
  deep_hours: number;
  avg_heart_rate: number;
  bedtime: string;
  wakeup_time: string;
  quality_score: number;
  created_at: string;
  notes?: string;
  slept_alone?: boolean;
}

// MOOD LOG
export interface MoodLog {
  id: string;
  user_id: string;
  datetime: string;
  score_global: number;
  emotions: string[];
  energy_level?: number;
  stress_level?: number;
  domains?: DomainImpact[];
  weather?: WeatherData | null;
  note?: string;
  created_at: string;
}

export interface DomainImpact {
  domain: string;
  impact: number;
}

// ACTIVITY TRACKING
export type ActivityCategory = 'sport' | 'social' | 'travail' | 'loisirs' | 'sante' | 'custom' | 'contexte';

export interface ActivityType {
  id: string;
  user_id?: string;
  name: string;
  emoji: string;
  category: ActivityCategory;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface MoodActivity {
  id: string;
  mood_id: string;
  activity_type_id: string;
  done: boolean;
  created_at: string;
}

export const DEFAULT_ACTIVITIES: Omit<ActivityType, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'Sport', emoji: '💪', category: 'sport', is_default: true, is_active: true },
  { name: 'Marche', emoji: '🚶', category: 'sport', is_default: true, is_active: true },
  { name: 'Yoga', emoji: '🧘', category: 'sport', is_default: true, is_active: true },
  { name: 'Famille', emoji: '👨‍👩‍👧', category: 'social', is_default: true, is_active: true },
  { name: 'Amis', emoji: '👥', category: 'social', is_default: true, is_active: true },
  { name: 'Couple', emoji: '❤️', category: 'social', is_default: true, is_active: true },
  { name: 'Sortie', emoji: '🎉', category: 'social', is_default: true, is_active: true },
  { name: 'Travail', emoji: '💼', category: 'travail', is_default: true, is_active: true },
  { name: 'Deep Work', emoji: '🧠', category: 'travail', is_default: true, is_active: true },
  { name: 'Réunions', emoji: '🤝', category: 'travail', is_default: true, is_active: true },
  { name: 'Méditation', emoji: '🧘', category: 'sante', is_default: true, is_active: true },
  { name: 'Bien dormi', emoji: '😴', category: 'sante', is_default: true, is_active: true },
  { name: 'Hydraté', emoji: '💧', category: 'sante', is_default: true, is_active: true },
  { name: 'Sain', emoji: '🥗', category: 'sante', is_default: true, is_active: true },
  { name: 'Vitamines', emoji: '💊', category: 'sante', is_default: true, is_active: true },
  { name: 'Lecture', emoji: '📚', category: 'loisirs', is_default: true, is_active: true },
  { name: 'Nature', emoji: '🌳', category: 'loisirs', is_default: true, is_active: true },
  { name: 'Musique', emoji: '🎵', category: 'loisirs', is_default: true, is_active: true },
  { name: 'Gaming', emoji: '🎮', category: 'loisirs', is_default: true, is_active: true },
  { name: 'Créatif', emoji: '🎨', category: 'loisirs', is_default: true, is_active: true },
  { name: 'Séries', emoji: '📺', category: 'loisirs', is_default: true, is_active: true },
  { name: 'Alcool', emoji: '🍺', category: 'sante', is_default: true, is_active: true },
  { name: 'Caféine++', emoji: '☕', category: 'sante', is_default: true, is_active: true },
  { name: 'Malbouffe', emoji: '🍔', category: 'sante', is_default: true, is_active: true },
  { name: 'Écrans tard', emoji: '📱', category: 'sante', is_default: true, is_active: true },
  // Contexte de vie
  { name: 'Vacances',            emoji: '🏖️', category: 'contexte', is_default: true, is_active: true },
  { name: 'Voyage',              emoji: '✈️', category: 'contexte', is_default: true, is_active: true },
  { name: 'Weekend',             emoji: '🎉', category: 'contexte', is_default: true, is_active: true },
  { name: 'Ski',                 emoji: '⛷️', category: 'contexte', is_default: true, is_active: true },
  { name: 'Van life',            emoji: '🚐', category: 'contexte', is_default: true, is_active: true },
  { name: 'Télétravail',         emoji: '🏠', category: 'contexte', is_default: true, is_active: true },
  { name: 'Période stressante',  emoji: '😤', category: 'contexte', is_default: true, is_active: true },
  { name: 'Temps libre',         emoji: '😌', category: 'contexte', is_default: true, is_active: true },
  { name: 'Sport intensif',      emoji: '🏔️', category: 'contexte', is_default: true, is_active: true },
];

export const ACTIVITY_CATEGORIES: { type: ActivityCategory; label: string; emoji: string; color: string }[] = [
  { type: 'contexte', label: 'Contexte de vie', emoji: '🌍', color: '#FF7043' },
  { type: 'sport', label: 'Sport', emoji: '💪', color: '#66BB6A' },
  { type: 'social', label: 'Social', emoji: '👥', color: '#42A5F5' },
  { type: 'travail', label: 'Travail', emoji: '💼', color: '#5C6BC0' },
  { type: 'loisirs', label: 'Loisirs', emoji: '🎨', color: '#AB47BC' },
  { type: 'sante', label: 'Santé', emoji: '🧘', color: '#9CCC65' },
  { type: 'custom', label: 'Perso', emoji: '📌', color: '#78909C' },
];

// FOCUS SESSIONS
export type SessionType = 'pomodoro' | 'short_break' | 'long_break' | 'stopwatch';
export type StatsPeriod = 'today' | '7days' | '30days' | '90days';

export interface FocusSession {
  id: string;
  user_id: string;
  task_id?: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  actual_duration_minutes?: number; // NOUVEAU - durée réelle vs prévue
  session_type: SessionType;
  completed: boolean;
  notes?: string;
  category?: string; // OBSOLETE - maintenant on utilise tags[]
  tags?: string[]; // NOUVEAU - tableau de noms de tags
  quality_rating?: number; // NOUVEAU - évaluation 1-5
  is_manual_entry?: boolean; // NOUVEAU - entrée manuelle vs timer
  objective?: string; // NOUVEAU - objectif de la session
  pre_energy_level?: number; // NOUVEAU - niveau d'énergie avant (1-5)
  post_focus_quality?: number; // NOUVEAU - qualité du focus après (1-5)
  distractions_count?: number; // NOUVEAU - nombre de distractions
  session_mood?: string; // NOUVEAU - mood emoji de la session
  created_at: string;
}

export interface SessionTag {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  is_default: boolean;
  is_favorite?: boolean; // NOUVEAU - tag favori
  sort_order?: number; // NOUVEAU - ordre de tri personnalisé
  created_at: string;
  updated_at: string;
}

export interface CreateTagInput {
  name: string;
  emoji: string;
  color: string;
}

export interface FocusStats {
  totalMinutes: number;
  totalSessions: number;
  avgPerDay: number;
  byCategory: CategoryStats[];
  dailyActivity: DailyActivity[];
}

export interface CategoryStats {
  category: string;
  minutes: number;
  sessions: number;
  percentage: number;
  emoji?: string;
  color?: string;
}

export interface DailyActivity {
  date: string;
  minutes: number;
  sessions: number;
}

// FOCUS QUALITY METRICS
export type DistractionType = 'phone' | 'notification' | 'person' | 'thought' | 'other';

export interface DistractionLog {
  id: string;
  session_id: string;
  user_id: string;
  distraction_type: DistractionType;
  timestamp: string;
  notes?: string;
  created_at: string;
}

export const ENERGY_LEVELS = [
  { value: 1, label: 'Très faible', emoji: '😴', color: '#EF4444' },
  { value: 2, label: 'Faible', emoji: '😔', color: '#F97316' },
  { value: 3, label: 'Moyen', emoji: '😐', color: '#EAB308' },
  { value: 4, label: 'Bon', emoji: '🙂', color: '#84CC16' },
  { value: 5, label: 'Excellent', emoji: '🔥', color: '#22C55E' },
] as const;

export const DISTRACTION_TYPES = [
  { type: 'phone' as const, label: 'Téléphone', emoji: '📱' },
  { type: 'notification' as const, label: 'Notification', emoji: '🔔' },
  { type: 'person' as const, label: 'Personne', emoji: '👤' },
  { type: 'thought' as const, label: 'Pensée vagabonde', emoji: '💭' },
  { type: 'other' as const, label: 'Autre', emoji: '❓' },
] as const;

export const SESSION_MOODS = [
  { emoji: '🎯', label: 'Concentré' },
  { emoji: '😤', label: 'Frustré' },
  { emoji: '😌', label: 'Calme' },
  { emoji: '🚀', label: 'Productif' },
  { emoji: '😵', label: 'Fatigué' },
  { emoji: '💪', label: 'Motivé' },
] as const;

export interface FocusQualityStats {
  avgEnergyLevel: number;
  avgFocusQuality: number;
  avgDistractions: number;
  totalSessions: number;
  bestHours: { hour: number; avgEnergy: number }[];
  energyFocusPairs: { energy: number; focus: number }[];
}

// WATER TRACKING
export interface WaterLog {
  id: string;
  user_id: string;
  date: string;
  amount_ml: number;
  logged_at: string;
  created_at: string;
}

export interface WaterGoal {
  id: string;
  user_id: string;
  daily_goal_ml: number;
  updated_at: string;
}

// CALENDAR EVENT
export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  all_day: boolean;
  color?: string;
  task_id?: string;
  created_at: string;
}

// ============================================
// ACTIVITY-DOMAIN CORRELATION ANALYSIS
// ============================================

// Mapping activité → domaine(s) pour l'analyse croisée
export const ACTIVITY_DOMAIN_MAPPING: Record<string, DomainType[]> = {
  // Sport & activités physiques
  'Sport': ['sport'],
  'Marche': ['sport', 'bienetre'],
  'Yoga': ['sport', 'bienetre'],

  // Social
  'Famille': ['famille'],
  'Amis': ['amis'],
  'Couple': ['amour'],
  'Sortie': ['amis', 'loisirs'],

  // Travail
  'Travail': ['travail'],
  'Deep Work': ['travail'],
  'Réunions': ['travail'],

  // Santé & bien-être
  'Méditation': ['bienetre'],
  'Bien dormi': ['bienetre'],
  'Hydraté': ['bienetre'],
  'Sain': ['bienetre'],
  'Vitamines': ['bienetre'],

  // Loisirs
  'Lecture': ['loisirs'],
  'Nature': ['loisirs', 'bienetre'],
  'Musique': ['loisirs'],
  'Gaming': ['loisirs'],
  'Créatif': ['loisirs'],
  'Séries': ['loisirs'],

  // Habitudes négatives (peuvent impacter plusieurs domaines)
  'Alcool': ['bienetre'],
  'Caféine++': ['bienetre'],
  'Malbouffe': ['bienetre'],
  'Écrans tard': ['bienetre'],
};

// Fallback par catégorie pour les activités custom
export const CATEGORY_DOMAIN_FALLBACK: Record<ActivityCategory, DomainType[]> = {
  'sport': ['sport'],
  'social': ['amis', 'famille'],
  'travail': ['travail'],
  'loisirs': ['loisirs'],
  'sante': ['bienetre'],
  'custom': [],
  'contexte': [],
};

// Types de scénarios pour l'analyse croisée
export type ActivityDomainScenario = 'A' | 'B' | 'C' | 'D';
// A = Activité faite + impact positif ("faire X me rend heureux")
// B = Activité pas faite + impact négatif ("ne pas faire X me rend malheureux")
// C = Activité faite + impact négatif ("X s'est mal passé")
// D = Activité pas faite + impact positif ("bien fait de ne pas faire X")

export interface ScenarioStats {
  count: number;
  avgMood: number;
  avgImpact: number;
  percentage: number;
}

export interface CombinedCorrelation {
  activityId: string;
  activityName: string;
  activityEmoji: string;
  domainType: DomainType;
  domainLabel: string;
  domainEmoji: string;

  scenarios: {
    A: ScenarioStats;
    B: ScenarioStats;
    C: ScenarioStats;
    D: ScenarioStats;
  };

  overallStats: {
    avgMoodWhenDone: number;
    avgMoodWhenNotDone: number;
    avgImpactWhenDone: number;
    avgImpactWhenNotDone: number;
    totalDataPoints: number;
  };

  primaryInsight: string;
  secondaryInsight?: string;
  confidence: 'high' | 'medium' | 'low';
  insightType: 'positive' | 'warning' | 'informational';
}

export interface ActivityDomainInsight {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'mixed' | 'discovery';
  priority: 'high' | 'medium' | 'low';
  dataPointCount: number;
  relatedActivity?: {
    name: string;
    emoji: string;
  };
  relatedDomain?: {
    type: DomainType;
    label: string;
    emoji: string;
  };
}