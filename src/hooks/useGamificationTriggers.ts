import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';

export function useGamificationTriggers() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const checkAndUnlockBadges = async () => {
    if (!user?.id) return;

    try {
      const { data: gamification } = await supabase
        .from('user_gamification')
        .select('badges, level, streak_days')
        .eq('user_id', user.id)
        .single();

      if (!gamification) return;

      const existingBadges = gamification.badges || [];
      const existingMap = new Map(existingBadges.map((badge: any) => [badge.id, badge]));

      const { count: moodCount } = await supabase
        .from('moods')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: habitCount } = await supabase
        .from('habit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: taskCount } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true);

      const { count: goalCount } = await supabase
        .from('goals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true);

      const { count: gratitudeCount } = await supabase
        .from('gratitude_entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { data: recentMoods } = await supabase
        .from('moods')
        .select('datetime')
        .eq('user_id', user.id)
        .order('datetime', { ascending: false })
        .limit(7);

      let hasMoodWeek = false;
      if (recentMoods && recentMoods.length >= 7) {
        const dates = recentMoods.map((m) => new Date(m.datetime).toDateString());
        const uniqueDates = [...new Set(dates)];
        hasMoodWeek = uniqueDates.length >= 7;
      }

      const managedBadgeDefinitions = [
        {
          id: 'first_mood',
          name: 'Premier Mood',
          description: 'Enregistrer son premier mood',
          emoji: '🎭',
          eligible: () => (moodCount ?? 0) >= 1,
        },
        {
          id: 'mood_week',
          name: 'Mood Hebdo',
          description: 'Enregistrer son mood 7 jours consecutifs',
          emoji: '📅',
          eligible: () => hasMoodWeek,
        },
        {
          id: 'habit_master',
          name: 'Maitre des Habitudes',
          description: 'Completer 30 habitudes',
          emoji: '💪',
          eligible: () => (habitCount ?? 0) >= 30,
        },
        {
          id: 'task_slayer',
          name: 'Chasseur de Taches',
          description: 'Completer 50 taches',
          emoji: '✅',
          eligible: () => (taskCount ?? 0) >= 50,
        },
        {
          id: 'goal_achiever',
          name: "Realisateur d'Objectifs",
          description: 'Completer 5 objectifs',
          emoji: '🎯',
          eligible: () => (goalCount ?? 0) >= 5,
        },
        {
          id: 'gratitude_guru',
          name: 'Guru de la Gratitude',
          description: 'Ecrire 14 jours de gratitude',
          emoji: '🙏',
          eligible: () => (gratitudeCount ?? 0) >= 14,
        },
        {
          id: 'level_5',
          name: 'Niveau 5',
          description: 'Atteindre le niveau 5',
          emoji: '⭐',
          eligible: () => gamification.level >= 5,
        },
        {
          id: 'level_10',
          name: 'Niveau 10',
          description: 'Atteindre le niveau 10',
          emoji: '🌟',
          eligible: () => gamification.level >= 10,
        },
        {
          id: 'streak_7',
          name: 'Serie de 7',
          description: "7 jours d'activite consecutifs",
          emoji: '🔥',
          eligible: () => gamification.streak_days >= 7,
        },
        {
          id: 'streak_30',
          name: 'Serie de 30',
          description: "30 jours d'activite consecutifs",
          emoji: '🏆',
          eligible: () => gamification.streak_days >= 30,
        },
      ];

      const managedBadgeIds = new Set(managedBadgeDefinitions.map((badge) => badge.id));
      const preservedBadges = existingBadges.filter((badge: any) => !managedBadgeIds.has(badge.id));
      const updatedBadges = [...preservedBadges];
      const now = new Date().toISOString();

      for (const badge of managedBadgeDefinitions) {
        if (!badge.eligible()) continue;

        const existing = existingMap.get(badge.id);
        if (existing) {
          updatedBadges.push(existing);
        } else {
          updatedBadges.push({ ...badge, earned_at: now });
        }
      }

      if (JSON.stringify(existingBadges) !== JSON.stringify(updatedBadges)) {
        await supabase
          .from('user_gamification')
          .update({ badges: updatedBadges })
          .eq('user_id', user.id);

        queryClient.invalidateQueries({ queryKey: ['gamification'] });
      }
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  // Vérifier les badges à chaque changement important
  useEffect(() => {
    checkAndUnlockBadges();
  }, [user?.id]);

  return { checkAndUnlockBadges };
}

