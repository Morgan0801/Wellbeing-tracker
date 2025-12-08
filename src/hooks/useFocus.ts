import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { FocusSession, SessionType } from '@/types';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

export function useFocus() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Récupérer les sessions récentes (7 jours)
  const { data: recentSessions = [], isLoading } = useQuery({
    queryKey: ['focus-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startDate)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data as FocusSession[];
    },
    enabled: !!user?.id,
  });

  // Démarrer une nouvelle session
  const startSession = useMutation({
    mutationFn: async ({ 
      durationMinutes = 25, 
      sessionType = 'pomodoro' as SessionType,
      taskId,
    }: { 
      durationMinutes?: number; 
      sessionType?: SessionType;
      taskId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          task_id: taskId,
          start_time: new Date().toISOString(),
          duration_minutes: durationMinutes,
          session_type: sessionType,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FocusSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
    },
    onError: () => {
      toast.error('Erreur lors du démarrage de la session');
    },
  });

  // Terminer une session
  const completeSession = useMutation({
    mutationFn: async ({ id, completed = true, notes }: { id: string; completed?: boolean; notes?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('focus_sessions')
        .update({
          end_time: new Date().toISOString(),
          completed,
          notes,
        })
        .eq('id', id);

      if (error) throw error;

      // Ajouter XP si complété
      if (completed) {
        await supabase.rpc('add_xp', {
          p_user_id: user.id,
          p_action_type: 'focus_session',
          p_xp_amount: 15,
          p_description: 'Session Pomodoro complétée',
        });
      }
    },
    onSuccess: (_, { completed }) => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      if (completed) {
        toast.success('Session terminée ! +15 XP');
      }
    },
  });

  // Statistiques
  const todayStats = {
    sessionsCompleted: recentSessions.filter(s => 
      s.completed && 
      format(new Date(s.start_time), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
      s.session_type === 'pomodoro'
    ).length,
    minutesFocused: recentSessions
      .filter(s => 
        s.completed && 
        format(new Date(s.start_time), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
        s.session_type === 'pomodoro'
      )
      .reduce((sum, s) => sum + s.duration_minutes, 0),
  };

  const weekStats = {
    sessionsCompleted: recentSessions.filter(s => 
      s.completed && s.session_type === 'pomodoro'
    ).length,
    minutesFocused: recentSessions
      .filter(s => s.completed && s.session_type === 'pomodoro')
      .reduce((sum, s) => sum + s.duration_minutes, 0),
  };

  return {
    recentSessions,
    isLoading,
    startSession,
    completeSession,
    todayStats,
    weekStats,
  };
}
