import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types';
import { useAuthStore } from '@/stores/authStore';

export function useTasks() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Récupérer toutes les taches
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

  // Ajouter une tache
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

  // Modifier une tache
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

  // Supprimer une tache
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Toggle complétion d'une tache
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

      if (data?.completed) {
        await supabase.rpc('add_xp', {
          p_user_id: user?.id,
          p_action_type: 'task_completed',
          p_xp_amount: 20,
          p_description: 'Tache terminee',
        });
        queryClient.invalidateQueries({ queryKey: ['gamification'] });
        return;
      }

      await supabase.rpc('add_xp', {
        p_user_id: user?.id,
        p_action_type: 'task_uncompleted',
        p_xp_amount: -20,
        p_description: 'Tache decochee',
      });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  // Déplacer une tache vers un autre quadrant
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

  // Obtenir les taches par quadrant
  const getTasksByQuadrant = (quadrant: 1 | 2 | 3 | 4) => {
    return tasks.filter((task) => task.quadrant === quadrant && !task.completed);
  };

  // Obtenir les taches par quadrant incluant celles complétées aujourd'hui
  const getTasksByQuadrantWithToday = (quadrant: 1 | 2 | 3 | 4) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    return tasks.filter((task) => {
      if (task.quadrant !== quadrant) return false;
      if (!task.completed) return true;

      // Inclure les tâches complétées aujourd'hui
      if (task.completed_at) {
        const completedDate = new Date(task.completed_at);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === todayTime;
      }
      return false;
    });
  };

  // Obtenir les taches complétees
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
    getTasksByQuadrantWithToday,
    getCompletedTasks,
  };
}

