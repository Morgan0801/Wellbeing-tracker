// ============================================
// PHASE 5 - TYPES ADDITIONNELS
// ============================================

// INSIGHTS & ANALYTICS
export interface InsightData {
  moodTrend: MoodTrendPoint[];
  sleepTrend: SleepTrendPoint[];
  habitSuccess: HabitSuccessData[];
  correlations: Correlation[];
  recommendations: Recommendation[];
}

export interface MoodTrendPoint {
  date: string;
  score: number;
  emoji: string;
}

export interface SleepTrendPoint {
  date: string;
  totalHours: number;
  quality: number;
}

export interface HabitSuccessData {
  habitId: string;
  habitName: string;
  successRate: number;
  streak: number;
  totalLogs: number;
}

export interface Correlation {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  strength: number; // 0-100
  description: string;
  insight: string;
}

export interface Recommendation {
  id: string;
  category: 'mood' | 'sleep' | 'habits' | 'productivity';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

// EXPORT PDF
export interface ExportOptions {
  type: 'monthly' | 'annual' | 'custom' | 'goal';
  startDate?: string;
  endDate?: string;
  goalId?: string;
  sections: ExportSection[];
  includeCharts: boolean;
  includeInsights: boolean;
}

export type ExportSection = 
  | 'mood'
  | 'sleep'
  | 'habits'
  | 'tasks'
  | 'goals'
  | 'gratitude'
  | 'moodboard'
  | 'gamification';

export interface PDFReport {
  title: string;
  period: string;
  generatedAt: string;
  sections: ReportSection[];
}

export interface ReportSection {
  type: ExportSection;
  title: string;
  data: any;
  charts?: string[]; // Base64 images
}

// NOTIFICATIONS & REMINDERS
export interface NotificationSettings {
  id: string;
  user_id: string;
  habits_enabled: boolean;
  habits_time?: string;
  sleep_enabled: boolean;
  sleep_time?: string;
  mood_enabled: boolean;
  mood_time?: string;
  gratitude_enabled: boolean;
  gratitude_time?: string;
  tasks_enabled: boolean;
  sound_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  type: 'habit' | 'sleep' | 'mood' | 'gratitude' | 'task';
  title: string;
  time: string;
  days: number[]; // 0-6 (dimanche-samedi)
  enabled: boolean;
}

// DASHBOARD CUSTOMIZATION
export interface DashboardLayout {
  id: string;
  user_id: string;
  layout: WidgetLayout[];
  created_at: string;
  updated_at: string;
}

export interface WidgetLayout {
  i: string; // Widget ID
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
}

export type WidgetType =
  | 'mood-mini-chart'
  | 'streak-counter'
  | 'goal-progress'
  | 'quote'
  | 'mood-clouds'
  | 'upcoming-tasks'
  | 'daily-habits'
  | 'quick-stats'
  | 'mini-calendar'
  | 'gratitude-latest';

// THEMES & PERSONALIZATION
export interface ThemeSettings {
  id: string;
  user_id: string;
  theme_name: string;
  is_custom: boolean;
  colors: ThemeColors;
  spacing: 'compact' | 'normal' | 'spacious';
  radius: number;
  font: 'inter' | 'poppins' | 'roboto';
  effects: ThemeEffects;
  background_image?: string;
  created_at: string;
  updated_at: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
}

export interface ThemeEffects {
  glassmorphism: boolean;
  neumorphism: boolean;
  shadows: 'none' | 'sm' | 'md' | 'lg';
  animations: boolean;
}

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    emoji: '🌊',
    colors: {
      primary: '#0EA5E9',
      secondary: '#0284C7',
      accent: '#06B6D4',
      background: '#F0F9FF',
      foreground: '#0C4A6E',
      muted: '#BAE6FD',
      border: '#7DD3FC',
    },
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    emoji: '🌲',
    colors: {
      primary: '#22C55E',
      secondary: '#16A34A',
      accent: '#84CC16',
      background: '#F0FDF4',
      foreground: '#14532D',
      muted: '#BBF7D0',
      border: '#86EFAC',
    },
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    emoji: '🌅',
    colors: {
      primary: '#F97316',
      secondary: '#EA580C',
      accent: '#FB923C',
      background: '#FFF7ED',
      foreground: '#7C2D12',
      muted: '#FED7AA',
      border: '#FDBA74',
    },
  },
  {
    id: 'purple-dream',
    name: 'Purple Dream',
    emoji: '💜',
    colors: {
      primary: '#A855F7',
      secondary: '#9333EA',
      accent: '#C084FC',
      background: '#FAF5FF',
      foreground: '#581C87',
      muted: '#E9D5FF',
      border: '#D8B4FE',
    },
  },
  {
    id: 'minimal-gray',
    name: 'Minimal Gray',
    emoji: '⚪',
    colors: {
      primary: '#64748B',
      secondary: '#475569',
      accent: '#94A3B8',
      background: '#F8FAFC',
      foreground: '#1E293B',
      muted: '#E2E8F0',
      border: '#CBD5E1',
    },
  },
  {
    id: 'dark-night',
    name: 'Dark Night',
    emoji: '🌙',
    colors: {
      primary: '#3B82F6',
      secondary: '#2563EB',
      accent: '#60A5FA',
      background: '#0F172A',
      foreground: '#F1F5F9',
      muted: '#1E293B',
      border: '#334155',
    },
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    emoji: '🌸',
    colors: {
      primary: '#EC4899',
      secondary: '#DB2777',
      accent: '#F472B6',
      background: '#FDF2F8',
      foreground: '#831843',
      muted: '#FBCFE8',
      border: '#F9A8D4',
    },
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    emoji: '🎮',
    colors: {
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      accent: '#A78BFA',
      background: '#18181B',
      foreground: '#FAFAFA',
      muted: '#27272A',
      border: '#3F3F46',
    },
  },
];

