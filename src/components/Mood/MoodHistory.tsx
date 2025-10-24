import { useState } from 'react';
import { useMood } from '@/hooks/useMood';
import { getMoodEmoji, getMoodColor, formatDate, formatTime } from '@/lib/utils';
import { Calendar, Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoodModal } from './MoodModal';
import { MoodLog } from '@/types';

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
      <div className="space-y-4">
        {moods.map((mood) => (
          <div
            key={mood.id}
            className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {/* Emoji and Score */}
            <div className="flex flex-col items-center min-w-[80px]">
              <span className="text-4xl mb-1">{getMoodEmoji(mood.score_global)}</span>
              <span
                className="text-xl font-bold"
                style={{ color: getMoodColor(mood.score_global) }}
              >
                {mood.score_global}/10
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Date and Time */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(mood.datetime, 'PPP')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(mood.datetime)}
                </span>
              </div>

              {/* Emotions */}
              {mood.emotions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {mood.emotions.map((emotion) => (
                    <span
                      key={emotion}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              )}

              {/* Note */}
              {mood.note && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  {mood.note}
                </p>
              )}

              {/* Weather */}
              {mood.weather && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                  <span>🌡️ {mood.weather.temp}°C</span>
                  <span>•</span>
                  <span className="capitalize">{mood.weather.condition}</span>
                </div>
              )}
            </div>

            {/* ✅ NOUVEAUX BOUTONS ÉDITER / SUPPRIMER */}
            <div className="flex flex-col gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(mood)}
                className="h-8 w-8"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(mood.id)}
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
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
