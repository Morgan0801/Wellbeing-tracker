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
      // Récupérer les données de gamification
      const { data: gamification } = await supabase
        .from('user_gamification')
        .select('badges, level, streak_days')
        .eq('user_id', user.id)
        .single();

      if (!gamification) return;

      const earnedBadgeIds = (gamification.badges || []).map((b: any) => b.id);

      // Récupérer les stats pour vérifier les conditions
      const { count: moodCount } = await supabase
        .from('moods')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: habitCount } = await supabase
  .from('habit_logs')
  .select('id', { count: 'exact', head: true });

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

      // Vérifier chaque badge
      const badgesToUnlock: any[] = [];

      // Premier Mood
      if (!earnedBadgeIds.includes('first_mood')     && (moodCount ?? 0) >= 1) {
        badgesToUnlock.push({
          id: 'first_mood',
          name: 'Premier Mood',
          description: 'Enregistrer son premier mood',
          emoji: '🎭',
          earned_at: new Date().toISOString(),
        });
      }

      // Mood Hebdo (7 jours consécutifs)
      if (!earnedBadgeIds.includes('mood_week')) {
        const { data: recentMoods } = await supabase
          .from('moods')
          .select('datetime')
          .eq('user_id', user.id)
          .order('datetime', { ascending: false })
          .limit(7);

        if (recentMoods && recentMoods.length >= 7) {
          const dates = recentMoods.map((m) => new Date(m.datetime).toDateString());
          const uniqueDates = [...new Set(dates)];
          if (uniqueDates.length >= 7) {
            badgesToUnlock.push({
              id: 'mood_week',
              name: 'Mood Hebdo',
              description: 'Enregistrer son mood 7 jours consécutifs',
              emoji: '📅',
              earned_at: new Date().toISOString(),
            });
          }
        }
      }

      // Maître des Habitudes
      if (!earnedBadgeIds.includes('habit_master')   && (habitCount ?? 0) >= 30) {
        badgesToUnlock.push({
          id: 'habit_master',
          name: 'Maître des Habitudes',
          description: 'Compléter 30 habitudes',
          emoji: '💪',
          earned_at: new Date().toISOString(),
        });
      }

      // Chasseur de Tâches
      if (!earnedBadgeIds.includes('task_slayer')    && (taskCount ?? 0) >= 50) {
        badgesToUnlock.push({
          id: 'task_slayer',
          name: 'Chasseur de Tâches',
          description: 'Compléter 50 tâches',
          emoji: '✅',
          earned_at: new Date().toISOString(),
        });
      }

      // Réalisateur d'Objectifs
      if (!earnedBadgeIds.includes('goal_achiever')  && (goalCount ?? 0) >= 5) {
        badgesToUnlock.push({
          id: 'goal_achiever',
          name: "Réalisateur d'Objectifs",
          description: 'Compléter 5 objectifs',
          emoji: '🎯',
          earned_at: new Date().toISOString(),
        });
      }

      // Guru de la Gratitude
    if (!earnedBadgeIds.includes('gratitude_guru') && (gratitudeCount ?? 0) >= 14) {
        badgesToUnlock.push({
          id: 'gratitude_guru',
          name: 'Guru de la Gratitude',
          description: 'Écrire 14 jours de gratitude',
          emoji: '🙏',
          earned_at: new Date().toISOString(),
        });
      }

      // Niveau 5
      if (!earnedBadgeIds.includes('level_5') && gamification.level >= 5) {
        badgesToUnlock.push({
          id: 'level_5',
          name: 'Niveau 5',
          description: 'Atteindre le niveau 5',
          emoji: '⭐',
          earned_at: new Date().toISOString(),
        });
      }

      // Niveau 10
      if (!earnedBadgeIds.includes('level_10') && gamification.level >= 10) {
        badgesToUnlock.push({
          id: 'level_10',
          name: 'Niveau 10',
          description: 'Atteindre le niveau 10',
          emoji: '🌟',
          earned_at: new Date().toISOString(),
        });
      }

      // Série de 7
      if (!earnedBadgeIds.includes('streak_7') && gamification.streak_days >= 7) {
        badgesToUnlock.push({
          id: 'streak_7',
          name: 'Série de 7',
          description: "7 jours d'activité consécutifs",
          emoji: '🔥',
          earned_at: new Date().toISOString(),
        });
      }

      // Série de 30
      if (!earnedBadgeIds.includes('streak_30') && gamification.streak_days >= 30) {
        badgesToUnlock.push({
          id: 'streak_30',
          name: 'Série de 30',
          description: "30 jours d'activité consécutifs",
          emoji: '🏆',
          earned_at: new Date().toISOString(),
        });
      }

      // Débloquer tous les nouveaux badges
      if (badgesToUnlock.length > 0) {
        const updatedBadges = [...(gamification.badges || []), ...badgesToUnlock];
        await supabase
          .from('user_gamification')
          .update({ badges: updatedBadges })
          .eq('user_id', user.id);

        // Invalider le cache pour recharger les données
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
