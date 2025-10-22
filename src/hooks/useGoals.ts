import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Goal, GoalMilestone } from '@/types/phase4-types';
import { useAuthStore } from '@/stores/authStore';

export function useGoals() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // RÃ©cupÃ©rer tous les objectifs
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user?.id,
  });

  // RÃ©cupÃ©rer tous les milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ['goal_milestones', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goal_milestones')
        .select('*')
        .order('created_at', { ascending: true});

      if (error) throw error;
      return data as GoalMilestone[];
    },
    enabled: !!user?.id,
  });

  // Ajouter un objectif
  const addGoalMutation = useMutation({
    mutationFn: async (goalData: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'completed' | 'completed_at'>) => {
      const { data, error } = await supabase
        .from('goals')
        .insert([{ user_id: user?.id, ...goalData, completed: false }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  // Modifier un objectif
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Goal> }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  // Supprimer un objectif
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal_milestones'] });
    },
  });

  // Toggle complÃ©tÃ© d'un objectif
  const toggleGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const goal = goals.find((g) => g.id === id);
      if (!goal) throw new Error('Goal not found');

      const { data, error } = await supabase
        .from('goals')
        .update({
          completed: !goal.completed,
          completed_at: !goal.completed ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  // Ajouter un milestone
  const addMilestoneMutation = useMutation({
    mutationFn: async (milestoneData: Omit<GoalMilestone, 'id' | 'created_at' | 'completed' | 'completed_at'>) => {
      const { data, error} = await supabase
        .from('goal_milestones')
        .insert([{ ...milestoneData, completed: false }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal_milestones'] });
    },
  });

  // Toggle milestone
  const toggleMilestoneMutation = useMutation({
    mutationFn: async (id: string) => {
      const milestone = milestones.find((m) => m.id === id);
      if (!milestone) throw new Error('Milestone not found');

      const { data, error } = await supabase
        .from('goal_milestones')
        .update({
          completed: !milestone.completed,
          completed_at: !milestone.completed ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal_milestones'] });
    },
  });

  // Supprimer un milestone
  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goal_milestones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal_milestones'] });
    },
  });

  // Obtenir les milestones d'un objectif
  const getMilestones = (goalId: string) => {
    return milestones.filter((m) => m.goal_id === goalId);
  };

  return {
    goals,
    milestones,
    loading: isLoading,
    addGoal: addGoalMutation.mutate,
    updateGoal: updateGoalMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,
    toggleGoal: toggleGoalMutation.mutate,
    addMilestone: addMilestoneMutation.mutate,
    toggleMilestone: toggleMilestoneMutation.mutate,
    deleteMilestone: deleteMilestoneMutation.mutate,
    getMilestones,
  };
}
