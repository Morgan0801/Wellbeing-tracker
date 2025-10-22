// ============================================
// PHASE 4 - TYPES
// ============================================

// GOALS
export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  target_date?: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export type GoalCategory = 
  | 'perso'
  | 'pro'
  | 'sante'
  | 'finances'
  | 'loisirs';

export const GOAL_CATEGORIES: { type: GoalCategory; label: string; emoji: string; color: string }[] = [
  { type: 'perso', label: 'Personnel', emoji: '🌟', color: '#EC407A' },
  { type: 'pro', label: 'Professionnel', emoji: '💼', color: '#5C6BC0' },
  { type: 'sante', label: 'Santé & Sport', emoji: '💪', color: '#66BB6A' },
  { type: 'finances', label: 'Finances', emoji: '💰', color: '#FFA726' },
  { type: 'loisirs', label: 'Loisirs & Créativité', emoji: '🎨', color: '#AB47BC' },
];

export interface GoalMilestone {
  id: string;
  goal_id: string;
  title: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

// GRATITUDE
export interface GratitudeEntry {
  id: string;
  user_id: string;
  date: string;
  entry_1: string;
  entry_2?: string;
  entry_3?: string;
  mood_emoji?: string;
  created_at: string;
}

export const GRATITUDE_EMOJIS = [
  '🙏', '💖', '✨', '🌟', '💫', '🌈', '☀️', '🌺', '🦋', '🎉',
];

// MOODBOARD
export interface MoodboardItem {
  id: string;
  user_id: string;
  type: MoodboardItemType;
  content: string;
  author?: string;
  category: MoodboardCategory;
  created_at: string;
}

export type MoodboardItemType = 'image' | 'quote' | 'affirmation';

export type MoodboardCategory = 'motivation' | 'calme' | 'joie' | 'inspiration';

export const MOODBOARD_CATEGORIES: { type: MoodboardCategory; label: string; emoji: string; color: string }[] = [
  { type: 'motivation', label: 'Motivation', emoji: '💪', color: '#FF6B6B' },
  { type: 'calme', label: 'Calme & Sérénité', emoji: '🧘', color: '#4ECDC4' },
  { type: 'joie', label: 'Joie & Positivité', emoji: '😊', color: '#FFE66D' },
  { type: 'inspiration', label: 'Inspiration', emoji: '✨', color: '#A8E6CF' },
];

// GAMIFICATION
export interface UserGamification {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  badges: Badge[];
  last_activity_date?: string;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earned_at: string;
}

export interface XPHistory {
  id: string;
  user_id: string;
  action_type: XPActionType;
  xp_gained: number;
  description?: string;
  created_at: string;
}

export type XPActionType = 
  | 'mood_log'
  | 'habit_complete'
  | 'task_complete'
  | 'goal_complete'
  | 'gratitude_log'
  | 'streak_bonus'
  | 'milestone_complete';

export const XP_VALUES: Record<XPActionType, number> = {
  mood_log: 10,
  habit_complete: 15,
  task_complete: 20,
  goal_complete: 100,
  gratitude_log: 10,
  streak_bonus: 50,
  milestone_complete: 30,
};

// Calcul du niveau à partir du XP
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// XP requis pour atteindre le niveau suivant
export function xpForNextLevel(currentLevel: number): number {
  return (currentLevel ** 2) * 100;
}

// Progression vers le niveau suivant (0-100%)
export function levelProgress(xp: number, level: number): number {
  const currentLevelXP = ((level - 1) ** 2) * 100;
  const nextLevelXP = (level ** 2) * 100;
  const xpInLevel = xp - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  return Math.round((xpInLevel / xpNeededForLevel) * 100);
}

// Liste des badges disponibles
export const AVAILABLE_BADGES = [
  { id: 'first_mood', name: 'Premier Mood', description: 'Enregistrer son premier mood', emoji: '🎭', requirement: 1 },
  { id: 'mood_week', name: 'Mood Hebdo', description: 'Enregistrer son mood 7 jours consécutifs', emoji: '📅', requirement: 7 },
  { id: 'habit_master', name: 'Maître des Habitudes', description: 'Compléter 30 habitudes', emoji: '💪', requirement: 30 },
  { id: 'task_slayer', name: 'Chasseur de Tâches', description: 'Compléter 50 tâches', emoji: '✅', requirement: 50 },
  { id: 'goal_achiever', name: 'Réalisateur d\'Objectifs', description: 'Compléter 5 objectifs', emoji: '🎯', requirement: 5 },
  { id: 'gratitude_guru', name: 'Guru de la Gratitude', description: 'Écrire 14 jours de gratitude', emoji: '🙏', requirement: 14 },
  { id: 'level_5', name: 'Niveau 5', description: 'Atteindre le niveau 5', emoji: '⭐', requirement: 5 },
  { id: 'level_10', name: 'Niveau 10', description: 'Atteindre le niveau 10', emoji: '🌟', requirement: 10 },
  { id: 'streak_7', name: 'Série de 7', description: '7 jours d\'activité consécutifs', emoji: '🔥', requirement: 7 },
  { id: 'streak_30', name: 'Série de 30', description: '30 jours d\'activité consécutifs', emoji: '🏆', requirement: 30 },
];
