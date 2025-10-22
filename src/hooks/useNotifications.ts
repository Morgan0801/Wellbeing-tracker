import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { NotificationSettings } from '@/types/phase5-types';

export function useNotifications() {
  const queryClient = useQueryClient();

  // Récupérer les paramètres de notifications
  const { data: settings, isLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Créer des settings par défaut si aucun n'existe
      if (!data) {
        const defaultSettings = {
          user_id: user.id,
          habits_enabled: true,
          habits_time: '09:00',
          sleep_enabled: true,
          sleep_time: '22:00',
          mood_enabled: true,
          mood_time: '20:00',
          gratitude_enabled: true,
          gratitude_time: '21:00',
          tasks_enabled: true,
          sound_enabled: true,
        };

        const { data: newData, error: insertError } = await supabase
          .from('notification_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (insertError) throw insertError;
        return newData as NotificationSettings;
      }

      return data as NotificationSettings;
    },
  });

  // Mettre à jour les paramètres
  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<NotificationSettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notification_settings')
        .update({
          ...newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });

  // Demander la permission pour les notifications
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Ce navigateur ne supporte pas les notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  // Envoyer une notification de test
  const sendTestNotification = async () => {
    const granted = await requestPermission();
    
    if (granted && settings) {
      new Notification('Wellbeing Tracker', {
        body: 'Les notifications sont activées ! 🎉',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'test-notification',
      });
    }
  };

  // Planifier les notifications quotidiennes
  const scheduleNotifications = () => {
    if (!settings) return;

    // Cette fonction devrait idéalement utiliser un Service Worker
    // Pour une vraie implémentation PWA
    console.log('Scheduling notifications with settings:', settings);
  };

  return {
    settings,
    loading: isLoading,
    updateSettings: updateSettings.mutate,
    requestPermission,
    sendTestNotification,
    scheduleNotifications,
  };
}
