// src/hooks/useInsights.ts
import { format, parseISO, subDays } from 'date-fns';
import { isWithinInterval } from 'date-fns';

// On évite les imports stricts de types si ton arbo a bougé ; tu peux remettre ceux de ton projet si besoin.
// import type { InsightData, Correlation, Recommendation } from '@/types/phase5-types';

// Hooks existants (défensif si leurs signatures varient)
import { useMood } from './useMood';
import { useSleep } from './useSleep';
import { useHabits } from './useHabits';
import { useTasks } from './useTasks';

type Correlation = {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  strength: number; // 0–100
  description: string;
  insight: string;
};

type Recommendation = {
  id: string;
  category: 'sleep' | 'mood' | 'habits' | 'productivity';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
};

type InsightData = {
  period: { days: number; startDate: string; endDate: string };
  counts: { moods: number; sleep: number; habitLogs: number; tasks: number };
  moodTrend: Array<{ date: string; score: number }>;
  sleepTrend: Array<{ date: string; totalHours: number; quality: number }>;
  habitSuccess: Array<{ habitId: string; habitName: string; successRate: number; streak: number; totalLogs: number }>;
  correlations: Correlation[];
  recommendations: Recommendation[];
};

export function useInsights(days: number = 30) {
  // Récupération défensive des autres hooks (qu’ils exposent isLoading OU loading)
  const moodHook: any = useMood();
  const sleepHook: any = useSleep();
  const habitsHook: any = useHabits();
  const tasksHook: any = useTasks();

  const moods = moodHook?.moods ?? [];
  const sleepLogs = sleepHook?.sleepLogs ?? [];
  const habits = habitsHook?.habits ?? [];
  const habitLogs = habitsHook?.habitLogs ?? [];
  const tasks = tasksHook?.tasks ?? [];

  const isMoodsLoading = moodHook?.isLoading ?? moodHook?.loading ?? false;
  const isSleepLoading = sleepHook?.isLoading ?? sleepHook?.loading ?? false;
  const isHabitsLoading = habitsHook?.isLoading ?? habitsHook?.loading ?? false;
  const isTasksLoading = tasksHook?.isLoading ?? tasksHook?.loading ?? false;

  const isLoading = Boolean(isMoodsLoading || isSleepLoading || isHabitsLoading || isTasksLoading);

  // Fenêtre temporelle inclusive
  const endDate = new Date();
  const startDate = subDays(endDate, Math.max(0, days - 1));
  const inRange = (d: Date) =>
    isWithinInterval(d, {
      start: startDate,
      end: endDate,
    });

  // --- Moods ---
  const filteredMoods = Array.isArray(moods)
    ? moods.filter((m: any) => {
        const d = parseISO(m.date ?? m.created_at ?? m.createdAt);
        return d instanceof Date && !isNaN(+d) && inRange(d);
      })
    : [];

  const moodTrend = filteredMoods
    .map((m: any) => ({
      date: format(parseISO(m.date ?? m.created_at ?? m.createdAt), 'yyyy-MM-dd'),
      score: Number(m.global_score ?? m.globalScore ?? m.score ?? 0),
    }))
    .sort((a: any, b: any) => a.date.localeCompare(b.date));

  // --- Sleep ---
  const filteredSleep = Array.isArray(sleepLogs)
    ? sleepLogs.filter((s: any) => {
        const d = parseISO(s.date ?? s.created_at ?? s.createdAt);
        return d instanceof Date && !isNaN(+d) && inRange(d);
      })
    : [];

  const sleepTrend = filteredSleep
    .map((s: any) => ({
      date: format(parseISO(s.date ?? s.created_at ?? s.createdAt), 'yyyy-MM-dd'),
      totalHours: Number(s.total_hours ?? s.totalHours ?? 0),
      quality: Number(s.quality_score ?? s.qualityScore ?? 0),
    }))
    .sort((a: any, b: any) => a.date.localeCompare(b.date));

  // --- Habits ---
  const filteredHabitLogs = Array.isArray(habitLogs)
    ? habitLogs.filter((l: any) => {
        const d = parseISO(l.date ?? l.created_at ?? l.createdAt);
        return d instanceof Date && !isNaN(+d) && inRange(d);
      })
    : [];

  const habitSuccess = Array.isArray(habits)
    ? habits.map((habit: any) => {
        const logs = filteredHabitLogs.filter((log: any) => log.habit_id === habit.id && (log.completed ?? log.is_done ?? false));
        return {
          habitId: habit.id,
          habitName: habit.name ?? habit.title ?? 'Habitude',
          successRate: days > 0 ? (logs.length / days) * 100 : 0,
          streak: calculateStreak(filteredHabitLogs.filter((l: any) => l.habit_id === habit.id)),
          totalLogs: logs.length,
        };
      })
    : [];

  // --- Corrélations & Recos ---
  const correlations = calculateCorrelations(filteredMoods, filteredSleep, filteredHabitLogs, startDate);
  const recommendations = generateRecommendations(moodTrend, sleepTrend, habitSuccess);

  const insights: InsightData = {
    period: {
      days,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    },
    counts: {
      moods: filteredMoods.length,
      sleep: filteredSleep.length,
      habitLogs: filteredHabitLogs.length,
      tasks: Array.isArray(tasks)
        ? tasks.filter((t: any) => {
            const d = parseISO(t.date ?? t.created_at ?? t.createdAt ?? new Date().toISOString());
            return d instanceof Date && !isNaN(+d) && inRange(d);
          }).length
        : 0,
    },
    moodTrend,
    sleepTrend,
    habitSuccess,
    correlations,
    recommendations,
  };

  return { insights, isLoading, loading: isLoading } as const;
}

