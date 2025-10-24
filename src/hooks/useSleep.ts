import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SleepLog } from '@/types';
import { useAuthStore } from '@/stores/authStore';

export function useSleep() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Récupérer tous les logs de sommeil
  const { data: sleepLogs = [], isLoading } = useQuery({
    queryKey: ['sleep-logs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as SleepLog[];
    },
  });

  // Ajouter un log de sommeil
  const addSleepLog = useMutation({
    mutationFn: async (sleepData: Omit<SleepLog, 'id' | 'user_id' | 'created_at'>) => {
      const currentUser = user;
      if (!currentUser) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('sleep_logs')
        .insert([{
          user_id: currentUser.id,
          date: sleepData.date,
          bedtime: sleepData.bedtime,
          wakeup_time: sleepData.wakeup_time,
          total_hours: sleepData.total_hours,
          rem_hours: sleepData.rem_hours,
          deep_hours: sleepData.deep_hours,
          avg_heart_rate: sleepData.avg_heart_rate,
          quality_score: sleepData.quality_score,
		  notes: sleepData.notes,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep-logs', user?.id] });
    },
  });

  // Mettre à jour un log de sommeil
  const updateSleepLog = useMutation({
    mutationFn: async ({ id, ...sleepData }: Partial<SleepLog> & { id: string }) => {
      const { data, error } = await supabase
        .from('sleep_logs')
        .update({
          date: sleepData.date,
          bedtime: sleepData.bedtime,
          wakeup_time: sleepData.wakeup_time,
          total_hours: sleepData.total_hours,
          rem_hours: sleepData.rem_hours,
          deep_hours: sleepData.deep_hours,
          avg_heart_rate: sleepData.avg_heart_rate,
          quality_score: sleepData.quality_score,
		  notes: sleepData.notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep-logs', user?.id] });
    },
  });

  // Supprimer un log de sommeil
  const deleteSleepLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sleep_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep-logs', user?.id] });
    },
  });

  // Calculer les moyennes
  const getAverages = () => {
    if (sleepLogs.length === 0) {
      return {
        avgTotalHours: 0,
        avgQuality: 0,
        avgHeartRate: 0,
        avgREM: 0,
        avgDeep: 0,
      };
    }

    const totals = sleepLogs.reduce((acc, log) => ({
      totalHours: acc.totalHours + (log.total_hours || 0),
      quality: acc.quality + (log.quality_score || 0),
      heartRate: acc.heartRate + (log.avg_heart_rate || 0),
      rem: acc.rem + (log.rem_hours || 0),
      deep: acc.deep + (log.deep_hours || 0),
    }), { totalHours: 0, quality: 0, heartRate: 0, rem: 0, deep: 0 });

    const count = sleepLogs.length;

    return {
      avgTotalHours: Math.round((totals.totalHours / count) * 10) / 10,
      avgQuality: Math.round((totals.quality / count) * 10) / 10,
      avgHeartRate: Math.round(totals.heartRate / count),
      avgREM: Math.round((totals.rem / count) * 10) / 10,
      avgDeep: Math.round((totals.deep / count) * 10) / 10,
    };
  };

  
  // Helpers individuels pour compatibilité avec SleepPage
  const getAverageSleep = () => getAverages().avgTotalHours;
  const getAverageQuality = () => getAverages().avgQuality;
  const getAverageREM = () => getAverages().avgREM;
  const getAverageDeep = () => getAverages().avgDeep;
  const getAverageHeartRate = () => getAverages().avgHeartRate;

  return {
    sleepLogs,
    loading: isLoading,
    addSleepLog: addSleepLog.mutate,
    isAddingSleepLog: addSleepLog.isPending,
    updateSleepLog: updateSleepLog.mutate,
    deleteSleepLog: deleteSleepLog.mutate,
    getAverages,
    getAverageSleep,
    getAverageQuality,
    getAverageREM,
    getAverageDeep,
    getAverageHeartRate,
  };
}
