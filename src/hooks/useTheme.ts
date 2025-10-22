import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ThemeSettings, PresetTheme } from '@/types/phase5-types';
import { PRESET_THEMES } from '@/types/phase5-types';

export function useTheme() {
  const queryClient = useQueryClient();

  // Récupérer les paramètres de thème
  const { data: themeSettings, isLoading } = useQuery({
    queryKey: ['theme-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('theme_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Thème par défaut
      if (!data) {
        const defaultTheme: Omit<ThemeSettings, 'id' | 'created_at' | 'updated_at'> = {
          user_id: user.id,
          theme_name: 'Ocean Blue',
          is_custom: false,
          colors: PRESET_THEMES[0].colors,
          spacing: 'normal',
          radius: 12,
          font: 'inter',
          effects: {
            glassmorphism: false,
            neumorphism: false,
            shadows: 'md',
            animations: true,
          },
        };

        const { data: newData, error: insertError } = await supabase
          .from('theme_settings')
          .insert([defaultTheme])
          .select()
          .single();

        if (insertError) throw insertError;
        return newData as ThemeSettings;
      }

      return data as ThemeSettings;
    },
  });

  // Appliquer le thème au DOM
  const applyTheme = (theme: ThemeSettings) => {
    const root = document.documentElement;
    
    // Couleurs
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-foreground', theme.colors.foreground);
    root.style.setProperty('--color-muted', theme.colors.muted);
    root.style.setProperty('--color-border', theme.colors.border);

    // Espacement
    const spacingMap = {
      compact: '0.75rem',
      normal: '1rem',
      spacious: '1.5rem',
    };
    root.style.setProperty('--spacing-base', spacingMap[theme.spacing]);

    // Border radius
    root.style.setProperty('--radius', `${theme.radius}px`);

    // Font
    const fontMap = {
      inter: "'Inter', sans-serif",
      poppins: "'Poppins', sans-serif",
      roboto: "'Roboto', sans-serif",
    };
    root.style.setProperty('--font-family', fontMap[theme.font]);

    // Effets
    if (theme.effects.glassmorphism) {
      root.style.setProperty('--backdrop-blur', 'blur(10px)');
    } else {
      root.style.setProperty('--backdrop-blur', 'none');
    }

    // Background image
    if (theme.background_image) {
      root.style.setProperty('--bg-image', `url(${theme.background_image})`);
    } else {
      root.style.setProperty('--bg-image', 'none');
    }
  };

  // Mettre à jour le thème
  const updateTheme = useMutation({
    mutationFn: async (newTheme: Partial<ThemeSettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('theme_settings')
        .update({
          ...newTheme,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      // Appliquer immédiatement
      if (data) {
        applyTheme(data as ThemeSettings);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-settings'] });
    },
  });

  // Appliquer un thème preset
  const applyPreset = (preset: PresetTheme) => {
    updateTheme.mutate({
      theme_name: preset.name,
      is_custom: false,
      colors: preset.colors,
    });
  };

  // Sauvegarder un thème custom
  const saveCustomTheme = (name: string, colors: ThemeSettings['colors']) => {
    updateTheme.mutate({
      theme_name: name,
      is_custom: true,
      colors,
    });
  };

  return {
    themeSettings,
    presetThemes: PRESET_THEMES,
    loading: isLoading,
    updateTheme: updateTheme.mutate,
    applyPreset,
    saveCustomTheme,
    applyTheme,
  };
}
