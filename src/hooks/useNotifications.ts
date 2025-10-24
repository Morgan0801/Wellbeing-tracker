import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { NotificationSettings } from '@/types/phase5-types';
import { useAuthStore } from '@/stores/authStore';

export function useNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore(); // ✅ FIX: Utiliser useAuthStore au lieu de supabase.auth.getUser()

  // Récupérer les paramètres de notification
  const { data: settings, isLoading } = useQuery({
    queryKey: ['notification_settings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Si aucun paramètre n'existe, en créer un par défaut
        if (error.code === 'PGRST116') {
          const { data: newSettings, error: insertError } = await supabase
            .from('notification_settings')
            .insert([
              {
                user_id: user.id,
                habits_enabled: false,
                sleep_enabled: false,
                mood_enabled: false,
                gratitude_enabled: false,
                tasks_enabled: false,
                sound_enabled: true,
              },
            ])
            .select()
            .single();

          if (insertError) throw insertError;
          return newSettings as NotificationSettings;
        }
        throw error;
      }

      return data as NotificationSettings;
    },
    enabled: !!user?.id,
  });

  // Mettre à jour les paramètres
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationSettings>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notification_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_settings'] });
    },
  });
  
  const requestPermission = async () => {
  if ('Notification' in window) {
    try { await Notification.requestPermission(); } catch {}
  }
};

const sendTestNotification = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Test de notification', { body: 'Ceci est un test ✅' });
  }
};


  return {
  settings,
  loading: isLoading,
  updateSettings: updateSettingsMutation.mutate,
  requestPermission,
  sendTestNotification,
};

}
