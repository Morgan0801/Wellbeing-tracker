import { useState, useEffect } from 'react';
import { useAI } from '@/hooks/useAI';
import { Card } from '@/components/ui/card';
import { Sparkles, X, Moon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SleepLog } from '@/types';

interface AISleepTipsCardProps {
  recentSleepLogs: SleepLog[];
}

export function AISleepTipsCard({ recentSleepLogs }: AISleepTipsCardProps) {
  const ai = useAI();
  const [isDismissed, setIsDismissed] = useState(false);
  const [tips, setTips] = useState<{ tips: string[]; mainIssue: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier localStorage au montage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const dismissedDate = localStorage.getItem('ai-sleep-tips-dismissed');
    if (dismissedDate === today) {
      setIsDismissed(true);
    }
  }, []);

  // Déclencher automatiquement si mauvaise qualité de sommeil récente
  useEffect(() => {
    if (!ai.isConfigured || isDismissed || tips || recentSleepLogs.length === 0) {
      return;
    }

    // Analyser les 7 dernières nuits
    const last7Nights = recentSleepLogs.slice(0, 7);
    const avgQuality = last7Nights.reduce((sum, log) => sum + (log.quality_score || 0), 0) / last7Nights.length;
    const avgHours = last7Nights.reduce((sum, log) => sum + log.total_hours, 0) / last7Nights.length;

    // Déclencher si qualité < 3/5 ou moins de 6h en moyenne
    if (avgQuality < 3 || avgHours < 6) {
      setIsLoading(true);

      const sleepData = {
        last7Days: last7Nights.map(log => ({
          date: log.date,
          hours: log.total_hours,
          quality: log.quality_score || 0,
        })),
      };

      ai.generateSleepTips(sleepData)
        .then((result) => {
          setTips(result);
        })
        .catch((error) => {
          console.error('Erreur génération sleep tips:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [recentSleepLogs, ai.isConfigured, isDismissed, tips]);

  const handleDismiss = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('ai-sleep-tips-dismissed', today);
    setIsDismissed(true);
  };

  // Ne pas afficher si:
  // - IA non configurée
  // - Carte dismissée aujourd'hui
  // - Pas de tips à afficher
  // - Pas de données
  if (!ai.isConfigured || isDismissed || (!tips && !isLoading) || recentSleepLogs.length === 0) {
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
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <Moon className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />

            {/* Content */}
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    Conseils sommeil IA
                  </span>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg transition-colors"
                  title="Masquer pour aujourd'hui"
                >
                  <X className="w-4 h-4 text-indigo-500" />
                </button>
              </div>

              {/* Loading */}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyse de vos habitudes de sommeil...</span>
                </div>
              )}

              {/* Content */}
              {!isLoading && tips && (
                <>
                  {/* Main Issue */}
                  <div className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                      🎯 {tips.mainIssue}
                    </p>
                  </div>

                  {/* Tips List */}
                  <div className="space-y-2">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      Recommandations:
                    </p>
                    {tips.tips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-sm text-indigo-700 dark:text-indigo-300"
                      >
                        <span className="text-indigo-500 font-medium flex-shrink-0 mt-0.5">
                          {idx + 1}.
                        </span>
                        <span className="leading-relaxed">{tip}</span>
                      </div>
                    ))}
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
