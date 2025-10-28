import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ThemeColors, ThemeSettings, PRESET_THEMES } from '@/types/phase5-types';
import { useAuthStore } from '@/stores/authStore';

const sanitizeHex = (hex: string) => {
  if (!hex) return null;
  let value = hex.trim().replace('#', '');
  if (value.length === 3) {
    value = value
      .split('')
      .map((char) => char + char)
      .join('');
  }
  return value.length === 6 ? value : null;
};

const hexToHsl = (hex: string) => {
  const normalized = sanitizeHex(hex);
  if (!normalized) {
    return '0 0% 0%';
  }

  const r = parseInt(normalized.substring(0, 2), 16) / 255;
  const g = parseInt(normalized.substring(2, 4), 16) / 255;
  const b = parseInt(normalized.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  const hue = Math.round(h * 360);
  const saturation = (s * 100).toFixed(1);
  const lightness = (l * 100).toFixed(1);

  return `${hue} ${saturation}% ${lightness}%`;
};

const getContrastingHex = (hex: string) => {
  const normalized = sanitizeHex(hex);
  if (!normalized) {
    return '#000000';
  }

  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#000000' : '#FFFFFF';
};

const applyThemeToDocument = (colors: ThemeColors, radius?: number) => {
  if (typeof window === 'undefined' || !colors) {
    return;
  }

  const root = document.documentElement;
  const setVar = (name: string, value: string) => {
    root.style.setProperty(name, value);
  };

  const background = hexToHsl(colors.background);
  const foreground = hexToHsl(colors.foreground);
  const border = hexToHsl(colors.border);

  setVar('--background', background);
  setVar('--card', background);
  setVar('--popover', background);

  setVar('--foreground', foreground);
  setVar('--card-foreground', foreground);
  setVar('--popover-foreground', foreground);

  setVar('--primary', hexToHsl(colors.primary));
  setVar('--primary-foreground', hexToHsl(getContrastingHex(colors.primary)));

  setVar('--secondary', hexToHsl(colors.secondary));
  setVar('--secondary-foreground', hexToHsl(getContrastingHex(colors.secondary)));

  setVar('--accent', hexToHsl(colors.accent));
  setVar('--accent-foreground', hexToHsl(getContrastingHex(colors.accent)));

  setVar('--muted', hexToHsl(colors.muted));
  setVar('--muted-foreground', hexToHsl(getContrastingHex(colors.muted)));

  setVar('--border', border);
  setVar('--input', border);
  setVar('--ring', hexToHsl(colors.primary));

  if (typeof radius === 'number') {
    root.style.setProperty('--radius', `${radius}px`);
  }

  if (document.body) {
    // Détecte le mode sombre via la classe 'dark' sur l'élément HTML
    const isDark = document.documentElement.classList.contains('dark');

    // Choisir le bon gradient selon le mode
    const gradient = isDark
      ? (colors.backgroundGradientDark || colors.backgroundGradient)
      : (colors.backgroundGradient || colors.background);

    if (gradient && gradient.includes('gradient')) {
      document.body.style.background = gradient;
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundColor = colors.background;
    }
    document.body.style.color = colors.foreground;
    document.body.style.minHeight = '100vh';
  }
};

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

  useEffect(() => {
    if (settings?.colors) {
      applyThemeToDocument(settings.colors, settings.radius);

      // Observer pour réappliquer le gradient quand le mode dark change
      const observer = new MutationObserver(() => {
        applyThemeToDocument(settings.colors, settings.radius);
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      return () => observer.disconnect();
    }
  }, [settings]);

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

    applyThemeToDocument(preset.colors, settings?.radius);

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
