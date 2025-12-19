// Types pour les fonctionnalités IA

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'summary' | 'affirmation' | 'recommendation';
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CorrelationInsight {
  title: string;
  description: string;
  strength: 'forte' | 'moyenne' | 'faible';
  factors: string[];
  recommendation?: string;
}

export interface WeeklySummary {
  period: {
    start: string;
    end: string;
  };
  overview: string;
  highlights: string[];
  improvements: string[];
  insight: string;
  challenge: string;
  generatedAt: Date;
}

export interface MonthlySummary extends WeeklySummary {
  statistics: Record<string, number | string>;
  patterns: string[];
  strengths: string[];
}

export interface NoteAnalysis {
  themes: { theme: string; count: number }[];
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    trend: 'improving' | 'stable' | 'declining';
  };
  keywords: string[];
  insights: string[];
}

export interface HabitRecommendation {
  type: 'add' | 'remove' | 'modify';
  habit: string;
  reason: string;
  suggestedFrequency?: string;
  difficulty?: 'facile' | 'moyen' | 'difficile';
}

export interface FocusSessionAnalysis {
  evaluation: string;
  positives: string[];
  improvements: string[];
  tip: string;
  comparison?: string;
}

export interface VoiceInputResult {
  type: 'mood' | 'habit' | 'gratitude' | 'focus' | 'question' | 'unknown';
  extractedData: Record<string, unknown>;
  response: string;
}

export interface SearchResult {
  date: string;
  content: string;
  relevance: string;
  context?: string;
  type: 'mood' | 'gratitude' | 'note';
}

export interface NarrativeExport {
  title: string;
  period: string;
  content: string;
  generatedAt: Date;
}

export interface AIState {
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export type AIFeature =
  | 'correlations'
  | 'weekly-summary'
  | 'monthly-summary'
  | 'note-analysis'
  | 'semantic-search'
  | 'affirmation'
  | 'habit-recommendations'
  | 'focus-analysis'
  | 'qa'
  | 'narrative-export'
  | 'voice-input';
