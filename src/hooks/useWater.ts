import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { WaterLog, WaterGoal } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function useWater() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Récupérer les logs d'eau d'aujourd'hui
  const { data: todayLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['water-logs', user?.id, today],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      return data as WaterLog[];
    },
    enabled: !!user?.id,
  });

  // Récupérer l'objectif de l'utilisateur
  const { data: goal } = useQuery({
    queryKey: ['water-goal', user?.id],
    queryFn: async () => {
      if (!user?.id) return { daily_goal_ml: 2000 };
      
      const { data, error } = await supabase
        .from('water_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return (data as WaterGoal) || { daily_goal_ml: 2000 };
    },
    enabled: !!user?.id,
  });

  // Total d'aujourd'hui
  const todayTotal = todayLogs.reduce((sum, log) => sum + log.amount_ml, 0);
  const dailyGoal = goal?.daily_goal_ml || 2000;
  const progressPercent = Math.min(100, Math.round((todayTotal / dailyGoal) * 100));
  const isGoalReached = todayTotal >= dailyGoal;

  // Ajouter de l'eau
  const addWater = useMutation({
    mutationFn: async (amount_ml: number = 250) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('water_logs')
        .insert({
          user_id: user.id,
          date: today,
          amount_ml,
        });

      if (error) throw error;

      // XP pour avoir atteint l'objectif
      const newTotal = todayTotal + amount_ml;
      if (newTotal >= dailyGoal && todayTotal < dailyGoal) {
        await supabase.rpc('add_xp', {
          p_user_id: user.id,
          p_action_type: 'water_goal',
          p_xp_amount: 10,
          p_description: 'Objectif eau atteint !',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-logs'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      toast.success(`+${250}ml ajoutés`);
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout');
    },
  });

  // Supprimer un log
  const removeWater = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('water_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-logs'] });
    },
  });

  // Mettre à jour l'objectif
  const updateGoal = useMutation({
    mutationFn: async (newGoal: number) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('water_goals')
        .upsert({
          user_id: user.id,
          daily_goal_ml: newGoal,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-goal'] });
      toast.success('Objectif mis à jour');
    },
  });

  return {
    todayLogs,
    isLoadingLogs,
    todayTotal,
    dailyGoal,
    progressPercent,
    isGoalReached,
    addWater,
    removeWater,
    updateGoal,
  };
}
