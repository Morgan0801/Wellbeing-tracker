import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { ActivityType, MoodActivity, DEFAULT_ACTIVITIES } from '@/types';
import toast from 'react-hot-toast';

export function useActivities() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Récupérer les types d'activités disponibles
  const { data: activityTypes = [], isLoading } = useQuery({
    queryKey: ['activity-types', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('activity_types')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .eq('is_active', true)
        .order('category')
        .order('name');

      if (error) throw error;
      
      // Si aucune activité n'existe, initialiser avec les defaults
      if (!data || data.length === 0) {
        return DEFAULT_ACTIVITIES.map((a, i) => ({
          ...a,
          id: `default-${i}`,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })) as ActivityType[];
      }
      
      return data as ActivityType[];
    },
    enabled: !!user?.id,
  });

  // Initialiser les activités par défaut pour un nouvel utilisateur
  const initializeDefaultActivities = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const activitiesToInsert = DEFAULT_ACTIVITIES.map(a => ({
        ...a,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from('activity_types')
        .insert(activitiesToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-types'] });
    },
  });

  // Ajouter une activité personnalisée
  const addActivityType = useMutation({
    mutationFn: async (activity: Omit<ActivityType, 'id' | 'user_id' | 'created_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('activity_types')
        .insert({
          ...activity,
          user_id: user.id,
          is_default: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-types'] });
      toast.success('Activité ajoutée !');
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout');
    },
  });

  // Désactiver une activité
  const toggleActivityType = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('activity_types')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-types'] });
    },
  });

  // Sauvegarder les activités faites pour un mood
  const saveMoodActivities = useMutation({
    mutationFn: async ({ 
      moodId, 
      activities 
    }: { 
      moodId: string; 
      activities: { activity_type_id: string; done: boolean }[] 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Supprimer les anciennes activités pour ce mood
      await supabase
        .from('mood_activities')
        .delete()
        .eq('mood_id', moodId);

      // Insérer les nouvelles
      if (activities.length > 0) {
        const { error } = await supabase
          .from('mood_activities')
          .insert(
            activities.map(a => ({
              mood_id: moodId,
              activity_type_id: a.activity_type_id,
              done: a.done,
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-activities'] });
    },
  });

  // Récupérer les activités d'un mood spécifique
  const getMoodActivities = async (moodId: string): Promise<MoodActivity[]> => {
    const { data, error } = await supabase
      .from('mood_activities')
      .select('*')
      .eq('mood_id', moodId);

    if (error) throw error;
    return data as MoodActivity[];
  };

  return {
    activityTypes,
    isLoading,
    addActivityType,
    toggleActivityType,
    saveMoodActivities,
    getMoodActivities,
    initializeDefaultActivities,
  };
}
