import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Habit, HabitLog } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { startOfDay, subDays } from 'date-fns';
import { useGamificationTriggers } from './useGamificationTriggers';

export function useHabits() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { checkAndUnlockBadges } = useGamificationTriggers();

  // Récupérer toutes les habitudes
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user?.id,
  });

  // Ajouter une habitude
  const addHabitMutation = useMutation({
    mutationFn: async (habitData: Omit<Habit, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('habits')
        .insert([
          {
            user_id: user?.id,
            ...habitData,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  // Modifier une habitude
  const updateHabitMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Habit> }) => {
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  // Supprimer une habitude
  const deleteHabitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habitLogs'] });
    },
  });

  // Récupérer les logs d'habitudes (60 derniers jours au lieu de 30)
  const { data: habitLogs = [] } = useQuery({
    queryKey: ['habitLogs', user?.id],
    queryFn: async () => {
      const sixtyDaysAgo = startOfDay(subDays(new Date(), 60)).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('date', sixtyDaysAgo)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as HabitLog[];
    },
    enabled: !!user?.id,
  });

  // Logger une habitude (NOUVEAU : toujours créer un nouveau log, ne jamais update)
  const logHabitMutation = useMutation({
    mutationFn: async ({
      habitId,
      date,
      completed,
      quantity,
    }: {
      habitId: string;
      date: string;
      completed: boolean;
      quantity?: number;
    }) => {
      // On crée TOUJOURS un nouveau log (multi-logs par jour)
      const { data, error } = await supabase
        .from('habit_logs')
        .insert([
          {
            habit_id: habitId,
            date,
            completed,
            quantity,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
  queryClient.invalidateQueries({ queryKey: ['habitLogs'] });
  
  await supabase.rpc('add_xp', {
    p_user_id: user?.id,
    p_action_type: 'habit_completed',
    p_xp_amount: 15,
    p_description: 'Habitude complétée',
  });
  queryClient.invalidateQueries({ queryKey: ['gamification'] });
  await checkAndUnlockBadges();
},
  });

  // NOUVEAU : Supprimer un log spécifique
  const deleteHabitLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habitLogs'] });
    },
  });

  // Calculer le streak d'une habitude
  const calculateStreak = (habitId: string): number => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return 0;

    const logs = habitLogs.filter((log) => log.habit_id === habitId && log.completed);
    if (logs.length === 0) return 0;

    // Grouper par date (car on peut avoir plusieurs logs par jour)
    const uniqueDates = [...new Set(logs.map(l => l.date))].sort((a, b) => b.localeCompare(a));

    let streak = 0;
    const today = startOfDay(new Date());

    for (let i = 0; i < 365; i++) {
      const date = subDays(today, i).toISOString().split('T')[0];
      
      if (uniqueDates.includes(date)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  // Obtenir le log d'aujourd'hui pour une habitude (DEPRECATED - use getLogsForDate)
  const getTodayLog = (habitId: string): HabitLog | undefined => {
    const today = new Date().toISOString().split('T')[0];
    // Retourne le premier log trouvé (compatibilité)
    return habitLogs.find((log) => log.habit_id === habitId && log.date === today);
  };

  // NOUVEAU : Obtenir TOUS les logs d'une habitude pour une date donnée
  const getLogsForDate = (habitId: string, date: string): HabitLog[] => {
    return habitLogs.filter((log) => log.habit_id === habitId && log.date === date);
  };

  // Obtenir tous les logs d'une habitude spécifique
  const getHabitLogs = (habitId: string): HabitLog[] => {
    return habitLogs.filter((log) => log.habit_id === habitId);
  };

  return {
    habits,
    habitLogs,
    isLoading,
    addHabit: addHabitMutation.mutate,
    isAddingHabit: addHabitMutation.isPending,
    updateHabit: updateHabitMutation.mutate,
    deleteHabit: deleteHabitMutation.mutate,
    logHabit: logHabitMutation.mutate,
    isLoggingHabit: logHabitMutation.isPending,
    deleteHabitLog: deleteHabitLogMutation.mutate, // NOUVEAU
    calculateStreak,
    getTodayLog, // DEPRECATED mais gardé pour compatibilité
    getLogsForDate, // NOUVEAU
    getHabitLogs,
  };
}
