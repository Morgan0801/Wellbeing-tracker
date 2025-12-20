import { useState, useEffect } from 'react';
import { useAI } from '@/hooks/useAI';
import { Card } from '@/components/ui/card';
import { Sparkles, RefreshCw, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AIDailyInsightCard() {
  const ai = useAI();
  const [isDismissed, setIsDismissed] = useState(false);

  // Vérifier localStorage au montage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const dismissedDate = localStorage.getItem('ai-insight-dismissed');
    if (dismissedDate === today) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('ai-insight-dismissed', today);
    setIsDismissed(true);
  };

  const handleRefresh = () => {
    ai.refreshDailyInsight();
  };

  // Ne pas afficher si:
  // - IA non configurée
  // - Carte dismissée aujourd'hui
  // - Pas de données
  if (!ai.isConfigured || isDismissed || !ai.dailyInsight) {
    return null;
  }

  const { insight, tip, emoji, metric, trend } = ai.dailyInsight;

  // Déterminer la couleur et l'icône selon la tendance
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700';
    if (trend === 'down') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
    return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800">
          <div className="flex items-start gap-3">
            {/* Emoji + Metric */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="text-3xl">{emoji}</div>
              {metric && (
                <div className={`px-2 py-1 rounded-lg border flex items-center gap-1 ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span className={`text-xs font-bold ${
                    trend === 'up' ? 'text-emerald-700 dark:text-emerald-300' :
                    trend === 'down' ? 'text-red-700 dark:text-red-300' :
                    'text-gray-700 dark:text-gray-300'
                  }`}>
                    {metric}
                  </span>
                </div>
              )}
            </div>

            {/* Contenu */}
            <div className="flex-1 space-y-2.5">
              {/* Header avec icône et boutons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                    Insight du jour
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Bouton refresh */}
                  <button
                    onClick={handleRefresh}
                    disabled={ai.isLoadingDailyInsight}
                    className="p-1.5 hover:bg-violet-100 dark:hover:bg-violet-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Rafraîchir l'insight"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-violet-500 ${ai.isLoadingDailyInsight ? 'animate-spin' : ''}`}
                    />
                  </button>
                  {/* Bouton fermer */}
                  <button
                    onClick={handleDismiss}
                    className="p-1.5 hover:bg-violet-100 dark:hover:bg-violet-800 rounded-lg transition-colors"
                    title="Masquer pour aujourd'hui"
                  >
                    <X className="w-4 h-4 text-violet-500" />
                  </button>
                </div>
              </div>

              {/* Insight principal */}
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                {insight}
              </p>

              {/* Conseil actionnable */}
              <div className="pt-2 border-t border-violet-200 dark:border-violet-700">
                <div className="flex items-start gap-1.5">
                  <span className="text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5">💡</span>
                  <p className="text-xs text-violet-700 dark:text-violet-300 font-medium leading-relaxed">
                    {tip}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Loader si chargement */}
          {ai.isLoadingDailyInsight && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-violet-500">
              <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
