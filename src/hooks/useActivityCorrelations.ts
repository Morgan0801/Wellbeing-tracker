import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useMood } from './useMood';
import { subDays, format, parseISO, startOfDay } from 'date-fns';

interface ActivityCorrelation {
  activityId: string;
  activityName: string;
  activityEmoji: string;
  avgMoodWith: number;
  avgMoodWithout: number;
  difference: number;
  daysWithActivity: number;
  daysWithoutActivity: number;
  isPositive: boolean;
  significance: 'high' | 'medium' | 'low';
}

export function useActivityCorrelations(days: number = 30) {
  const user = useAuthStore((state) => state.user);
  const { moods } = useMood();

  // Récupérer les activités loggées
  const { data: moodActivitiesData = [] } = useQuery({
    queryKey: ['mood-activities-all', user?.id, days],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('mood_activities')
        .select(`
          *,
          activity_types (id, name, emoji, category)
        `)
        .gte('created_at', startDate);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Récupérer tous les types d'activités
  const { data: activityTypes = [] } = useQuery({
    queryKey: ['activity-types-all', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('activity_types')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Calculer les corrélations
  const correlations = useMemo((): ActivityCorrelation[] => {
    if (!moods.length || !activityTypes.length) return [];

    // Grouper les moods par jour
    const moodsByDay = new Map<string, number[]>();
    moods.forEach((mood) => {
      const day = format(startOfDay(parseISO(mood.datetime)), 'yyyy-MM-dd');
      if (!moodsByDay.has(day)) {
        moodsByDay.set(day, []);
      }
      moodsByDay.get(day)!.push(mood.score_global);
    });

    // Calculer la moyenne de mood par jour
    const avgMoodByDay = new Map<string, number>();
    moodsByDay.forEach((scores, day) => {
      avgMoodByDay.set(day, scores.reduce((a, b) => a + b, 0) / scores.length);
    });

    // Créer un map des activités par jour
    const activitiesByDay = new Map<string, Set<string>>();
    moodActivitiesData.forEach((ma: any) => {
      if (!ma.done) return; // Ignorer les activités non faites
      const mood = moods.find((m) => m.id === ma.mood_id);
      if (!mood) return;
      
      const day = format(startOfDay(parseISO(mood.datetime)), 'yyyy-MM-dd');
      if (!activitiesByDay.has(day)) {
        activitiesByDay.set(day, new Set());
      }
      activitiesByDay.get(day)!.add(ma.activity_type_id);
    });

    // Calculer les corrélations pour chaque activité
    return activityTypes.map((activity: any) => {
      const daysWithActivity: number[] = [];
      const daysWithoutActivity: number[] = [];

      avgMoodByDay.forEach((avgMood, day) => {
        const dayActivities = activitiesByDay.get(day);
        if (dayActivities?.has(activity.id)) {
          daysWithActivity.push(avgMood);
        } else {
          daysWithoutActivity.push(avgMood);
        }
      });

      const avgMoodWith = daysWithActivity.length > 0
        ? daysWithActivity.reduce((a, b) => a + b, 0) / daysWithActivity.length
        : 0;
      
      const avgMoodWithout = daysWithoutActivity.length > 0
        ? daysWithoutActivity.reduce((a, b) => a + b, 0) / daysWithoutActivity.length
        : 0;

      const difference = avgMoodWith - avgMoodWithout;
      
      // Déterminer la significativité basée sur le nombre de données
      let significance: 'high' | 'medium' | 'low' = 'low';
      if (daysWithActivity.length >= 10 && daysWithoutActivity.length >= 10) {
        significance = 'high';
      } else if (daysWithActivity.length >= 5 && daysWithoutActivity.length >= 5) {
        significance = 'medium';
      }

      return {
        activityId: activity.id,
        activityName: activity.name,
        activityEmoji: activity.emoji,
        avgMoodWith: Math.round(avgMoodWith * 10) / 10,
        avgMoodWithout: Math.round(avgMoodWithout * 10) / 10,
        difference: Math.round(difference * 10) / 10,
        daysWithActivity: daysWithActivity.length,
        daysWithoutActivity: daysWithoutActivity.length,
        isPositive: difference > 0,
        significance,
      };
    }).filter((c) => c.daysWithActivity > 0); // Filtrer les activités jamais loggées
  }, [moods, moodActivitiesData, activityTypes]);

  // Trier par différence absolue (impact le plus fort)
  const sortedCorrelations = useMemo(() => {
    return [...correlations].sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }, [correlations]);

  // Top activités positives
  const positiveCorrelations = useMemo(() => {
    return sortedCorrelations
      .filter((c) => c.isPositive && c.significance !== 'low')
      .slice(0, 5);
  }, [sortedCorrelations]);

  // Top activités négatives
  const negativeCorrelations = useMemo(() => {
    return sortedCorrelations
      .filter((c) => !c.isPositive && c.significance !== 'low')
      .slice(0, 5);
  }, [sortedCorrelations]);

  return {
    correlations: sortedCorrelations,
    positiveCorrelations,
    negativeCorrelations,
    hasEnoughData: correlations.some((c) => c.significance !== 'low'),
  };
}
