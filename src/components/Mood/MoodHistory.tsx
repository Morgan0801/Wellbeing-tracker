import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useMood } from '@/hooks/useMood';
import { getMoodEmoji, getMoodColor, formatDate, formatTime } from '@/lib/utils';
import { Calendar, Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoodModal } from './MoodModal';
import { MoodLog } from '@/types';
import { supabase } from '@/lib/supabase';

// Sous-composant : affiche les tags de contexte d'un mood
function MoodContextTags({ moodId }: { moodId: string }) {
  const { data: tags = [] } = useQuery({
    queryKey: ['mood-context-tags', moodId],
    queryFn: async () => {
      const { data } = await supabase
        .from('mood_activities')
        .select(`
          activity_type_id,
          activity_types!inner(name, emoji, category)
        `)
        .eq('mood_id', moodId)
        .eq('done', true)
        .eq('activity_types.category', 'contexte');
      return (data || []) as unknown as Array<{
        activity_type_id: string;
        activity_types: { name: string; emoji: string; category: string };
      }>;
    },
    staleTime: 60_000,
  });

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {tags.map((t) => (
        <span
          key={t.activity_type_id}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium"
        >
          {t.activity_types.emoji} {t.activity_types.name}
        </span>
      ))}
    </div>
  );
}

export function MoodHistory() {
  const { moods, isLoading, deleteMood } = useMood();
  const [editingMood, setEditingMood] = useState<MoodLog | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (mood: MoodLog) => {
    setEditingMood(mood);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce mood ? Cette action est irréversible.')) {
      deleteMood(id);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Chargement de l'historique...
      </div>
    );
  }

  if (moods.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucun mood enregistré
        </h3>
        <p className="text-gray-500">
          Commence par ajouter ton premier mood pour voir ton historique !
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {moods.map((mood, index) => (
          <motion.div
            key={mood.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            className="relative flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-md transition-all duration-200 overflow-hidden"
            style={{
              borderLeftWidth: '4px',
              borderLeftColor: getMoodColor(mood.score_global),
            }}
          >
            {/* Score + emoji */}
            <div className="flex flex-col items-center min-w-[72px]">
              <span className="text-3xl mb-0.5">{getMoodEmoji(mood.score_global)}</span>
              <span
                className="text-lg font-bold"
                style={{ color: getMoodColor(mood.score_global) }}
              >
                {mood.score_global}/10
              </span>
              {mood.energy_level && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  🔋 {mood.energy_level}/10
                </span>
              )}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              {/* Date et heure */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(mood.datetime, 'PPP')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(mood.datetime)}
                </span>
              </div>

              {/* Tags contexte (orange pills) */}
              <MoodContextTags moodId={mood.id} />

              {/* Émotions */}
              {mood.emotions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {mood.emotions.map((emotion) => (
                    <span
                      key={emotion}
                      className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              )}

              {/* Note */}
              {mood.note && (
                <p className="text-sm text-muted-foreground mt-2 italic line-clamp-2">
                  "{mood.note}"
                </p>
              )}

              {/* Météo */}
              {mood.weather && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                  <span>🌡️ {mood.weather.temp}°C</span>
                  <span>•</span>
                  <span className="capitalize">{mood.weather.condition}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(mood)}
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(mood.id)}
                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal d'édition */}
      {editingMood && (
        <MoodModal
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) setEditingMood(null);
          }}
          weather={editingMood.weather || null}
          editingMood={editingMood}
        />
      )}
    </>
  );
}