export interface PresetTheme {
  id: string;
  name: string;
  emoji: string;
  colors: ThemeColors;
}

// GAMIFICATION AVANCÉE
export interface Quest {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  title: string;
  description: string;
  xp_reward: number;
  progress: number;
  target: number;
  completed: boolean;
  expires_at?: string;
}

export interface ExtendedBadge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'achievement' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned_at?: string;
  progress?: number;
  target?: number;
}

export const PHASE5_BADGES: ExtendedBadge[] = [
  {
    id: 'perfectionist',
    name: 'Perfectionniste',
    description: '7 jours avec toutes les habitudes complétées',
    emoji: '💯',
    category: 'achievement',
    rarity: 'epic',
    target: 7,
  },
  {
    id: 'analyst',
    name: 'Analyste',
    description: 'Consulter les insights 10 fois',
    emoji: '📊',
    category: 'achievement',
    rarity: 'common',
    target: 10,
  },
  {
    id: 'archivist',
    name: 'Archiviste',
    description: 'Générer 5 rapports PDF',
    emoji: '📄',
    category: 'achievement',
    rarity: 'rare',
    target: 5,
  },
  {
    id: 'meditator',
    name: 'Méditant',
    description: '30 jours consécutifs de gratitude',
    emoji: '🧘',
    category: 'achievement',
    rarity: 'epic',
    target: 30,
  },
  {
    id: 'visionary',
    name: 'Visionnaire',
    description: 'Compléter un objectif de 6+ mois',
    emoji: '🔮',
    category: 'milestone',
    rarity: 'legendary',
  },
  {
    id: 'marathoner',
    name: 'Marathonien',
    description: '100 jours de streak',
    emoji: '🏃',
    category: 'milestone',
    rarity: 'legendary',
    target: 100,
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Atteindre le niveau 20',
    emoji: '🧙',
    category: 'milestone',
    rarity: 'legendary',
    target: 20,
  },
  {
    id: 'collector',
    name: 'Collectionneur',
    description: 'Débloquer 25 badges',
    emoji: '🏆',
    category: 'achievement',
    rarity: 'epic',
    target: 25,
  },
  {
    id: 'explorer',
    name: 'Explorateur',
    description: 'Visiter toutes les sections',
    emoji: '🧭',
    category: 'achievement',
    rarity: 'common',
  },
  {
    id: 'wellbeing-master',
    name: 'Maître du Bien-être',
    description: '1000 XP total',
    emoji: '⭐',
    category: 'milestone',
    rarity: 'legendary',
    target: 1000,
  },
];

// SEARCH
export interface SearchResult {
  id: string;
  type: 'mood' | 'task' | 'habit' | 'goal' | 'gratitude' | 'moodboard' | 'sleep';
  title: string;
  description?: string;
  date: string;
  category?: string;
  relevance: number;
}

export interface SearchFilters {
  types: SearchResult['type'][];
  dateFrom?: string;
  dateTo?: string;
  categories?: string[];
}

// OFFLINE SYNC
export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: string;
  synced: boolean;
}

// USER PREFERENCES
export interface UserPreferences {
  id: string;
  user_id: string;
  dashboard_layout?: DashboardLayout;
  theme_settings?: ThemeSettings;
  notification_settings?: NotificationSettings;
  created_at: string;
  updated_at: string;
}

export interface UserGamification {
  id: string;
  user_id: string;
  level: number;
  total_xp: number; // ✅
  current_streak: number;
  longest_streak: number;
  streak_days: number; // ✅ Ajoute si manquant
  last_activity_date: string; // ✅ Ajoute si manquant
  total_tasks: number;
  total_habits: number;
  created_at: string;
  updated_at: string;
  
  badges: BadgeUnlock[];
}

export type BadgeUnlock = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earned_at: string;
};

