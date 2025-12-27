import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import {
  FocusSession,
  SessionTag,
  CreateTagInput,
  FocusStats,
  CategoryStats,
  DailyActivity,
  StatsPeriod,
  SessionType
} from '@/types';
import { format, subDays, differenceInDays, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';
import { useCallback, useMemo } from 'react';

export function useFocusEnhanced() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Récupérer toutes les sessions (90 jours pour stats) avec leurs tags
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['focus-sessions-enhanced', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = format(subDays(new Date(), 90), 'yyyy-MM-dd');

      // Récupérer les sessions
      const { data: sessionsData, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startDate)
        .order('start_time', { ascending: false });

      if (error) throw error;
      if (!sessionsData || sessionsData.length === 0) return [];

      // Récupérer tous les tags liés à ces sessions
      const sessionIds = sessionsData.map(s => s.id);
      const { data: tagLinks, error: tagLinksError } = await supabase
        .from('focus_session_tag_links')
        .select('session_id, tag_name')
        .in('session_id', sessionIds);

      if (tagLinksError) {
        console.error('Error fetching tag links:', tagLinksError);
      }

      // Associer les tags aux sessions
      const sessionsWithTags = sessionsData.map(session => {
        const sessionTags = tagLinks
          ?.filter(link => link.session_id === session.id)
          .map(link => link.tag_name) || [];

        return {
          ...session,
          tags: sessionTags.length > 0 ? sessionTags : undefined,
        } as FocusSession;
      });

      return sessionsWithTags;
    },
    enabled: !!user?.id,
  });

  // Récupérer les tags de session
  const { data: tags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ['session-tags', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('session_tags')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      return data as SessionTag[];
    },
    enabled: !!user?.id,
  });

  // Démarrer une nouvelle session
  const startSession = useMutation({
    mutationFn: async ({
      durationMinutes = 25,
      sessionType = 'pomodoro' as SessionType,
      taskId,
      tags,
      objective,
      preEnergyLevel,
    }: {
      durationMinutes?: number;
      sessionType?: SessionType;
      taskId?: string;
      tags?: string[];
      objective?: string;
      preEnergyLevel?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          task_id: taskId,
          start_time: new Date().toISOString(),
          duration_minutes: durationMinutes,
          session_type: sessionType,
          completed: false,
          objective: objective || null,
          pre_energy_level: preEnergyLevel || null,
          distractions_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Insérer les tags si fournis
      if (tags && tags.length > 0) {
        const tagLinks = tags.map(tagName => ({
          session_id: data.id,
          tag_name: tagName,
        }));

        const { error: tagsError } = await supabase
          .from('focus_session_tag_links')
          .insert(tagLinks);

        if (tagsError) {
          console.error('Error inserting tags:', tagsError);
        }
      }

      return data as FocusSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions-enhanced'] });
    },
    onError: () => {
      toast.error('Erreur lors du démarrage de la session');
    },
  });

  // Terminer une session
  const completeSession = useMutation({
    mutationFn: async ({
      id,
      completed = true,
      notes,
      actualDurationMinutes,
      qualityRating,
      postFocusQuality,
      distractionsCount,
      sessionMood,
    }: {
      id: string;
      completed?: boolean;
      notes?: string;
      actualDurationMinutes?: number;
      qualityRating?: number;
      postFocusQuality?: number;
      distractionsCount?: number;
      sessionMood?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('focus_sessions')
        .update({
          end_time: new Date().toISOString(),
          completed,
          notes,
          actual_duration_minutes: actualDurationMinutes,
          quality_rating: qualityRating,
          post_focus_quality: postFocusQuality || null,
          distractions_count: distractionsCount !== undefined ? distractionsCount : null,
          session_mood: sessionMood || null,
        })
        .eq('id', id);

      if (error) throw error;

      // Ajouter XP si complété (15 XP pour session normale)
      if (completed) {
        await supabase.rpc('add_xp', {
          p_user_id: user.id,
          p_action_type: 'focus_session',
          p_xp_amount: 15,
          p_description: 'Session Pomodoro complétée',
        });
      }
    },
    onSuccess: (_, { completed }) => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      if (completed) {
        toast.success('Session terminée ! +15 XP');
      }
    },
  });

  // Créer une session manuellement
  const createManualSession = useMutation({
    mutationFn: async ({
      startTime,
      durationMinutes,
      tags,
      objective,
      notes,
      sessionType = 'pomodoro' as SessionType,
    }: {
      startTime: Date;
      durationMinutes: number;
      tags?: string[];
      objective?: string;
      notes?: string;
      sessionType?: SessionType;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          actual_duration_minutes: durationMinutes,
          session_type: sessionType,
          completed: true,
          objective: objective || null,
          notes,
          is_manual_entry: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Insérer les tags si fournis
      if (tags && tags.length > 0) {
        const tagLinks = tags.map(tagName => ({
          session_id: data.id,
          tag_name: tagName,
        }));

        const { error: tagsError } = await supabase
          .from('focus_session_tag_links')
          .insert(tagLinks);

        if (tagsError) {
          console.error('Error inserting tags:', tagsError);
        }
      }

      // Ajouter XP pour entrée manuelle (15 XP comme session normale)
      await supabase.rpc('add_xp', {
        p_user_id: user.id,
        p_action_type: 'focus_session',
        p_xp_amount: 15,
        p_description: `Session ${tags?.join(', ') || 'Pomodoro'} ajoutée manuellement`,
      });

      return data as FocusSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      toast.success('Session ajoutée ! +15 XP');
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout de la session');
    },
  });

  // Créer un nouveau tag
  // Supprimer une session
  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('focus_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions-enhanced'] });
      toast.success('Session supprimée');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la session');
    },
  });

  // Modifier une session
  const updateSession = useMutation({
    mutationFn: async ({
      id,
      startTime,
      endTime,
      durationMinutes,
      actualDurationMinutes,
      sessionType,
      notes,
      tags,
    }: {
      id: string;
      startTime?: Date;
      endTime?: Date | null;
      durationMinutes?: number;
      actualDurationMinutes?: number | null;
      sessionType?: SessionType;
      notes?: string | null;
      tags?: string[];
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: Record<string, any> = {};

      if (startTime) updateData.start_time = startTime.toISOString();
      if (typeof durationMinutes === 'number') updateData.duration_minutes = durationMinutes;
      if (sessionType) updateData.session_type = sessionType;
      if (notes !== undefined) updateData.notes = notes && notes.trim().length > 0 ? notes.trim() : null;

      if (endTime !== undefined) {
        updateData.end_time = endTime ? endTime.toISOString() : null;
      }
      if (actualDurationMinutes !== undefined) {
        updateData.actual_duration_minutes = actualDurationMinutes;
      }

      if (tags !== undefined) {
        updateData.category = null;
      }

      const { error } = await supabase
        .from('focus_sessions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      if (tags !== undefined) {
        const { error: deleteLinksError } = await supabase
          .from('focus_session_tag_links')
          .delete()
          .eq('session_id', id);

        if (deleteLinksError) throw deleteLinksError;

        if (tags.length > 0) {
          const links = tags.map((tagName) => ({
            session_id: id,
            tag_name: tagName,
          }));

          const { error: insertLinksError } = await supabase
            .from('focus_session_tag_links')
            .insert(links);

          if (insertLinksError) throw insertLinksError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions-enhanced'] });
      toast.success('Session mise à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la modification de la session');
    },
  });

  const createTag = useMutation({
    mutationFn: async (tagData: CreateTagInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('session_tags')
        .insert({
          ...tagData,
          user_id: user.id,
          is_default: false,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('Un tag avec ce nom existe déjà');
        }
        throw error;
      }
      return data as SessionTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-tags'] });
      toast.success('Tag créé avec succès !');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création du tag');
    },
  });

  // Supprimer un tag (personnalisé ou par défaut)
  const deleteTag = useMutation({
    mutationFn: async (tagId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('session_tags')
        .delete()
        .eq('id', tagId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-tags'] });
      toast.success('Tag supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du tag');
    },
  });

  // Fonction utilitaire : obtenir la date de début pour une période
  const getStartDateForPeriod = useCallback((period: StatsPeriod): Date => {
    switch (period) {
      case 'today':
        return startOfDay(new Date());
      case '7days':
        return subDays(new Date(), 7);
      case '30days':
        return subDays(new Date(), 30);
      case '90days':
        return subDays(new Date(), 90);
      default:
        return subDays(new Date(), 7);
    }
  }, []);

  // Fonction utilitaire : grouper par catégorie
  const groupByCategory = useCallback((filteredSessions: FocusSession[]): CategoryStats[] => {
    const grouped = filteredSessions.reduce((acc, session) => {
      // Utiliser les tags multiples, sinon catégorie unique (legacy), sinon "Sans catégorie"
      const sessionTags = session.tags && session.tags.length > 0
        ? session.tags
        : session.category
          ? [session.category]
          : ['Sans catégorie'];

      // Compter la session dans chaque tag
      sessionTags.forEach(tagName => {
        if (!acc[tagName]) {
          acc[tagName] = { minutes: 0, sessions: 0 };
        }
        acc[tagName].minutes += session.duration_minutes;
        acc[tagName].sessions += 1;
      });

      return acc;
    }, {} as Record<string, { minutes: number; sessions: number }>);

    const total = filteredSessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    return Object.entries(grouped).map(([category, data]) => {
      // Trouver l'emoji et la couleur du tag correspondant
      const tag = tags.find(t => t.name === category);

      return {
        category,
        ...data,
        percentage: total > 0 ? (data.minutes / total) * 100 : 0,
        emoji: tag?.emoji,
        color: tag?.color,
      };
    }).sort((a, b) => b.minutes - a.minutes); // Trier par temps décroissant
  }, [tags]);

  // Fonction utilitaire : grouper par jour
  const groupByDay = useCallback((filteredSessions: FocusSession[]): DailyActivity[] => {
    const grouped = filteredSessions.reduce((acc, session) => {
      const date = format(new Date(session.start_time), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { minutes: 0, sessions: 0 };
      }
      acc[date].minutes += session.duration_minutes;
      acc[date].sessions += 1;
      return acc;
    }, {} as Record<string, { minutes: number; sessions: number }>);

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Trier par date croissante
  }, []);

  // Calculer les statistiques pour une période donnée
  const getStats = useCallback((period: StatsPeriod): FocusStats => {
    const startDate = getStartDateForPeriod(period);
    const filtered = sessions.filter(s =>
      s.completed &&
      new Date(s.start_time) >= startDate &&
      s.session_type === 'pomodoro' // Ne compter que les sessions de travail
    );

    const totalMinutes = filtered.reduce((sum, s) => sum + s.duration_minutes, 0);
    const days = Math.max(1, differenceInDays(new Date(), startDate));
    const avgPerDay = totalMinutes / days;

    const byCategory = groupByCategory(filtered);
    const dailyActivity = groupByDay(filtered);

    return {
      totalMinutes,
      totalSessions: filtered.length,
      avgPerDay,
      byCategory,
      dailyActivity,
    };
  }, [sessions, getStartDateForPeriod, groupByCategory, groupByDay]);

  // Statistiques du jour
  const todayStats = useMemo(() => {
    return getStats('today');
  }, [getStats]);

  // Statistiques de la semaine
  const weekStats = useMemo(() => {
    return getStats('7days');
  }, [getStats]);

  // Sessions récentes (pour affichage historique)
  const recentSessions = useMemo(() => {
    return sessions.slice(0, 20); // Les 20 dernières sessions
  }, [sessions]);

  // Tags récents (5 derniers tags utilisés)
  const recentTags = useMemo(() => {
    const tagCounts = new Map<string, number>();

    sessions
      .filter(s => s.completed && s.tags && s.tags.length > 0)
      .slice(0, 10)
      .forEach(session => {
        session.tags?.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 5);
  }, [sessions]);

  // Logger une distraction
  const logDistraction = useMutation({
    mutationFn: async ({
      sessionId,
      distractionType,
      notes,
    }: {
      sessionId: string;
      distractionType: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('distraction_logs')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          distraction_type: distractionType,
          notes: notes || null,
        });

      if (error) throw error;

      // Incrémenter le compteur de distractions dans la session
      const { error: updateError } = await supabase.rpc('increment', {
        row_id: sessionId,
        x: 1,
      }).single();

      // Si la fonction RPC n'existe pas, faire une mise à jour manuelle
      if (updateError) {
        const { data: session } = await supabase
          .from('focus_sessions')
          .select('distractions_count')
          .eq('id', sessionId)
          .single();

        if (session) {
          await supabase
            .from('focus_sessions')
            .update({
              distractions_count: (session.distractions_count || 0) + 1,
            })
            .eq('id', sessionId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions-enhanced'] });
    },
  });

  // Incrémenter le compteur de distractions d'une session
  const incrementDistractions = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: session } = await supabase
        .from('focus_sessions')
        .select('distractions_count')
        .eq('id', sessionId)
        .single();

      if (!session) throw new Error('Session not found');

      const { error } = await supabase
        .from('focus_sessions')
        .update({
          distractions_count: (session.distractions_count || 0) + 1,
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions-enhanced'] });
    },
  });

  return {
    // Données
    sessions,
    recentSessions,
    tags,
    recentTags,
    isLoading: isLoadingSessions || isLoadingTags,

    // Mutations
    startSession,
    completeSession,
    createManualSession,
    deleteSession,
    updateSession,
    createTag,
    deleteTag,
    logDistraction,
    incrementDistractions,

    // Statistiques
    todayStats,
    weekStats,
    getStats,
  };
}
