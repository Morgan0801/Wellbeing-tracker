import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Moon,
  Target,
  Heart,
  Filter,
  LayoutGrid,
  List
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useMood } from '@/hooks/useMood';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { MoodHeatmapCalendar } from './MoodHeatmapCalendar';
import { SleepHeatmapCalendar } from './SleepHeatmapCalendar';
import { SleepMoodCorrelation } from './SleepMoodCorrelation';
import { ShareInsightsButton } from './ShareInsightsButton';

interface DomainImpact {
  domain: string;
  impact: number;
  mood_id: string;
}

interface HabitLog {
  id: string;
  date: string;
  completed: boolean;
  quantity: number;
  habit_id?: string;
  habit: {
    name: string;
    category: string;
  };
}

interface SleepLog {
  date: string;
  total_hours: number;
  quality_score: number;
}

interface TaskLog {
  completed_at: string;
  quadrant: number;
}

const DOMAIN_LABELS: Record<string, { label: string; emoji: string }> = {
  travail: { label: 'Travail', emoji: '💼' },
  sport: { label: 'Sport', emoji: '🏃' },
  amour: { label: 'Amour', emoji: '❤️' },
  amis: { label: 'Amis', emoji: '👥' },
  famille: { label: 'Famille', emoji: '👨‍👩‍👧' },
  finances: { label: 'Finances', emoji: '💰' },
  loisirs: { label: 'Loisirs', emoji: '🎮' },
  bienetre: { label: 'Bien-être', emoji: '🧘' },
};

type PeriodType = '7days' | '30days' | '90days';

type HeatmapMetricKey = 'mood' | 'sleepHours' | 'sleepQuality';

interface HabitHeatmapRow {
  id: string;
  name: string;
  category: string;
  daysTracked: number;
  metrics: Record<
    HeatmapMetricKey,
    {
      change: number | null;
      withAverage: number | null;
      withoutAverage: number | null;
    }
  >;
}

const toDateKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.split('T')[0] ?? value;
  }
  return date.toISOString().split('T')[0];
};

const computeAverage = (values: number[]) =>
  values.length ? values.reduce((sum, item) => sum + item, 0) / values.length : null;

const computePercentageChange = (withAverage: number | null, withoutAverage: number | null) => {
  if (withAverage === null || withoutAverage === null) return null;
  if (Math.abs(withoutAverage) < 0.001) return null;
  return ((withAverage - withoutAverage) / Math.abs(withoutAverage)) * 100;
};

const formatPercentageChange = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return '--';
  const rounded = Math.round(value);
  const prefix = rounded > 0 ? '+' : '';
  return `${prefix}${rounded}%`;
};

const formatAverageValue = (value: number | null, decimals: number) => {
  if (value === null || Number.isNaN(value)) return '--';
  return value.toFixed(decimals);
};

const heatmapClassName = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return 'bg-muted text-muted-foreground';
  }
  if (value >= 20) return 'bg-green-500/30 text-green-900 dark:text-green-200';
  if (value >= 10) return 'bg-green-500/20 text-green-700 dark:text-green-200';
  if (value > 0) return 'bg-green-500/10 text-green-600 dark:text-green-200';
  if (value <= -20) return 'bg-red-500/30 text-red-900 dark:text-red-200';
  if (value <= -10) return 'bg-red-500/20 text-red-700 dark:text-red-200';
  if (value < 0) return 'bg-red-500/10 text-red-600 dark:text-red-200';
  return 'bg-muted text-muted-foreground';
};

