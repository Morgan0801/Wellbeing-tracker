import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types';
import { useAuthStore } from '@/stores/authStore';

export function useTasks() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Récupérer toutes les tâches
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user?.id,
  });

  // Ajouter une tâche
  const addTaskMutation = useMutation({
    mutationFn: async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'completed_at'>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: user?.id,
            ...taskData,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Modifier une tâche
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Supprimer une tâche
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Toggle complétion d'une tâche
  const toggleTaskMutation = useMutation({
  mutationFn: async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error('Task not found');

    const { data, error } = await supabase
      .from('tasks')
      .update({
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  onSuccess: async (data) => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    
    if (data.completed) {
      await supabase.rpc('add_xp', {
        p_user_id: user?.id,
        p_action_type: 'task_completed',
        p_xp_amount: 20,
        p_description: 'Tâche terminée',
      });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    }
  },
});

  // Déplacer une tâche vers un autre quadrant
  const moveTaskMutation = useMutation({
    mutationFn: async ({ id, quadrant }: { id: string; quadrant: 1 | 2 | 3 | 4 }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ quadrant })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Obtenir les tâches par quadrant
  const getTasksByQuadrant = (quadrant: 1 | 2 | 3 | 4) => {
    return tasks.filter((task) => task.quadrant === quadrant && !task.completed);
  };

  // Obtenir les tâches complétées
  const getCompletedTasks = () => {
    return tasks.filter((task) => task.completed);
  };

  return {
    tasks,
    isLoading,
    addTask: addTaskMutation.mutate,
    isAddingTask: addTaskMutation.isPending,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    toggleTask: toggleTaskMutation.mutate,
    moveTask: moveTaskMutation.mutate,
    getTasksByQuadrant,
    getCompletedTasks,
  };
}
