import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { subDays, format } from 'date-fns';
import { geminiService } from '@/services/gemini';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { AIMessage, VoiceInputResult } from '@/types/ai';
import { aiCache, CACHE_TTL } from '@/services/aiCache';

// Hook principal pour toutes les fonctionnalités IA
export function useAI() {
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<AIMessage[]>([]);

  // Récupérer les données pour l'IA (30 derniers jours par défaut)
  const fetchUserData = useCallback(async (days: number = 30) => {
    if (!user?.id) return null;

    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

    const [
      moodsRes,
      sleepRes,
      habitsRes,
      habitLogsRes,
      focusRes,
      tasksRes,
      gratitudesRes,
      goalsRes,
      moodActivitiesRes,
      moodDomainsRes,
      activityTypesRes,
      gamificationRes,
      xpHistoryRes
    ] = await Promise.all([
      supabase.from('moods').select('*').eq('user_id', user.id).gte('datetime', startDate).order('datetime', { ascending: false }),
      supabase.from('sleep_logs').select('*').eq('user_id', user.id).gte('date', startDate).order('date', { ascending: false }),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('habit_logs').select('*, habits(name, category)').gte('date', startDate),
      supabase.from('focus_sessions').select('*').eq('user_id', user.id).gte('start_time', startDate).order('start_time', { ascending: false }),
      supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('gratitude_entries').select('*').eq('user_id', user.id).gte('date', startDate).order('date', { ascending: false }),
      supabase.from('goals').select('*, goal_milestones(*)').eq('user_id', user.id),
      // NOUVELLES DONNÉES: Activités liées aux moods
      supabase.from('mood_activities').select('*'),
      // NOUVELLES DONNÉES: Domaines d'impact des moods
      supabase.from('mood_domains').select('*'),
      // NOUVELLES DONNÉES: Types d'activités disponibles
      supabase.from('activity_types').select('*').or(`user_id.eq.${user.id},is_default.eq.true`).eq('is_active', true),
      // NOUVELLES DONNÉES: Gamification (XP, level, badges, streak)
      supabase.from('user_gamification').select('*').eq('user_id', user.id).single(),
      // NOUVELLES DONNÉES: Historique XP
      supabase.from('xp_history').select('*').eq('user_id', user.id).gte('created_at', startDate).order('created_at', { ascending: false }),
    ]);

    return {
      moods: moodsRes.data || [],
      sleep: sleepRes.data || [],
      habits: habitsRes.data || [],
      habitLogs: habitLogsRes.data || [],
      focus: focusRes.data || [],
      tasks: tasksRes.data || [],
      gratitudes: gratitudesRes.data || [],
      goals: goalsRes.data || [],
      // NOUVELLES DONNÉES
      moodActivities: moodActivitiesRes.data || [],
      moodDomains: moodDomainsRes.data || [],
      activityTypes: activityTypesRes.data || [],
      gamification: gamificationRes.data || null,
      xpHistory: xpHistoryRes.data || [],
    };
  }, [user?.id]);

  // ============================================
  // 1. ANALYSE DES CORRÉLATIONS SUBTILES
  // ============================================
  const analyzeCorrelations = useMutation({
    mutationFn: async () => {
      setError(null);
      const data = await fetchUserData(30);
      if (!data) throw new Error('Impossible de récupérer les données');

      return geminiService.analyzeCorrelations({
        moods: data.moods,
        sleep: data.sleep,
        habits: data.habitLogs,
        focus: data.focus,
        // NOUVELLES DONNÉES pour analyses avancées
        moodActivities: data.moodActivities,
        moodDomains: data.moodDomains,
        activityTypes: data.activityTypes,
        gamification: data.gamification,
      });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // ============================================
  // 2. RÉSUMÉS HEBDOMADAIRES / MENSUELS
  // ============================================
  const generateWeeklySummary = useMutation({
    mutationFn: async () => {
      setError(null);
      const data = await fetchUserData(7);
      if (!data) throw new Error('Impossible de récupérer les données');

      return geminiService.generateWeeklySummary({
        moods: data.moods,
        sleep: data.sleep,
        habits: data.habitLogs,
        focus: data.focus,
        tasks: data.tasks.filter(t => t.completed),
        gratitudes: data.gratitudes,
      });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const generateMonthlySummary = useMutation({
    mutationFn: async () => {
      setError(null);
      const data = await fetchUserData(30);
      if (!data) throw new Error('Impossible de récupérer les données');

      return geminiService.generateMonthlySummary({
        moods: data.moods,
        sleep: data.sleep,
        habits: data.habitLogs,
        focus: data.focus,
        tasks: data.tasks.filter(t => t.completed),
        gratitudes: data.gratitudes,
      });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // ============================================
  // 3. ANALYSE NLP DES NOTES ET GRATITUDES
  // ============================================
  const analyzeNotes = useMutation({
    mutationFn: async () => {
      setError(null);
      const data = await fetchUserData(30);
      if (!data) throw new Error('Impossible de récupérer les données');

      // Collecter toutes les notes
      const notes: { date: string; text: string; type: 'mood' | 'gratitude' | 'sleep' | 'focus' }[] = [];

      // Notes des moods
      data.moods.forEach(m => {
        if (m.note) {
          notes.push({ date: m.datetime, text: m.note, type: 'mood' });
        }
      });

      // Gratitudes
      data.gratitudes.forEach(g => {
        if (g.entry_1) notes.push({ date: g.date, text: g.entry_1, type: 'gratitude' });
        if (g.entry_2) notes.push({ date: g.date, text: g.entry_2, type: 'gratitude' });
        if (g.entry_3) notes.push({ date: g.date, text: g.entry_3, type: 'gratitude' });
      });

      // Notes de sommeil
      data.sleep.forEach(s => {
        if (s.notes) {
          notes.push({ date: s.date, text: s.notes, type: 'sleep' });
        }
      });

      // Notes de focus
      data.focus.forEach(f => {
        if (f.notes) {
          notes.push({ date: f.start_time, text: f.notes, type: 'focus' });
        }
        if (f.objective) {
          notes.push({ date: f.start_time, text: f.objective, type: 'focus' });
        }
      });

      if (notes.length === 0) {
        return "Aucune note trouvée dans les 30 derniers jours. Commence à ajouter des notes à tes entrées pour que je puisse les analyser !";
      }

      return geminiService.analyzeNotes(notes);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // ============================================
  // 4. RECHERCHE SÉMANTIQUE
  // ============================================
  const semanticSearch = useMutation({
    mutationFn: async (query: string) => {
      setError(null);
      const data = await fetchUserData(90); // 90 jours pour la recherche
      if (!data) throw new Error('Impossible de récupérer les données');

      return geminiService.semanticSearch(query, {
        moods: data.moods.map(m => ({
          date: m.datetime,
          score: m.score_global,
          emotions: m.emotions,
          note: m.note,
          energy: m.energy_level,
        })),
        gratitudes: data.gratitudes.map(g => ({
          date: g.date,
          entries: [g.entry_1, g.entry_2, g.entry_3].filter(Boolean),
        })),
        notes: [
          ...data.sleep.filter(s => s.notes).map(s => ({ date: s.date, text: s.notes, type: 'sleep' })),
          ...data.focus.filter(f => f.notes || f.objective).map(f => ({
            date: f.start_time,
            text: f.notes || f.objective,
            type: 'focus',
          })),
        ],
      });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // ============================================
  // 5. AFFIRMATIONS QUOTIDIENNES
  // ============================================
  const { data: dailyAffirmation, refetch: refreshAffirmation } = useQuery({
    queryKey: ['daily-affirmation', user?.id, format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const data = await fetchUserData(7);
      if (!data) return null;

      const recentMoods = data.moods.slice(0, 5);
      const avgMood = recentMoods.length > 0
        ? recentMoods.reduce((sum, m) => sum + m.score_global, 0) / recentMoods.length
        : 5;
      const avgEnergy = recentMoods.length > 0
        ? recentMoods.reduce((sum, m) => sum + (m.energy_level || 5), 0) / recentMoods.length
        : 5;

      const recentEmotions = [...new Set(recentMoods.flatMap(m => m.emotions || []))];

      return geminiService.generateAffirmation({
        mood: Math.round(avgMood),
        energy: Math.round(avgEnergy),
        recentEmotions,
      });
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60 * 12, // 12 heures
    gcTime: 1000 * 60 * 60 * 24, // 24 heures
  });

  // ============================================
  // 5.1. INSIGHT QUOTIDIEN (NOUVEAU)
  // ============================================
  const { data: dailyInsight, refetch: refreshDailyInsight, isLoading: isLoadingDailyInsight } = useQuery({
    queryKey: ['daily-insight', user?.id, format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user?.id) return null;

      // Vérifier le cache d'abord
      const cacheKey = `daily-insight-${user.id}-${format(new Date(), 'yyyy-MM-dd')}`;
      const cached = aiCache.get<{ insight: string; tip: string; emoji: string; metric: string; trend: 'up' | 'down' | 'stable' }>(cacheKey);
      if (cached) {
        console.log('💾 Cache hit: daily insight');
        return cached;
      }

      const data = await fetchUserData(3); // 3 derniers jours
      if (!data) return null;

      const recentMoods = data.moods.slice(0, 5);
      const recentSleep = data.sleep.slice(0, 3);
      const recentHabits = data.habitLogs.slice(0, 10);

      // Calculer progrès d'aujourd'hui
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayHabits = data.habitLogs.filter(h => h.date === today);
      const todayMood = data.moods.find(m => m.datetime.startsWith(today));
      const todayFocus = data.focus.filter(f => f.start_time?.startsWith(today));

      const todayProgress = {
        habitsCompleted: todayHabits.filter(h => h.completed).length,
        moodLogged: !!todayMood,
        focusMinutes: todayFocus.reduce((sum, f) => sum + (f.duration || 0), 0)
      };

      const result = await geminiService.generateDailyInsight({
        recentMoods,
        recentSleep,
        recentHabits,
        todayProgress
      });

      // Mettre en cache
      aiCache.set(cacheKey, result, CACHE_TTL.DAILY_INSIGHT);
      return result;
    },
    enabled: !!user?.id,
    staleTime: CACHE_TTL.DAILY_INSIGHT,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // ============================================
  // 5.2. SOUTIEN MOOD BAS (NOUVEAU)
  // ============================================
  const generateMoodSupport = useMutation({
    mutationFn: async (moodData: { score: number; emotions: string[] }) => {
      setError(null);
      const data = await fetchUserData(3); // 3 derniers jours

      if (!data) throw new Error('Impossible de récupérer les données');

      // Déterminer le moment de la journée
      const now = new Date();
      const hour = now.getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

      // Pattern des 3 derniers moods
      const recentPattern = data.moods.slice(0, 3).map(m => ({
        score: m.score_global,
        datetime: m.datetime
      }));

      return geminiService.generateMoodSupport({
        score: moodData.score,
        emotions: moodData.emotions,
        recentPattern,
        timeOfDay
      });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // ============================================
  // 6. RECOMMANDATIONS D'HABITUDES
  // ============================================
  const recommendHabits = useMutation({
    mutationFn: async () => {
      setError(null);
      const data = await fetchUserData(30);
      if (!data) throw new Error('Impossible de récupérer les données');

      return geminiService.recommendHabits({
        currentHabits: data.habits,
        habitLogs: data.habitLogs,
        moods: data.moods,
        goals: data.goals,
      });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // ============================================
  // 6.1 SUGGESTIONS D'HABITUDES SIMILAIRES (NOUVEAU)
  // ============================================
  const suggestHabits = useMutation({
    mutationFn: async (params: {
      partialName: string;
    }) => {
      setError(null);
      const data = await fetchUserData(30);
      if (!data) {
        // Si pas de données, envoyer des tableaux vides
        return geminiService.suggestSimilarHabits({
          partialName: params.partialName,
          existingHabits: [],
          recentCompletions: [],
          goals: [],
        });
      }

      // Calculer les taux de complétion
      const habitCompletionRates = data.habits.map(habit => {
        const logs = data.habitLogs.filter((log: any) => log.habit_id === habit.id);
        const rate = logs.length > 0 ? (logs.filter((log: any) => log.completed).length / logs.length) * 100 : 0;
        return {
          name: habit.name,
          rate: Math.round(rate),
        };
      });

      return geminiService.suggestSimilarHabits({
        partialName: params.partialName,
        existingHabits: data.habits.map((h: any) => ({
          name: h.name,
          category: h.category,
          frequency: h.frequency,
        })),
        recentCompletions: habitCompletionRates,
        goals: data.goals.map((g: any) => g.title),
      });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // ============================================
  // 6.2 SUGGESTION DE QUADRANT POUR TÂCHES (NOUVEAU)
  // ============================================
  const suggestTaskQuadrant = useMutation({
    mutationFn: async (params: {
      title: string;
    }) => {
      setError(null);

      // Déterminer le moment de la journée
      const hour = new Date().getHours();
      const timeOfDay: 'morning' | 'afternoon' | 'evening' =
        hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

      // Récupérer les données récentes pour obtenir l'humeur/énergie actuelle
      const data = await fetchUserData(1);
      const latestMood = data?.moods?.[0]?.score_global;

      return geminiService.suggestTaskQuadrant({
        title: params.title,
        currentMood: latestMood,
        currentEnergy: undefined, // Pas de tracking d'énergie pour l'instant
        timeOfDay,
      });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // ============================================
  // 6.3 CONSEILS DE SOMMEIL (NOUVEAU)
  // ============================================
  const generateSleepTips = useMutation({
    mutationFn: async (sleepData: {
      last7Days: Array<{
        date: string;
        hours: number;
        quality: number;
      }>;
    }) => {
      setError(null);

      // Récupérer l'humeur récente pour contexte
      const data = await fetchUserData(7);
      const recentMoods = data?.moods || [];
      const avgMood = recentMoods.length > 0
        ? recentMoods.reduce((sum: number, m: any) => sum + m.score_global, 0) / recentMoods.length
        : undefined;

      return geminiService.generateSleepTips({
        last7Days: sleepData.last7Days,
        avgMood,
        avgEnergy: undefined, // Pas de tracking d'énergie pour l'instant
      });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // ============================================
  // 6.4 ENCOURAGEMENT POUR OBJECTIFS (NOUVEAU)
  // ============================================
  const generateGoalEncouragement = useMutation({
    mutationFn: async (goalData: {
      goalId: string;
      title: string;
      category: string;
      targetDate?: string;
      description?: string;
    }) => {
      setError(null);

      // Récupérer les milestones de cet objectif
      const { data: milestones } = await supabase
        .from('goal_milestones')
        .select('*')
        .eq('goal_id', goalData.goalId)
        .order('created_at', { ascending: true });

      const milestonesData = milestones || [];
      const completedMilestones = milestonesData.filter((m: any) => m.completed).length;
      const progress = milestonesData.length > 0
        ? Math.round((completedMilestones / milestonesData.length) * 100)
        : 0;

      return geminiService.generateGoalEncouragement({
        title: goalData.title,
        progress,
        milestones: milestonesData.map((m: any) => ({
          title: m.title,
          completed: m.completed,
        })),
        relatedHabits: [], // Pas de lien direct pour l'instant
        relatedTasks: [], // Pas de lien direct pour l'instant
      });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // ============================================
  // 7. ANALYSE POST-SESSION FOCUS
  // ============================================
  const analyzeFocusSession = useMutation({
    mutationFn: async (session: {
      duration: number;
      tags: string[];
      objective?: string;
      preEnergy?: number;
      postQuality?: number;
      distractions?: number;
      mood?: string;
      notes?: string;
    }) => {
      setError(null);
      const data = await fetchUserData(14);

      return geminiService.analyzeFocusSession(session, data?.focus);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // ============================================
  // 8. Q&A SUR LES DONNÉES
  // ============================================
  const askQuestion = useMutation({
    mutationFn: async (question: string) => {
      setError(null);
      const data = await fetchUserData(30);
      if (!data) throw new Error('Impossible de récupérer les données');

      const response = await geminiService.askQuestion(question, {
        moods: data.moods,
        sleep: data.sleep,
        habits: data.habitLogs,
        focus: data.focus,
        tasks: data.tasks,
        gratitudes: data.gratitudes,
        // NOUVELLES DONNÉES pour Q&A avancé
        moodActivities: data.moodActivities,
        moodDomains: data.moodDomains,
        activityTypes: data.activityTypes,
        goals: data.goals,
        gamification: data.gamification,
        xpHistory: data.xpHistory,
      });

      // Ajouter à l'historique de conversation
      const userMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: question,
        timestamp: new Date(),
        type: 'text',
      };

      const assistantMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'text',
      };

      setConversationHistory(prev => [...prev, userMessage, assistantMessage]);

      return response;
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // ============================================
  // 9. EXPORT NARRATIF
  // ============================================
  const generateNarrativeExport = useMutation({
    mutationFn: async (period: 'week' | 'month' | '3months') => {
      setError(null);
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      const data = await fetchUserData(days);
      if (!data) throw new Error('Impossible de récupérer les données');

      return geminiService.generateNarrativeExport({
        period,
        moods: data.moods,
        sleep: data.sleep,
        habits: data.habitLogs,
        focus: data.focus,
        tasks: data.tasks.filter(t => t.completed),
        gratitudes: data.gratitudes,
        goals: data.goals,
      });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // ============================================
  // 10. ENTRÉE VOCALE
  // ============================================
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Initialiser la reconnaissance vocale
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current];
        setTranscript(result[0].transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        setError('Erreur de reconnaissance vocale');
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const processVoiceInput = useMutation({
    mutationFn: async (text: string): Promise<VoiceInputResult> => {
      setError(null);
      return geminiService.processVoiceInput(text);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // ============================================
  // UTILITAIRES
  // ============================================
  const clearConversation = useCallback(() => {
    setConversationHistory([]);
    geminiService.clearHistory();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Vérifier si l'API est configurée
  const isConfigured = !!import.meta.env.VITE_GEMINI_API_KEY &&
                       import.meta.env.VITE_GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE';

  return {
    // État
    isConfigured,
    isProcessing: analyzeCorrelations.isPending ||
                  generateWeeklySummary.isPending ||
                  generateMonthlySummary.isPending ||
                  analyzeNotes.isPending ||
                  semanticSearch.isPending ||
                  recommendHabits.isPending ||
                  suggestHabits.isPending ||
                  suggestTaskQuadrant.isPending ||
                  generateSleepTips.isPending ||
                  generateGoalEncouragement.isPending ||
                  analyzeFocusSession.isPending ||
                  askQuestion.isPending ||
                  generateNarrativeExport.isPending ||
                  processVoiceInput.isPending ||
                  generateMoodSupport.isPending,
    error,
    clearError,

    // Conversation
    conversationHistory,
    clearConversation,

    // 1. Corrélations
    analyzeCorrelations: analyzeCorrelations.mutateAsync,
    correlationsResult: analyzeCorrelations.data,
    isAnalyzingCorrelations: analyzeCorrelations.isPending,

    // 2. Résumés
    generateWeeklySummary: generateWeeklySummary.mutateAsync,
    weeklySummary: generateWeeklySummary.data,
    isGeneratingWeeklySummary: generateWeeklySummary.isPending,
    generateMonthlySummary: generateMonthlySummary.mutateAsync,
    monthlySummary: generateMonthlySummary.data,
    isGeneratingMonthlySummary: generateMonthlySummary.isPending,

    // 3. Analyse NLP
    analyzeNotes: analyzeNotes.mutateAsync,
    notesAnalysis: analyzeNotes.data,
    isAnalyzingNotes: analyzeNotes.isPending,

    // 4. Recherche sémantique
    semanticSearch: semanticSearch.mutateAsync,
    searchResults: semanticSearch.data,
    isSearching: semanticSearch.isPending,

    // 5. Affirmation
    dailyAffirmation,
    refreshAffirmation,

    // 5.1 Insight quotidien (NOUVEAU)
    dailyInsight,
    refreshDailyInsight,
    isLoadingDailyInsight,

    // 5.2 Soutien mood bas (NOUVEAU)
    generateMoodSupport: generateMoodSupport.mutateAsync,
    moodSupport: generateMoodSupport.data,
    isGeneratingMoodSupport: generateMoodSupport.isPending,

    // 6. Recommandations d'habitudes
    recommendHabits: recommendHabits.mutateAsync,
    habitRecommendations: recommendHabits.data,
    isRecommendingHabits: recommendHabits.isPending,

    // 6.1 Suggestions d'habitudes similaires (NOUVEAU)
    suggestHabits: suggestHabits.mutateAsync,
    habitSuggestions: suggestHabits.data,
    isSuggestingHabits: suggestHabits.isPending,

    // 6.2 Suggestion de quadrant pour tâches (NOUVEAU)
    suggestTaskQuadrant: suggestTaskQuadrant.mutateAsync,
    taskQuadrantSuggestion: suggestTaskQuadrant.data,
    isSuggestingTaskQuadrant: suggestTaskQuadrant.isPending,

    // 6.3 Conseils de sommeil (NOUVEAU)
    generateSleepTips: generateSleepTips.mutateAsync,
    sleepTips: generateSleepTips.data,
    isGeneratingSleepTips: generateSleepTips.isPending,

    // 6.4 Encouragement pour objectifs (NOUVEAU)
    generateGoalEncouragement: generateGoalEncouragement.mutateAsync,
    goalEncouragement: generateGoalEncouragement.data,
    isGeneratingGoalEncouragement: generateGoalEncouragement.isPending,

    // 7. Analyse focus
    analyzeFocusSession: analyzeFocusSession.mutateAsync,
    focusAnalysis: analyzeFocusSession.data,
    isAnalyzingFocus: analyzeFocusSession.isPending,

    // 8. Q&A
    askQuestion: askQuestion.mutateAsync,
    isAskingQuestion: askQuestion.isPending,

    // 9. Export narratif
    generateNarrativeExport: generateNarrativeExport.mutateAsync,
    narrativeExport: generateNarrativeExport.data,
    isGeneratingExport: generateNarrativeExport.isPending,

    // 10. Voix
    isListening,
    transcript,
    startListening,
    stopListening,
    processVoiceInput: processVoiceInput.mutateAsync,
    voiceResult: processVoiceInput.data,
    isProcessingVoice: processVoiceInput.isPending,
    isVoiceSupported: typeof window !== 'undefined' &&
                      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
  };
}

// Types pour la reconnaissance vocale (Web Speech API)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}
