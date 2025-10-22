import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Mood, MoodDomain } from '@/types';
import { useAuthStore } from '@/stores/authStore';

export function useMood() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Récupérer tous les moods de l'utilisateur
  const { data: moods = [], isLoading } = useQuery({
    queryKey: ['moods', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', user?.id)
        .order('datetime', { ascending: false });

      if (error) throw error;
      return data as Mood[];
    },
    enabled: !!user?.id,
  });

  // Ajouter un nouveau mood
  const addMoodMutation = useMutation({
    mutationFn: async (moodData: {
      score_global: number;
      emotions: string[];
      note?: string;
      weather?: any;
      domains: { domain: string; impact: number }[];
    }) => {
      // Insérer le mood
      const { data: mood, error: moodError } = await supabase
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

      if (moodError) throw moodError;

      // Insérer les domaines
      if (moodData.domains.length > 0) {
        const domainsToInsert = moodData.domains.map((d) => ({
          mood_id: mood.id,
          domain: d.domain,
          impact: d.impact,
        }));

        const { error: domainsError } = await supabase
          .from('mood_domains')
          .insert(domainsToInsert);

        if (domainsError) throw domainsError;
      }

      return mood;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moods'] });
    },
  });

  // Récupérer les domaines d'un mood spécifique
  const getMoodDomains = async (moodId: string): Promise<MoodDomain[]> => {
    const { data, error } = await supabase
      .from('mood_domains')
      .select('*')
      .eq('mood_id', moodId);

    if (error) throw error;
    return data as MoodDomain[];
  };

  return {
    moods,
    isLoading,
    addMood: addMoodMutation.mutate,
    isAdding: addMoodMutation.isPending,
    getMoodDomains,
  };
}
