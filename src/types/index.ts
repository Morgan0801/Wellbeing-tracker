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
  score_global: number; // 1-10
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
  impact: number; // -5 to +5
}

export type DomainType = 
  | 'travail'
  | 'sport'
  | 'amour'
  | 'amis'
  | 'famille'
  | 'finances'
  | 'loisirs'
  | 'bienetre';

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
  
  // Neutres
  { emoji: '😐', label: 'Neutre', type: 'neutral' },
  { emoji: '🤔', label: 'Pensif', type: 'neutral' },
  { emoji: '😴', label: 'Fatigué', type: 'neutral' },
  { emoji: '😕', label: 'Incertain', type: 'neutral' },
  { emoji: '🥱', label: 'Ennuyé', type: 'neutral' },
  
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
];

export const MOOD_LEVELS = [
  { range: [1, 2], emoji: '😢', label: 'Très mal', color: '#D32F2F' },
  { range: [3, 4], emoji: '😕', label: 'Pas bien', color: '#F57C00' },
  { range: [5, 6], emoji: '😐', label: 'Moyen', color: '#FDD835' },
  { range: [7, 8], emoji: '🙂', label: 'Bien', color: '#9CCC65' },
  { range: [9, 10], emoji: '😊', label: 'Très bien', color: '#66BB6A' },
];

// ============================================
// PHASE 3 - NOUVEAUX TYPES
// ============================================

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

export type HabitCategory = 
  | 'sante_sport'
  | 'bienetre_mental'
  | 'productivite'
  | 'alimentation'
  | 'loisirs';

export type HabitFrequency = 
  | 'daily'
  | '2x_week'
  | '3x_week'
  | 'weekly';

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
  recurring: boolean;
  recurrence_pattern?: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export const TASK_QUADRANTS = [
  { 
    id: 1, 
    label: 'Urgent & Important', 
    description: 'À faire immédiatement',
    color: '#EF4444',
    emoji: '🔥'
  },
  { 
    id: 2, 
    label: 'Important', 
    description: 'À planifier',
    color: '#3B82F6',
    emoji: '🎯'
  },
  { 
    id: 3, 
    label: 'Urgent', 
    description: 'À déléguer',
    color: '#F59E0B',
    emoji: '⚡'
  },
  { 
    id: 4, 
    label: 'Ni urgent ni important', 
    description: 'À éliminer',
    color: '#9CA3AF',
    emoji: '📦'
  },
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
  quality_score: number; // 1-10
  created_at: string;
  notes?: string;

}

// ✅ Ajoute ces exports
export interface MoodLog {
  id: string;
  user_id: string;
  datetime: string;
  score_global: number;
  emotions: string[];
  energy_level: number;
  stress_level: number;
  domains: DomainImpact[];
  weather?: WeatherData | null;
  note?: string;
  created_at: string;
}

export interface DomainImpact {
  domain: string;
  impact: number;
}