// ===== Helpers =====

function calculateStreak(logs: any[]): number {
  // Streak sur jours consécutifs (complétés)
  const byDate = new Set(
    logs
      .filter((l: any) => l.completed ?? l.is_done ?? false)
      .map((l: any) => format(parseISO(l.date ?? l.created_at ?? l.createdAt), 'yyyy-MM-dd')),
  );

  let streak = 0;
  let cursor = new Date();
  while (byDate.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

function calculateCorrelations(moods: any[], sleep: any[], habitLogs: any[], _startDate: Date): Correlation[] {
  const correlations: Correlation[] = [];

  // 1) Sommeil (qualité) -> Humeur (moyenne du lendemain)
  if (sleep.length > 5 && moods.length > 5) {
    const moodAvg = avg(moods.map((m: any) => Number(m.global_score ?? m.score ?? 0)));
    const goodSleepDays = sleep.filter((s: any) => Number(s.quality_score ?? s.quality ?? 0) >= 7);

    const moodsAfterGoodSleep = moods.filter((m: any) => {
      const prev = format(subDays(parseISO(m.date ?? m.created_at ?? m.createdAt), 1), 'yyyy-MM-dd');
      return goodSleepDays.some((s: any) => format(parseISO(s.date ?? s.created_at ?? s.createdAt), 'yyyy-MM-dd') === prev);
    });

    if (moodsAfterGoodSleep.length > 0) {
      const mAfter = avg(moodsAfterGoodSleep.map((m: any) => Number(m.global_score ?? m.score ?? 0)));
      if (mAfter > moodAvg) {
        correlations.push({
          id: 'sleep-mood',
          type: 'positive',
          strength: clamp(Math.round(((mAfter - moodAvg) / Math.max(1, moodAvg)) * 100), 1, 95),
          description: 'Sommeil de qualité ➜ humeur plus élevée le lendemain',
          insight: `Ton humeur est en moyenne +${Math.round(mAfter - moodAvg)} après une bonne nuit.`,
        });
      }
    }
  }

  // 2) Habitudes -> Humeur (corrélation simple : plus de complétions = meilleure humeur)
  if (habitLogs.length > 5 && moods.length > 5) {
    const completedByDay = new Map<string, number>();
    habitLogs.forEach((l: any) => {
      if (l.completed ?? l.is_done ?? false) {
        const d = format(parseISO(l.date ?? l.created_at ?? l.createdAt), 'yyyy-MM-dd');
        completedByDay.set(d, (completedByDay.get(d) ?? 0) + 1);
      }
    });

    const pairs: Array<[number, number]> = moods.map((m: any) => {
      const d = format(parseISO(m.date ?? m.created_at ?? m.createdAt), 'yyyy-MM-dd');
      return [completedByDay.get(d) ?? 0, Number(m.global_score ?? m.score ?? 0)];
    });

    const corr = pearson(pairs);
    if (!Number.isNaN(corr) && Math.abs(corr) >= 0.2) {
      correlations.push({
        id: 'habits-mood',
        type: corr > 0 ? 'positive' : 'negative',
        strength: clamp(Math.round(Math.abs(corr) * 100), 1, 95),
        description: 'Corrélation entre habitudes complétées et humeur du jour',
        insight: corr > 0 ? 'Plus tu complètes d’habitudes, meilleure est ton humeur.' : 'Beaucoup d’habitudes le même jour semble te fatiguer.',
      });
    }
  }

  return correlations;
}

function generateRecommendations(
  moodTrend: Array<{ date: string; score: number }>,
  sleepTrend: Array<{ date: string; totalHours: number; quality: number }>,
  habitSuccess: Array<{ habitId: string; habitName: string; successRate: number; streak: number; totalLogs: number }>,
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Sommeil : si < 7h en moyenne ou qualité < 6
  if (sleepTrend.length >= 3) {
    const avgHours = avg(sleepTrend.map((s) => s.totalHours));
    const avgQuality = avg(sleepTrend.map((s) => s.quality));
    if (avgHours < 7) {
      recommendations.push({
        id: 'sleep-more',
        category: 'sleep',
        title: 'Augmente légèrement ton temps de sommeil',
        description: 'Tu dors en moyenne < 7h. Vise 15–30 minutes de plus par nuit cette semaine.',
        priority: 'medium',
      });
    }
    if (avgQuality < 6) {
      recommendations.push({
        id: 'sleep-quality',
        category: 'sleep',
        title: 'Améliore ta qualité de sommeil',
        description: 'Qualité moyenne < 6. Essaie une routine régulière, lumière douce et pas d’écran 1h avant.',
        priority: 'medium',
      });
    }
  }

  // Humeur basse récente
  if (moodTrend.length >= 7) {
    const recent = moodTrend.slice(-7);
    const avgRecent = avg(recent.map((m) => m.score));
    if (avgRecent < 5) {
      recommendations.push({
        id: 'mood-care',
        category: 'mood',
        title: 'Prends soin de toi 💛',
        description: 'Humeur un peu basse cette semaine. Planifie 2–3 activités plaisir à faible friction.',
        priority: 'high',
      });
    }
  }

  // Habitudes : faible succès
  const low = habitSuccess.filter((h) => h.successRate < 50);
  low.slice(0, 2).forEach((h) =>
    recommendations.push({
      id: `habit-boost-${h.habitId}`,
      category: 'habits',
      title: `Rends « ${h.habitName} » plus facile`,
      description: `Taux de succès < 50%. Réduis la taille de l’action et place-la après une routine déjà en place.`,
      priority: 'medium',
    }),
  );

  // Momentum : taux élevé
  const high = habitSuccess.filter((h) => h.successRate >= 80);
  if (high.length >= 2) {
    recommendations.push({
      id: 'great-momentum',
      category: 'productivity',
      title: 'Super momentum 🚀',
      description: `${high.length} habitudes très régulières. Tu peux envisager d’en ancrer une nouvelle petite.`,
      priority: 'low',
    });
  }

  return recommendations;
}

// ===== Utils =====
function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + (Number(b) || 0), 0) / nums.length;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
// Coefficient de Pearson sur paires [x, y]
function pearson(pairs: Array<[number, number]>): number {
  const n = pairs.length;
  if (n === 0) return NaN;
  const xs = pairs.map((p) => Number(p[0]) || 0);
  const ys = pairs.map((p) => Number(p[1]) || 0);
  const mx = avg(xs);
  const my = avg(ys);
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? NaN : num / den;
}
