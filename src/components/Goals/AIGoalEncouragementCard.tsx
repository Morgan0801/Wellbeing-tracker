import { useState, useEffect } from 'react';
import { useAI } from '@/hooks/useAI';
import { Card } from '@/components/ui/card';
import { Sparkles, X, Trophy, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Goal } from '@/types/phase4-types';

interface AIGoalEncouragementCardProps {
  activeGoals: Goal[];
}

export function AIGoalEncouragementCard({ activeGoals }: AIGoalEncouragementCardProps) {
  const ai = useAI();
  const [isDismissed, setIsDismissed] = useState(false);
  const [encouragement, setEncouragement] = useState<{
    message: string;
    nextStep: string;
    motivation: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier localStorage au montage (refresh une fois par semaine)
  useEffect(() => {
    const now = new Date();
    const weekNumber = Math.floor(now.getTime() / (1000 * 60 * 60 * 24 * 7));
    const dismissedWeek = localStorage.getItem('ai-goal-encouragement-week');
    if (dismissedWeek === String(weekNumber)) {
      setIsDismissed(true);
    }
  }, []);

  // Déclencher automatiquement si objectifs actifs
  useEffect(() => {
    if (!ai.isConfigured || isDismissed || encouragement || activeGoals.length === 0) {
      return;
    }

    // Générer un encouragement pour un objectif aléatoire
    const randomGoal = activeGoals[Math.floor(Math.random() * activeGoals.length)];

    setIsLoading(true);

    const goalData = {
      goalId: randomGoal.id,
      title: randomGoal.title,
      category: randomGoal.category,
      targetDate: randomGoal.target_date,
      description: randomGoal.description,
    };

    ai.generateGoalEncouragement(goalData)
      .then((result) => {
        setEncouragement(result);
      })
      .catch((error) => {
        console.error('Erreur génération goal encouragement:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [activeGoals, ai.isConfigured, isDismissed, encouragement]);

  const handleDismiss = () => {
    const now = new Date();
    const weekNumber = Math.floor(now.getTime() / (1000 * 60 * 60 * 24 * 7));
    localStorage.setItem('ai-goal-encouragement-week', String(weekNumber));
    setIsDismissed(true);
  };

  // Ne pas afficher si:
  // - IA non configurée
  // - Carte dismissée cette semaine
  // - Pas d'encouragement à afficher
  // - Pas d'objectifs actifs
  if (!ai.isConfigured || isDismissed || (!encouragement && !isLoading) || activeGoals.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <Trophy className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />

            {/* Content */}
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Message motivant
                  </span>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg transition-colors"
                  title="Masquer pour cette semaine"
                >
                  <X className="w-4 h-4 text-green-500" />
                </button>
              </div>

              {/* Loading */}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Génération de motivation personnalisée...</span>
                </div>
              )}

              {/* Content */}
              {!isLoading && encouragement && (
                <>
                  {/* Main Message */}
                  <div className="px-3 py-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium leading-relaxed">
                      💪 {encouragement.message}
                    </p>
                  </div>

                  {/* Next Step */}
                  <div className="space-y-1.5">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Prochaine étape:
                    </p>
                    <div className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                      <span className="text-green-500 font-medium flex-shrink-0 mt-0.5">→</span>
                      <span className="leading-relaxed">{encouragement.nextStep}</span>
                    </div>
                  </div>

                  {/* Motivation Quote */}
                  <div className="pt-2 border-t border-green-200 dark:border-green-700">
                    <p className="text-xs text-green-600 dark:text-green-400 italic leading-relaxed">
                      ✨ {encouragement.motivation}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
