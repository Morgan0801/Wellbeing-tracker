import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useMood } from './useMood';
import { subDays, parseISO, format, startOfDay } from 'date-fns';

interface ActivityCombination {
  activities: string[];
  emojis: string[];
  avgMood: number;
  avgEnergy: number;
  count: number;
}

interface SocialPattern {
  hasSocial: boolean;
  avgMood: number;
  avgEnergy: number;
  count: number;
  mainActivities: string[];
}

export function useAdvancedMoodInsights(days: number = 30) {
  const user = useAuthStore((state) => state.user);
  const { moods } = useMood();

  // Récupérer les activités
  const { data: moodActivitiesData = [] } = useQuery({
    queryKey: ['mood-activities-advanced', user?.id, days],
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

  // Pattern social vs seul
  const socialPatterns = useMemo((): { social: SocialPattern | null; alone: SocialPattern | null } => {
    if (moods.length < 5) return { social: null, alone: null };

    const recentMoods = moods.filter(m => parseISO(m.datetime) >= subDays(new Date(), days));

    const socialActivities = ['Famille', 'Amis', 'Couple', 'Sortie'];
    const socialMoods: number[] = [];
    const socialEnergies: number[] = [];
    const aloneMoods: number[] = [];
    const aloneEnergies: number[] = [];
    const socialActSet = new Set<string>();
    const aloneActSet = new Set<string>();

    recentMoods.forEach(mood => {
      const moodActivities = moodActivitiesData
        .filter((ma: any) => ma.mood_id === mood.id && ma.done)
        .map((ma: any) => ma.activity_types?.name)
        .filter(Boolean);

      const hasSocial = moodActivities.some(act => socialActivities.includes(act));

      if (hasSocial) {
        socialMoods.push(mood.score_global);
        if (mood.energy_level) socialEnergies.push(mood.energy_level);
        moodActivities.forEach(act => socialActSet.add(act));
      } else if (moodActivities.length > 0) {
        aloneMoods.push(mood.score_global);
        if (mood.energy_level) aloneEnergies.push(mood.energy_level);
        moodActivities.forEach(act => aloneActSet.add(act));
      }
    });

    const social = socialMoods.length >= 3 ? {
      hasSocial: true,
      avgMood: Math.round((socialMoods.reduce((a, b) => a + b, 0) / socialMoods.length) * 10) / 10,
      avgEnergy: socialEnergies.length > 0
        ? Math.round((socialEnergies.reduce((a, b) => a + b, 0) / socialEnergies.length) * 10) / 10
        : 0,
      count: socialMoods.length,
      mainActivities: Array.from(socialActSet).slice(0, 3),
    } : null;

    const alone = aloneMoods.length >= 3 ? {
      hasSocial: false,
      avgMood: Math.round((aloneMoods.reduce((a, b) => a + b, 0) / aloneMoods.length) * 10) / 10,
      avgEnergy: aloneEnergies.length > 0
        ? Math.round((aloneEnergies.reduce((a, b) => a + b, 0) / aloneEnergies.length) * 10) / 10
        : 0,
      count: aloneMoods.length,
      mainActivities: Array.from(aloneActSet).slice(0, 3),
    } : null;

    return { social, alone };
  }, [moods, moodActivitiesData, days]);

  // Combinaisons d'activités gagnantes
  const winningCombinations = useMemo((): ActivityCombination[] => {
    if (moods.length < 10) return [];

    const recentMoods = moods.filter(m => parseISO(m.datetime) >= subDays(new Date(), days));

    // Grouper par jour
    const moodsByDay = new Map<string, typeof recentMoods>();
    recentMoods.forEach(mood => {
      const day = format(startOfDay(parseISO(mood.datetime)), 'yyyy-MM-dd');
      if (!moodsByDay.has(day)) moodsByDay.set(day, []);
      moodsByDay.get(day)!.push(mood);
    });

    const combinations = new Map<string, { moods: number[]; energies: number[]; activities: string[]; emojis: string[] }>();

    moodsByDay.forEach((dayMoods) => {
      const dayActivities = moodActivitiesData
        .filter((ma: any) => {
          const mood = dayMoods.find(m => m.id === ma.mood_id);
          return mood && ma.done;
        })
        .map((ma: any) => ({
          name: ma.activity_types?.name,
          emoji: ma.activity_types?.emoji,
        }))
        .filter(a => a.name);

      if (dayActivities.length >= 2) {
        const actNames = [...new Set(dayActivities.map(a => a.name))].sort();
        const actEmojis = [...new Set(dayActivities.map(a => a.emoji))];
        const key = actNames.join('+');

        if (!combinations.has(key)) {
          combinations.set(key, { moods: [], energies: [], activities: actNames, emojis: actEmojis });
        }

        const avgMood = dayMoods.reduce((sum, m) => sum + m.score_global, 0) / dayMoods.length;
        const energyMoods = dayMoods.filter(m => m.energy_level);
        const avgEnergy = energyMoods.length > 0
          ? energyMoods.reduce((sum, m) => sum + (m.energy_level || 0), 0) / energyMoods.length
          : 0;

        combinations.get(key)!.moods.push(avgMood);
        if (avgEnergy > 0) combinations.get(key)!.energies.push(avgEnergy);
      }
    });

    return Array.from(combinations.entries())
      .filter(([_, data]) => data.moods.length >= 2)
      .map(([_, data]) => ({
        activities: data.activities,
        emojis: data.emojis,
        avgMood: Math.round((data.moods.reduce((a, b) => a + b, 0) / data.moods.length) * 10) / 10,
        avgEnergy: data.energies.length > 0
          ? Math.round((data.energies.reduce((a, b) => a + b, 0) / data.energies.length) * 10) / 10
          : 0,
        count: data.moods.length,
      }))
      .filter(c => c.avgMood >= 7)
      .sort((a, b) => b.avgMood - a.avgMood)
      .slice(0, 3);
  }, [moods, moodActivitiesData, days]);

  return {
    socialPatterns,
    winningCombinations,
    hasSufficientData: moods.length >= 5,
  };
}
