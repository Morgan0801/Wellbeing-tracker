import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMood } from '@/hooks/useMood';
import { useActivities } from '@/hooks/useActivities';
import { MOOD_LEVELS } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export function QuickMoodLog() {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedContexte, setSelectedContexte] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  const { addMoodAsync, isAdding } = useMood();
  const { activityTypes, saveMoodActivities } = useActivities();

  // Contexte activities disponibles
  const contexteActivities = activityTypes.filter(a => a.category === 'contexte');

  // Quelques émotions rapides (positif/neutre/négatif selon le score)
  const quickEmotions = selectedScore !== null
    ? selectedScore >= 7
      ? ['Heureux', 'Motivé', 'Serein', 'Énergique', 'Reconnaissant']
      : selectedScore >= 5
        ? ['Neutre', 'Pensif', 'Fatigué', 'Incertain']
        : ['Anxieux', 'Triste', 'Découragé', 'Stressé', 'Épuisé']
    : ['Heureux', 'Serein', 'Neutre', 'Fatigué', 'Anxieux', 'Motivé'];

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion) ? prev.filter(e => e !== emotion) : [...prev, emotion]
    );
  };

  const toggleContexte = (id: string) => {
    setSelectedContexte(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedScore === null) return;
    setIsLogging(true);

    try {
      const newMood = await addMoodAsync({
        score_global: selectedScore,
        emotions: selectedEmotions,
        energy_level: Math.round(selectedScore * 0.9), // estimation rapide
        datetime: new Date().toISOString(),
      });

      // Sauvegarder les contextes sélectionnés
      if (newMood && selectedContexte.size > 0) {
        const activities = activityTypes
          .filter(a => selectedContexte.has(a.id))
          .map(a => ({ activity_type_id: a.id, done: true }));

        saveMoodActivities.mutate({ moodId: newMood.id, activities });
      }

      setSaved(true);
      toast.success('Mood enregistré ! ✨');

      // Reset après 2 secondes
      setTimeout(() => {
        setSelectedScore(null);
        setSelectedEmotions([]);
        setSelectedContexte(new Set());
        setSaved(false);
      }, 2000);
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsLogging(false);
    }
  };

  const currentLevel = selectedScore !== null
    ? MOOD_LEVELS.find(l => selectedScore >= l.range[0] && selectedScore <= l.range[1])
    : null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Log rapide
          {currentLevel && (
            <span className="ml-auto text-2xl">{currentLevel.emoji}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-6 gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-green-600">Enregistré !</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Score selector — 5 emoji buttons */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Comment tu te sens là ?</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {MOOD_LEVELS.map((level) => (
                    <button
                      key={level.range[0]}
                      type="button"
                      onClick={() => {
                        setSelectedScore(level.range[0] + 1); // milieu de la range
                        setSelectedEmotions([]); // reset emotions quand score change
                      }}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all',
                        selectedScore !== null && selectedScore >= level.range[0] && selectedScore <= level.range[1]
                          ? 'border-primary bg-primary/10 scale-105 shadow-sm'
                          : 'border-border/50 hover:border-border hover:bg-muted/50'
                      )}
                    >
                      <span className="text-2xl">{level.emoji}</span>
                      <span className="text-[9px] font-medium text-muted-foreground hidden sm:block truncate w-full text-center">
                        {level.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Émotions rapides (apparaissent après sélection du score) */}
              <AnimatePresence>
                {selectedScore !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <p className="text-xs text-muted-foreground">Émotions (optionnel)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {quickEmotions.map(emotion => (
                        <button
                          key={emotion}
                          type="button"
                          onClick={() => toggleEmotion(emotion)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                            selectedEmotions.includes(emotion)
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                          )}
                        >
                          {emotion}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Contexte de vie (si des tags existent) */}
              <AnimatePresence>
                {selectedScore !== null && contexteActivities.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <p className="text-xs text-muted-foreground">🌍 Contexte (optionnel)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {contexteActivities.slice(0, 6).map(activity => {
                        const isSelected = selectedContexte.has(activity.id);
                        return (
                          <button
                            key={activity.id}
                            type="button"
                            onClick={() => toggleContexte(activity.id)}
                            className={cn(
                              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border-2 transition-all',
                              isSelected
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'border-orange-200 text-orange-700 hover:border-orange-400 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300'
                            )}
                          >
                            {activity.emoji} {activity.name}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bouton save */}
              <Button
                onClick={handleSave}
                disabled={selectedScore === null || isAdding || isLogging}
                className="w-full"
                size="sm"
              >
                {isAdding || isLogging ? 'Enregistrement...' : 'Enregistrer le mood ✓'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