const HEATMAP_METRICS: { key: HeatmapMetricKey; label: string; helper: string; decimals: number }[] = [
  { key: 'mood', label: 'Humeur', helper: 'Difference de la note moyenne (/10).', decimals: 1 },
  { key: 'sleepHours', label: 'Sommeil (h)', helper: 'Variation de la duree moyenne de sommeil.', decimals: 1 },
  {
    key: 'sleepQuality',
    label: 'Qualite sommeil',
    helper: 'Variation du score moyen de qualite (/5).',
    decimals: 1,
  },
];
export function InsightsPage() {
  const { user } = useAuthStore();
  const { moods } = useMood();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('30days');
  const [correlationView, setCorrelationView] = useState<'grid' | 'list'>('grid');
  const [heatmapPeriod, setHeatmapPeriod] = useState<30 | 90>(90);

  // Calculer la date de début selon la période
  const startDate = useMemo(() => {
    const date = new Date();
    switch (selectedPeriod) {
      case '7days':
        date.setDate(date.getDate() - 7);
        break;
      case '30days':
        date.setDate(date.getDate() - 30);
        break;
      case '90days':
        date.setDate(date.getDate() - 90);
        break;
    }
    return date.toISOString();
  }, [selectedPeriod]);

  const filteredMoods = useMemo(() => {
    const threshold = new Date(startDate);
    return moods.filter((mood) => {
      const timestamp = new Date(mood.datetime);
      return !Number.isNaN(timestamp.getTime()) && timestamp >= threshold;
    });
  }, [moods, startDate]);

  // Récupérer les mood_domains
  const { data: domainImpacts = [] } = useQuery({
    queryKey: ['mood_domains', user?.id, startDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_domains')
        .select('domain, impact, mood_id')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DomainImpact[];
    },
    enabled: !!user?.id,
  });

  // Récupérer les logs d'habitudes
  const { data: habitLogs = [] } = useQuery({
    queryKey: ['habit_logs_analysis', user?.id, startDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select(`
          id,
          date,
          completed,
          quantity,
          habit_id,
          habit:habits(name, category)
        `)
        .gte('date', startDate.split('T')[0])
        .eq('completed', true);

      if (error) throw error;
      return data as unknown as HabitLog[];
    },
    enabled: !!user?.id,
  });

  // Récupérer les logs de sommeil
  const { data: sleepLogs = [] } = useQuery({
    queryKey: ['sleep_logs_analysis', user?.id, startDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('date, total_hours, quality_score')
        .gte('date', startDate.split('T')[0]);

      if (error) throw error;
      return data as SleepLog[];
    },
    enabled: !!user?.id,
  });

  const sleepByDate = useMemo(() => {
    const map = new Map<string, { hours: number; quality: number }>();
    sleepLogs.forEach((log) => {
      const dateKey = toDateKey(log.date);
      map.set(dateKey, { hours: log.total_hours, quality: log.quality_score });
    });
    return map;
  }, [sleepLogs]);

  // Récupérer les tâches complétées
  const { data: completedTasks = [] } = useQuery({
    queryKey: ['tasks_completed_analysis', user?.id, startDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('completed_at, quadrant')
        .eq('completed', true)
        .gte('completed_at', startDate);

      if (error) throw error;
      return data as TaskLog[];
    },
    enabled: !!user?.id,
  });

  // === ANALYSES CROISÉES ===

  // 1. Corrélation Domaines & Humeur
  const domainAnalysis = useMemo(() => {
    if (domainImpacts.length === 0) return [];

    const domainGroups: Record<string, { positive: number; negative: number; neutral: number; total: number }> = {};

    domainImpacts.forEach((impact) => {
      if (!domainGroups[impact.domain]) {
        domainGroups[impact.domain] = { positive: 0, negative: 0, neutral: 0, total: 0 };
      }

      domainGroups[impact.domain].total++;

      if (impact.impact > 0) {
        domainGroups[impact.domain].positive += impact.impact;
      } else if (impact.impact < 0) {
        domainGroups[impact.domain].negative += Math.abs(impact.impact);
      } else {
        domainGroups[impact.domain].neutral += 1;
      }
    });

    return Object.entries(domainGroups)
      .map(([domain, counts]) => {
        const netScore = counts.positive - counts.negative;
        const avgImpact = netScore / counts.total;

        return {
          domain,
          ...DOMAIN_LABELS[domain],
          positive: counts.positive,
          negative: counts.negative,
          netScore,
          avgImpact,
          totalCount: counts.total,
          positivePercent: (counts.positive / (counts.positive + counts.negative || 1)) * 100,
        };
      })
      .filter((c) => c.totalCount > 0)
      .sort((a, b) => Math.abs(b.avgImpact) - Math.abs(a.avgImpact));
  }, [domainImpacts]);

  const habitCorrelationHeatmap = useMemo(() => {
    if (habitLogs.length === 0) return [] as HabitHeatmapRow[];

    const habits = new Map<string, { id: string; name: string; category: string; dates: Set<string> }>();

    habitLogs.forEach((log) => {
      const dateKey = toDateKey(log.date);
      const habitName = log.habit?.name ?? "Habitude";
      const habitCategory = log.habit?.category ?? "Autre";
      const habitId = log.habit_id ?? [habitName, habitCategory].join("::");

      const existing = habits.get(habitId) ?? {
        id: habitId,
        name: habitName,
        category: habitCategory,
        dates: new Set<string>(),
      };

      existing.dates.add(dateKey);
      existing.name = habitName;
      existing.category = habitCategory;

      habits.set(habitId, existing);
    });

    if (habits.size === 0) return [] as HabitHeatmapRow[];

    const moodByDate = new Map<string, number>();
    filteredMoods.forEach((mood) => {
      moodByDate.set(toDateKey(mood.datetime), mood.score_global);
    });

    const rows: HabitHeatmapRow[] = [];

    habits.forEach((habit) => {
      if (habit.dates.size === 0) return;

      const moodWith: number[] = [];
      const moodWithout: number[] = [];

      moodByDate.forEach((value, dateKey) => {
        if (habit.dates.has(dateKey)) {
          moodWith.push(value);
        } else {
          moodWithout.push(value);
        }
      });

      const sleepHoursWith: number[] = [];
      const sleepHoursWithout: number[] = [];
      const sleepQualityWith: number[] = [];
      const sleepQualityWithout: number[] = [];

      sleepByDate.forEach((value, dateKey) => {
        if (habit.dates.has(dateKey)) {
          sleepHoursWith.push(value.hours);
          sleepQualityWith.push(value.quality);
        } else {
          sleepHoursWithout.push(value.hours);
          sleepQualityWithout.push(value.quality);
        }
      });

      const moodWithAvg = computeAverage(moodWith);
      const moodWithoutAvg = computeAverage(moodWithout);
      const sleepHoursWithAvg = computeAverage(sleepHoursWith);
      const sleepHoursWithoutAvg = computeAverage(sleepHoursWithout);
      const sleepQualityWithAvg = computeAverage(sleepQualityWith);
      const sleepQualityWithoutAvg = computeAverage(sleepQualityWithout);

      if (
        moodWithAvg === null &&
        sleepHoursWithAvg === null &&
        sleepQualityWithAvg === null
      ) {
        return;
      }

      rows.push({
        id: habit.id,
        name: habit.name,
        category: habit.category,
        daysTracked: habit.dates.size,
        metrics: {
          mood: {
            change: computePercentageChange(moodWithAvg, moodWithoutAvg),
            withAverage: moodWithAvg,
            withoutAverage: moodWithoutAvg,
          },
          sleepHours: {
            change: computePercentageChange(sleepHoursWithAvg, sleepHoursWithoutAvg),
            withAverage: sleepHoursWithAvg,
            withoutAverage: sleepHoursWithoutAvg,
          },
          sleepQuality: {
            change: computePercentageChange(sleepQualityWithAvg, sleepQualityWithoutAvg),
            withAverage: sleepQualityWithAvg,
            withoutAverage: sleepQualityWithoutAvg,
          },
        },
      });
    });

    return rows.sort((a, b) => {
      const aValue = a.metrics.mood.change ?? -Infinity;
      const bValue = b.metrics.mood.change ?? -Infinity;
      return bValue - aValue;
    });
  }, [habitLogs, filteredMoods, sleepByDate]);

// 2. Corrélation Sommeil & Humeur
  const sleepMoodCorrelation = useMemo(() => {
    if (sleepLogs.length === 0 || filteredMoods.length === 0) return null;

    // Grouper moods par date
    const moodsByDate = new Map(
      filteredMoods.map(mood => [
        new Date(mood.datetime).toISOString().split('T')[0],
        mood.score_global
      ])
    );

    // Corréler avec le sommeil
    const correlations = sleepLogs
      .map(sleep => {
        const moodScore = moodsByDate.get(sleep.date);
        return moodScore ? { sleep: sleep.total_hours, mood: moodScore, quality: sleep.quality_score } : null;
      })
      .filter(Boolean);

    if (correlations.length === 0) return null;

    // Calculer moyennes par tranche de sommeil
    const sleepRanges = [
      { min: 0, max: 5, label: '< 5h' },
      { min: 5, max: 6, label: '5-6h' },
      { min: 6, max: 7, label: '6-7h' },
      { min: 7, max: 8, label: '7-8h' },
      { min: 8, max: 24, label: '> 8h' },
    ];

    const rangeStats = sleepRanges.map(range => {
      const dataInRange = correlations.filter(
        c => c!.sleep >= range.min && c!.sleep < range.max
      );

      if (dataInRange.length === 0) return null;

      const avgMood = dataInRange.reduce((sum, c) => sum + c!.mood, 0) / dataInRange.length;
      const avgQuality = dataInRange.reduce((sum, c) => sum + c!.quality, 0) / dataInRange.length;

      return {
        range: range.label,
        avgMood: avgMood.toFixed(1),
        avgQuality: avgQuality.toFixed(1),
        count: dataInRange.length,
      };
    }).filter(Boolean);

    return rangeStats;
  }, [sleepLogs, filteredMoods]);

  // 3. Corrélation Habitudes & Humeur
  const habitMoodCorrelation = useMemo(() => {
    if (habitLogs.length === 0 || filteredMoods.length === 0) return [];

    // Grouper moods par date
    const moodsByDate = new Map(
      filteredMoods.map(mood => [
        new Date(mood.datetime).toISOString().split('T')[0],
        mood.score_global
      ])
    );

    // Grouper habitudes par catégorie
    const habitsByCategory: Record<string, number[]> = {};

    habitLogs.forEach(log => {
      const category = log.habit.category;
      const moodScore = moodsByDate.get(log.date);

      if (moodScore) {
        if (!habitsByCategory[category]) {
          habitsByCategory[category] = [];
        }
        habitsByCategory[category].push(moodScore);
      }
    });

    return Object.entries(habitsByCategory)
      .map(([category, scores]) => ({
        category,
        avgMood: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
        count: scores.length,
      }))
      .sort((a, b) => parseFloat(b.avgMood) - parseFloat(a.avgMood));
  }, [habitLogs, filteredMoods]);

  // 4. Productivité & Humeur (par quadrant Eisenhower)
  const tasksMoodCorrelation = useMemo(() => {
    if (completedTasks.length === 0 || filteredMoods.length === 0) return null;

    const quadrantLabels: Record<number, string> = {
      1: 'Urgent & Important',
      2: 'Important, Non urgent',
      3: 'Urgent, Non important',
      4: 'Ni urgent ni important',
    };

    const moodsByDate = new Map(
      filteredMoods.map(mood => [
        new Date(mood.datetime).toISOString().split('T')[0],
        mood.score_global
      ])
    );

    const quadrantStats: Record<number, { moods: number[]; count: number }> = {};

    completedTasks.forEach(task => {
      const date = new Date(task.completed_at).toISOString().split('T')[0];
      const moodScore = moodsByDate.get(date);

      if (moodScore) {
        if (!quadrantStats[task.quadrant]) {
          quadrantStats[task.quadrant] = { moods: [], count: 0 };
        }
        quadrantStats[task.quadrant].moods.push(moodScore);
        quadrantStats[task.quadrant].count++;
      }
    });

    return Object.entries(quadrantStats)
      .map(([quadrant, stats]) => ({
        quadrant: parseInt(quadrant),
        label: quadrantLabels[parseInt(quadrant)],
        avgMood: (stats.moods.reduce((a, b) => a + b, 0) / stats.moods.length).toFixed(1),
        count: stats.count,
      }))
      .sort((a, b) => parseFloat(b.avgMood) - parseFloat(a.avgMood));
  }, [completedTasks, filteredMoods]);

  // Séparer impacts positifs et négatifs
  const positiveCorrelations = domainAnalysis.filter((c) => c.avgImpact > 0);
  const negativeCorrelations = domainAnalysis.filter((c) => c.avgImpact < 0);

  if (filteredMoods.length === 0) {
    return (
      <div className="container mx-auto p-4 pb-24 md:pb-4">
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            Pas encore assez de données pour générer des insights.
            <br />
            Continue à enregistrer tes données !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 md:p-4 pb-20 md:pb-4 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            Insights & Analyses
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1">
            Corrélations entre tes données
          </p>
        </div>
        {/* Share Button */}
        <ShareInsightsButton targetId="insights-shareable" filename="mes-insights" />
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
        <div className="flex items-center gap-1 md:gap-2">
          <Filter className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
          <span className="text-xs md:text-sm font-medium text-gray-600">Période :</span>
        </div>
        {(['7days', '30days', '90days'] as PeriodType[]).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-2 md:px-3 py-0.5 md:py-1 rounded-lg text-xs md:text-sm font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {period === '7days' && '7j'}
            {period === '30days' && '30j'}
            {period === '90days' && '90j'}
          </button>
        ))}
      </div>

      {/* Shareable Content Wrapper */}
      <div id="insights-shareable" className="space-y-4 md:space-y-6">
        {/* Résumé */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="py-3 md:py-4 px-3 md:px-4">
            <h2 className="text-sm md:text-base font-bold text-blue-900 dark:text-blue-100 mb-2 md:mb-3 text-center">
              📊 Mon Wellbeing - Résumé
            </h2>
            <div className="grid grid-cols-4 gap-2 md:gap-4 text-center">
              <div>
                <div className="text-xl md:text-2xl font-bold text-blue-600">{moods.length}</div>
                <div className="text-[10px] md:text-xs text-gray-600">Moods</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-green-600">{habitLogs.length}</div>
                <div className="text-[10px] md:text-xs text-gray-600">Habitudes</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-purple-600">{sleepLogs.length}</div>
                <div className="text-[10px] md:text-xs text-gray-600">Nuits</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-orange-600">{completedTasks.length}</div>
                <div className="text-[10px] md:text-xs text-gray-600">Tâches</div>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Period selector for heatmaps */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Période :</span>
        <button
          onClick={() => setHeatmapPeriod(30)}
          className={`px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm font-medium transition-colors ${
            heatmapPeriod === 30
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          30j
        </button>
        <button
          onClick={() => setHeatmapPeriod(90)}
          className={`px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm font-medium transition-colors ${
            heatmapPeriod === 90
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          90j
        </button>
      </div>

      {/* Heatmaps: Mood & Sleep side by side even on mobile */}
      <div className="grid grid-cols-2 gap-2 md:gap-4 lg:gap-6">
        <MoodHeatmapCalendar period={heatmapPeriod} />
        <SleepHeatmapCalendar period={heatmapPeriod} />
      </div>

      {/* Sleep vs Mood Correlation */}
      <SleepMoodCorrelation />
      </div>

      {/* 1. DOMAINES & HUMEUR */}
      <div>
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center gap-2">
          <Heart className="w-4 h-4 md:w-5 md:h-5 text-pink-500" />
          Domaines de vie & Humeur
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-6">
          {positiveCorrelations.length > 0 && (
            <div>
              <h3 className="text-xs md:text-md font-semibold mb-2 md:mb-3 flex items-center gap-1 md:gap-2 text-green-600">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Impact </span>positif
              </h3>
              <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-3">
                {positiveCorrelations.map((corr) => (
                  <Card
                    key={corr.domain}
                    className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                  >
                    <CardContent className="p-2 md:p-4">
                      <div className="flex flex-col md:flex-row items-start md:justify-between mb-2 md:mb-3">
                        <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-0">
                          <span className="text-xl md:text-2xl">{corr.emoji}</span>
                          <div>
                            <div className="text-xs md:text-base font-semibold">{corr.label}</div>
                            <div className="text-[9px] md:text-xs text-gray-500">{corr.totalCount} mentions</div>
                          </div>
                        </div>
                        <div className="text-left md:text-right w-full md:w-auto">
                          <div className="text-lg md:text-xl font-bold text-green-600">
                            +{corr.avgImpact.toFixed(1)}
                          </div>
                          <div className="text-[9px] md:text-xs text-gray-500">
                            {corr.positivePercent.toFixed(0)}% positif
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 md:h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-green-600"
                          style={{ width: `${(corr.avgImpact / 5) * 100}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {negativeCorrelations.length > 0 && (
            <div>
              <h3 className="text-xs md:text-md font-semibold mb-2 md:mb-3 flex items-center gap-1 md:gap-2 text-red-600">
                <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Impact </span>négatif
              </h3>
              <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-3">
                {negativeCorrelations.map((corr) => (
                  <Card
                    key={corr.domain}
                    className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                  >
                    <CardContent className="p-2 md:p-4">
                      <div className="flex flex-col md:flex-row items-start md:justify-between mb-2 md:mb-3">
                        <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-0">
                          <span className="text-xl md:text-2xl">{corr.emoji}</span>
                          <div>
                            <div className="text-xs md:text-base font-semibold">{corr.label}</div>
                            <div className="text-[9px] md:text-xs text-gray-500">{corr.totalCount} mentions</div>
                          </div>
                        </div>
                        <div className="text-left md:text-right w-full md:w-auto">
                          <div className="text-lg md:text-xl font-bold text-red-600">
                            {corr.avgImpact.toFixed(1)}
                          </div>
                          <div className="text-[9px] md:text-xs text-gray-500">
                            {(100 - corr.positivePercent).toFixed(0)}% négatif
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 md:h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-400 to-red-600"
                          style={{ width: `${(Math.abs(corr.avgImpact) / 5) * 100}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. SOMMEIL & HUMEUR */}
      {sleepMoodCorrelation && sleepMoodCorrelation.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-500" />
            Sommeil & Humeur
          </h2>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {sleepMoodCorrelation.map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-16 font-semibold text-gray-700 dark:text-gray-300">
                        {stat!.range}
                      </div>
                      <div className="text-sm text-gray-500">
                        {stat!.count} jour{stat!.count > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Humeur moy.</div>
                        <div className="text-lg font-bold text-blue-600">{stat!.avgMood}/10</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Qualité moy.</div>
                        <div className="text-lg font-bold text-purple-600">{stat!.avgQuality}/5</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. HABITUDES & HUMEUR */}
      {/* 3. HABITUDES & CORRELATIONS */}
      {habitCorrelationHeatmap.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            Habitudes & Correlations
          </h2>
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-lg font-semibold">Vue correlation</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Periode</span>
                    {( ['7days', '30days', '90days'] as PeriodType[]).map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setSelectedPeriod(period)}
                        className={`rounded-full px-3 py-1 text-sm transition ${
                          selectedPeriod === period
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {period === '7days' ? '7 j' : period === '30days' ? '30 j' : '90 j'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Analyse l impact des habitudes sur ton humeur et ton sommeil dans la periode choisie.
                  </p>
                  <div className="inline-flex overflow-hidden rounded-md border">
                    <button
                      type="button"
                      onClick={() => setCorrelationView('list')}
                      className={`flex items-center gap-1 px-3 py-1 text-sm font-medium transition ${
                        correlationView === 'list'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <List className="h-4 w-4" />
                      Liste
                    </button>
                    <button
                      type="button"
                      onClick={() => setCorrelationView('grid')}
                      className={`flex items-center gap-1 px-3 py-1 text-sm font-medium transition ${
                        correlationView === 'grid'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Grille
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {correlationView === 'grid' ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Habitude</th>
                        {HEATMAP_METRICS.map((metric) => (
                          <th
                            key={metric.key}
                            className="px-4 py-2 text-left font-semibold text-muted-foreground"
                          >
                            {metric.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {habitCorrelationHeatmap.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3">
                            <div className="font-semibold">{row.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {row.category} - {row.daysTracked} jour{row.daysTracked > 1 ? 's' : ''} suivis
                            </div>
                          </td>
                          {HEATMAP_METRICS.map((metric) => {
                            const metricData = row.metrics[metric.key];
                            return (
                              <td key={`${row.id}-${metric.key}`} className="px-4 py-3">
                                <div
                                  className={`rounded-md px-3 py-2 text-center text-sm font-semibold ${heatmapClassName(
                                    metricData.change
                                  )}`}
                                >
                                  {formatPercentageChange(metricData.change)}
                                  <div className="mt-1 text-xs font-normal text-muted-foreground">
                                    Moy {formatAverageValue(metricData.withAverage, metric.decimals)}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-3">
                  {habitCorrelationHeatmap.map((row) => (
                    <div
                      key={`${row.id}-summary`}
                      className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-semibold">{row.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.category} - {row.daysTracked} jour{row.daysTracked > 1 ? 's' : ''} suivis
                        </div>
                      </div>
                      <div className="grid w-full gap-2 text-sm sm:w-auto sm:grid-cols-3">
                        {HEATMAP_METRICS.map((metric) => {
                          const metricData = row.metrics[metric.key];
                          return (
                            <div
                              key={`${row.id}-summary-${metric.key}`}
                              className="rounded-md border border-border/50 px-2 py-1 text-center"
                            >
                              <div className="text-xs uppercase text-muted-foreground">{metric.label}</div>
                              <div className={`font-semibold ${heatmapClassName(metricData.change)}`}>
                                {formatPercentageChange(metricData.change)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Moy {formatAverageValue(metricData.withAverage, metric.decimals)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Les pourcentages comparent les jours avec l habitude et les autres jours pour la periode selectionnee.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. PRODUCTIVITÉ & HUMEUR */}
      {tasksMoodCorrelation && tasksMoodCorrelation.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            Productivité & Humeur
          </h2>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {tasksMoodCorrelation.map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <div className="font-semibold">{stat.label}</div>
                      <div className="text-xs text-gray-500">
                        Quadrant {stat.quadrant} • {stat.count} tâches
                      </div>
                    </div>
                    <div className="text-lg font-bold text-orange-600">{stat.avgMood}/10</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conseil personnalisé */}
      <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            💡 Recommandations personnalisées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {positiveCorrelations.length > 0 && (
              <p>
                ✨ <span className="font-semibold">{positiveCorrelations[0].label}</span> a un impact très positif sur ton humeur. Continue à y consacrer du temps !
              </p>
            )}
            {sleepMoodCorrelation && sleepMoodCorrelation.length > 0 && (
              <p>
                😴 Tes meilleures humeurs sont corrélées avec{' '}
                <span className="font-semibold">
                  {sleepMoodCorrelation.sort((a, b) => parseFloat(b!.avgMood) - parseFloat(a!.avgMood))[0]!.range}
                </span>{' '}
                de sommeil.
              </p>
            )}
            {habitMoodCorrelation.length > 0 && (
              <p>
                🎯 Tes habitudes de <span className="font-semibold">{habitMoodCorrelation[0].category}</span> semblent améliorer ton bien-être.
              </p>
            )}
            {negativeCorrelations.length > 0 && (
              <p>
                ⚠️ Le <span className="font-semibold">{negativeCorrelations[0].label.toLowerCase()}</span> semble peser sur ton moral. Essaie de trouver des stratégies pour mieux gérer cet aspect.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}