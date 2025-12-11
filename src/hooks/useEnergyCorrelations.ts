import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useMood } from './useMood';
import { subDays, format, parseISO, startOfDay } from 'date-fns';

interface EnergyActivityCorrelation {
  activityId: string;
  activityName: string;
  activityEmoji: string;
  avgEnergyWith: number;
  avgEnergyWithout: number;
  difference: number;
  count: number;
  isPositive: boolean;
}

export function useEnergyCorrelations(days: number = 30) {
  const user = useAuthStore((state) => state.user);
  const { moods } = useMood();

  // Filtrer les moods avec niveau d'énergie
  const moodsWithEnergy = useMemo(() => {
    return moods.filter(m => m.energy_level !== undefined && m.energy_level !== null);
  }, [moods]);

  // Récupérer les activités
  const { data: moodActivitiesData = [] } = useQuery({
    queryKey: ['mood-activities-energy', user?.id, days],
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
    enabled: !!user?.id && moodsWithEnergy.length > 0,
  });

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

  // Calculer moyenne d'énergie
  const averageEnergy = useMemo(() => {
    if (moodsWithEnergy.length === 0) return 0;
    const sum = moodsWithEnergy.reduce((acc, m) => acc + (m.energy_level || 0), 0);
    return Math.round((sum / moodsWithEnergy.length) * 10) / 10;
  }, [moodsWithEnergy]);

  // Calculer tendance (7 derniers jours vs 7 jours précédents)
  const energyTrend = useMemo(() => {
    if (moodsWithEnergy.length < 14) return 0;

    const now = new Date();
    const last7Days = subDays(now, 7);
    const previous7Days = subDays(now, 14);

    const recentMoods = moodsWithEnergy.filter(m => {
      const date = parseISO(m.datetime);
      return date >= last7Days;
    });

    const previousMoods = moodsWithEnergy.filter(m => {
      const date = parseISO(m.datetime);
      return date >= previous7Days && date < last7Days;
    });

    if (recentMoods.length === 0 || previousMoods.length === 0) return 0;

    const recentAvg = recentMoods.reduce((acc, m) => acc + (m.energy_level || 0), 0) / recentMoods.length;
    const previousAvg = previousMoods.reduce((acc, m) => acc + (m.energy_level || 0), 0) / previousMoods.length;

    return Math.round((recentAvg - previousAvg) * 10) / 10;
  }, [moodsWithEnergy]);

  // Corrélations activités-énergie
  const activityCorrelations = useMemo((): EnergyActivityCorrelation[] => {
    if (moodsWithEnergy.length === 0 || activityTypes.length === 0) return [];

    // Grouper par jour
    const energyByDay = new Map<string, number[]>();
    moodsWithEnergy.forEach((mood) => {
      const day = format(startOfDay(parseISO(mood.datetime)), 'yyyy-MM-dd');
      if (!energyByDay.has(day)) {
        energyByDay.set(day, []);
      }
      energyByDay.get(day)!.push(mood.energy_level || 0);
    });

    const avgEnergyByDay = new Map<string, number>();
    energyByDay.forEach((energies, day) => {
      avgEnergyByDay.set(day, energies.reduce((a, b) => a + b, 0) / energies.length);
    });

    // Map des activités par jour
    const activitiesByDay = new Map<string, Set<string>>();
    moodActivitiesData.forEach((ma: any) => {
      if (!ma.done) return;
      const mood = moodsWithEnergy.find((m) => m.id === ma.mood_id);
      if (!mood) return;

      const day = format(startOfDay(parseISO(mood.datetime)), 'yyyy-MM-dd');
      if (!activitiesByDay.has(day)) {
        activitiesByDay.set(day, new Set());
      }
      activitiesByDay.get(day)!.add(ma.activity_type_id);
    });

    // Calculer corrélations
    return activityTypes.map((activity: any) => {
      const energyWith: number[] = [];
      const energyWithout: number[] = [];

      avgEnergyByDay.forEach((avgEnergy, day) => {
        const dayActivities = activitiesByDay.get(day);
        if (dayActivities?.has(activity.id)) {
          energyWith.push(avgEnergy);
        } else {
          energyWithout.push(avgEnergy);
        }
      });

      if (energyWith.length === 0) return null;

      const avgEnergyWith = energyWith.reduce((a, b) => a + b, 0) / energyWith.length;
      const avgEnergyWithout = energyWithout.length > 0
        ? energyWithout.reduce((a, b) => a + b, 0) / energyWithout.length
        : 0;

      const difference = avgEnergyWith - avgEnergyWithout;

      return {
        activityId: activity.id,
        activityName: activity.name,
        activityEmoji: activity.emoji,
        avgEnergyWith: Math.round(avgEnergyWith * 10) / 10,
        avgEnergyWithout: Math.round(avgEnergyWithout * 10) / 10,
        difference: Math.round(difference * 10) / 10,
        count: energyWith.length,
        isPositive: difference > 0,
      };
    }).filter((c): c is EnergyActivityCorrelation => c !== null && c.count >= 3);
  }, [moodsWithEnergy, moodActivitiesData, activityTypes]);

  // Top boosters et drainers
  const topEnergyBoosters = useMemo(() => {
    return [...activityCorrelations]
      .filter(c => c.isPositive && c.difference >= 0.5)
      .sort((a, b) => b.difference - a.difference)
      .slice(0, 5);
  }, [activityCorrelations]);

  const topEnergyDrainers = useMemo(() => {
    return [...activityCorrelations]
      .filter(c => !c.isPositive && c.difference <= -0.5)
      .sort((a, b) => a.difference - b.difference)
      .slice(0, 5);
  }, [activityCorrelations]);

  const hasSufficientData = moodsWithEnergy.length >= 5;

  return {
    averageEnergy,
    energyTrend,
    activityCorrelations,
    topEnergyBoosters,
    topEnergyDrainers,
    hasSufficientData,
  };
}
