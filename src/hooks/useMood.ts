import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MoodLog, DomainImpact } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationTriggers } from './useGamificationTriggers';

interface AddMoodParams {
  score_global: number;
  emotions: string[];
  note?: string;
  weather?: any;
  domains?: DomainImpact[];
}

interface UpdateMoodParams {
  id: string;
  updates: Partial<AddMoodParams>;
}

export function useMood() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { checkAndUnlockBadges } = useGamificationTriggers();

  const { data: moods = [], isLoading } = useQuery({
    queryKey: ['moods', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', user?.id)
        .order('datetime', { ascending: false });

      if (error) throw error;
      return data as MoodLog[];
    },
    enabled: !!user?.id,
  });

  const addMoodMutation = useMutation({
    mutationFn: async (moodData: AddMoodParams) => {
      const { data, error } = await supabase
        .from('moods')
        .insert([
          {
            user_id: user?.id,
            datetime: new Date().toISOString(),
            score_global: moodData.score_global,
            emotions: moodData.emotions,
            note: moodData.note,
            weather: moodData.weather,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Ajouter les mood_domains si fournis
      if (moodData.domains && moodData.domains.length > 0) {
        const domainImpacts = moodData.domains.map((d) => ({
          mood_id: data.id,
          domain: d.domain,
          impact: d.impact,
        }));

        const { error: domainError } = await supabase
          .from('mood_domains')
          .insert(domainImpacts);

        if (domainError) throw domainError;
      }

      // Ajouter XP
      await supabase.rpc('add_xp', {
        p_user_id: user?.id,
        p_action_type: 'mood_log',
        p_xp_amount: 10,
        p_description: 'Mood enregistré',
      });

      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['moods'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      // ✅ DÉCLENCHER LA VÉRIFICATION DES BADGES
      await checkAndUnlockBadges();
    },
  });

  const updateMoodMutation = useMutation({
    mutationFn: async ({ id, updates }: UpdateMoodParams) => {
      const { data, error } = await supabase
        .from('moods')
        .update({
          score_global: updates.score_global,
          emotions: updates.emotions,
          note: updates.note,
          weather: updates.weather,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour les mood_domains si fournis
      if (updates.domains !== undefined) {
        // Supprimer les anciens
        await supabase.from('mood_domains').delete().eq('mood_id', id);

        // Ajouter les nouveaux
        if (updates.domains.length > 0) {
          const domainImpacts = updates.domains.map((d) => ({
            mood_id: id,
            domain: d.domain,
            impact: d.impact,
          }));

          await supabase.from('mood_domains').insert(domainImpacts);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moods'] });
    },
  });

  const deleteMoodMutation = useMutation({
    mutationFn: async (id: string) => {
      // Supprimer les mood_domains associés
      await supabase.from('mood_domains').delete().eq('mood_id', id);

      // Supprimer le mood
      const { error } = await supabase.from('moods').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moods'] });
    },
  });

  return {
    moods,
    isLoading,
    addMood: addMoodMutation.mutate,
    isAdding: addMoodMutation.isPending,
    updateMood: updateMoodMutation.mutate,
    isUpdating: updateMoodMutation.isPending,
    deleteMood: deleteMoodMutation.mutate,
    isDeleting: deleteMoodMutation.isPending,
  };
}
