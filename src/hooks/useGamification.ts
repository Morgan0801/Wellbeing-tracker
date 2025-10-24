import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { UserGamification, Quest } from '@/types/phase5-types';
import { PHASE5_BADGES } from '@/types/phase5-types';
import { calculateLevel, levelProgress } from '@/types/phase4-types';

export function useGamification() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Récupérer les données de gamification
  const { data: gamification, isLoading } = useQuery({
    queryKey: ['gamification', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      /* auth via store */

      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        const defaultData = {
          user_id: user?.id,
          total_xp: 0,
          level: 1,
          badges: [],
          streak_days: 0,
          last_activity_date: new Date().toISOString().split('T')[0],
        };

        const { data: newData, error: insertError } = await supabase
          .from('user_gamification')
          .insert([defaultData])
          .select()
          .single();

        if (insertError) throw insertError;
        return newData as UserGamification;
      }

      return data as UserGamification;
    },
  });

  
  // Historique XP de l'utilisateur
  const { data: xpHistory = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['xp-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('xp_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });
// Récupérer les quêtes actives
  const { data: activeQuests = [] } = useQuery({
    queryKey: ['active-quests'],
    queryFn: async (): Promise<Quest[]> => {
      /* auth via store */

      // Générer des quêtes quotidiennes/hebdomadaires/mensuelles
      const quests: Quest[] = [
        {
          id: 'daily-1',
          type: 'daily',
          title: 'Complète 3 habitudes',
          description: 'Termine 3 habitudes aujourd\'hui',
          xp_reward: 30,
          progress: 0, // Calculé dynamiquement
          target: 3,
          completed: false,
        },
        {
          id: 'daily-2',
          type: 'daily',
          title: 'Enregistre ton humeur',
          description: 'Partage comment tu te sens aujourd\'hui',
          xp_reward: 15,
          progress: 0,
          target: 1,
          completed: false,
        },
        {
          id: 'weekly-1',
          type: 'weekly',
          title: 'Semaine complète',
          description: 'Log ton mood 7 jours de suite',
          xp_reward: 100,
          progress: 0,
          target: 7,
          completed: false,
        },
        {
          id: 'monthly-1',
          type: 'monthly',
          title: 'Objectifs du mois',
          description: 'Atteins tous tes objectifs mensuels',
          xp_reward: 500,
          progress: 0,
          target: 1,
          completed: false,
        },
      ];

      return quests;
    },
  });

  // Ajouter de l'XP
  const addXP = useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      /* auth via store */

      if (!gamification) throw new Error('Gamification data not loaded');

      const newTotalXP = gamification.total_xp + amount;
      const newLevel = calculateLevel(newTotalXP);

      const { data, error } = await supabase
        .from('user_gamification')
        .update({
          total_xp: newTotalXP,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      // Enregistrer l'historique XP
      await supabase.from('xp_history').insert([{
        user_id: user?.id,
        action_type: reason,
        xp_gained: amount,
        description: reason,
      }]);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      queryClient.invalidateQueries({ queryKey: ['xp-history'] });
    },
  });

  // Débloquer un badge
  const unlockBadge = useMutation({
    mutationFn: async (badgeId: string) => {
      /* auth via store */

      if (!gamification) throw new Error('Gamification data not loaded');

      const badge = PHASE5_BADGES.find(b => b.id === badgeId);
      if (!badge) throw new Error('Badge not found');

      const existingBadges = gamification.badges || [];
      
      if (existingBadges.some((b: any) => b.id === badgeId)) {
        throw new Error('Badge already unlocked');
      }

      const newBadge = {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        emoji: badge.emoji,
        earned_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_gamification')
        .update({
          badges: [...existingBadges, newBadge],
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      // Bonus XP pour le badge
      await addXP.mutateAsync({ amount: 50, reason: `Badge débloqué: ${badge.name}` });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  // Mettre à jour la streak
  const updateStreak = useMutation({
    mutationFn: async () => {
      /* auth via store */

      if (!gamification) throw new Error('Gamification data not loaded');

      const today = new Date().toISOString().split('T')[0];
      const lastActivity = gamification.last_activity_date;

      if (!lastActivity || lastActivity === today) {
        return gamification;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = gamification.streak_days;

      if (lastActivity === yesterdayStr) {
        // Continuation de la streak
        newStreak += 1;
      } else {
        // Streak cassée
        newStreak = 1;
      }

      const { data, error } = await supabase
        .from('user_gamification')
        .update({
          streak_days: newStreak,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      // Bonus XP pour la streak
      if (newStreak % 7 === 0) {
        await addXP.mutateAsync({ amount: 50, reason: `Streak de ${newStreak} jours !` });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  // Calculer la progression vers le niveau suivant
  const getNextLevelProgress = () => {
    if (!gamification) return 0;
    return levelProgress(gamification.total_xp, gamification.level);
  };

  // Vérifier si un badge peut être débloqué
  const checkBadgeUnlock = (badgeId: string, currentProgress: number): boolean => {
    if (!gamification) return false;
    
    const badge = PHASE5_BADGES.find(b => b.id === badgeId);
    if (!badge || !badge.target) return false;

    const alreadyUnlocked = gamification.badges.some((b: any) => b.id === badgeId);
    if (alreadyUnlocked) return false;

    return currentProgress >= badge.target;
  };

  return {
    gamification,
    activeQuests,
    xpHistory,
    allBadges: PHASE5_BADGES,
    loading: isLoading || isHistoryLoading,
    addXP: addXP.mutate,
    unlockBadge: unlockBadge.mutate,
    updateStreak: updateStreak.mutate,
    getNextLevelProgress,
    checkBadgeUnlock,
  };
}
