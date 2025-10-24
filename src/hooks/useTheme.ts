import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ThemeSettings, PRESET_THEMES } from '@/types/phase5-types';
import { useAuthStore } from '@/stores/authStore';

export function useTheme() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore(); // ✅ FIX: Utiliser useAuthStore au lieu de supabase.auth.getUser()

  // Récupérer les paramètres de thème
  const { data: settings, isLoading } = useQuery({
    queryKey: ['theme_settings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('theme_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Si aucun paramètre n'existe, en créer un par défaut
        if (error.code === 'PGRST116') {
          const defaultTheme = PRESET_THEMES[0];
          const { data: newSettings, error: insertError } = await supabase
            .from('theme_settings')
            .insert([
              {
                user_id: user.id,
                theme_name: defaultTheme.name,
                is_custom: false,
                colors: defaultTheme.colors,
                spacing: 'normal',
                radius: 8,
                font: 'inter',
                effects: {
                  glassmorphism: false,
                  neumorphism: false,
                  shadows: 'md',
                  animations: true,
                },
              },
            ])
            .select()
            .single();

          if (insertError) throw insertError;
          return newSettings as ThemeSettings;
        }
        throw error;
      }

      return data as ThemeSettings;
    },
    enabled: !!user?.id,
  });

  // Mettre à jour les paramètres
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<ThemeSettings>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('theme_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme_settings'] });
    },
  });

  // Appliquer un thème preset
  const applyPresetTheme = (presetId: string) => {
    const preset = PRESET_THEMES.find((t) => t.id === presetId);
    if (!preset) return;

    updateSettingsMutation.mutate({
      theme_name: preset.name,
      is_custom: false,
      colors: preset.colors,
    });
  };

  return {
    settings,
    loading: isLoading,
    updateSettings: updateSettingsMutation.mutate,
    applyPresetTheme,
    presetThemes: PRESET_THEMES,
  };
}
