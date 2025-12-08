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
export type ActivityCategory = 'sport' | 'social' | 'travail' | 'loisirs' | 'sante' | 'custom';

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
];

export const ACTIVITY_CATEGORIES: { type: ActivityCategory; label: string; emoji: string; color: string }[] = [
  { type: 'sport', label: 'Sport', emoji: '💪', color: '#66BB6A' },
  { type: 'social', label: 'Social', emoji: '👥', color: '#42A5F5' },
  { type: 'travail', label: 'Travail', emoji: '💼', color: '#5C6BC0' },
  { type: 'loisirs', label: 'Loisirs', emoji: '🎨', color: '#AB47BC' },
  { type: 'sante', label: 'Santé', emoji: '🧘', color: '#9CCC65' },
  { type: 'custom', label: 'Perso', emoji: '📌', color: '#78909C' },
];

// FOCUS SESSIONS
export type SessionType = 'pomodoro' | 'short_break' | 'long_break';

export interface FocusSession {
  id: string;
  user_id: string;
  task_id?: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  session_type: SessionType;
  completed: boolean;
  notes?: string;
  created_at: string;
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