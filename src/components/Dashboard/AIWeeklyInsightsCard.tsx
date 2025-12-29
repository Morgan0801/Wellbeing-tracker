import { useState, useEffect, useRef } from 'react';
import { useAI } from '@/hooks/useAI';
import { Card } from '@/components/ui/card';
import { Sparkles, X, TrendingUp, Loader2, Play, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Correlation {
  impact: string; // Peut être 'Fort', 'Moyen', 'Faible', ou autre valeur
  observation: string;
  explication: string;
  action: string;
  type?: 'good_news' | 'average' | 'concern'; // Type optionnel pour la catégorisation
}

export function AIWeeklyInsightsCard() {
  const ai = useAI();
  const [isDismissed, setIsDismissed] = useState(false);
  const [correlations, setCorrelations] = useState<Correlation[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false); // Éviter les appels multiples

  // Vérifier localStorage au montage (refresh une fois par semaine)
  useEffect(() => {
    const now = new Date();
    const weekNumber = Math.floor(now.getTime() / (1000 * 60 * 60 * 24 * 7));
    const dismissedWeek = localStorage.getItem('ai-weekly-insights-week');
    if (dismissedWeek === String(weekNumber)) {
      setIsDismissed(true);
    }

    // Vérifier le cache
    const cachedData = localStorage.getItem('ai-weekly-insights-data');
    const cachedTimestamp = localStorage.getItem('ai-weekly-insights-timestamp');

    if (cachedData && cachedTimestamp) {
      const age = Date.now() - parseInt(cachedTimestamp, 10);
      const TTL_24H = 24 * 60 * 60 * 1000;

      if (age < TTL_24H) {
        // Utiliser le cache
        setCorrelations(JSON.parse(cachedData));
        return;
      }
    }
  }, []);

  // DÉSACTIVÉ: Déclenchement automatique (consomme trop de tokens)
  // L'utilisateur peut maintenant déclencher manuellement via le bouton "Analyser"
  // useEffect(() => { ... }, []);

  // Fonction pour déclencher manuellement l'analyse
  const handleManualAnalysis = async () => {
    if (!ai.isConfigured || isLoading) return;

    setIsLoading(true);

    try {
      const data = await ai.analyzeCorrelations();
      if (data && data.correlations && data.correlations.length > 0) {
        // Limiter à 3 corrélations pour l'affichage
        const topCorrelations = data.correlations.slice(0, 3);
        setCorrelations(topCorrelations);

        // Mettre en cache pour 24h
        localStorage.setItem('ai-weekly-insights-data', JSON.stringify(topCorrelations));
        localStorage.setItem('ai-weekly-insights-timestamp', String(Date.now()));
      }
    } catch (error) {
      console.error('Erreur analyse corrélations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    const now = new Date();
    const weekNumber = Math.floor(now.getTime() / (1000 * 60 * 60 * 24 * 7));
    localStorage.setItem('ai-weekly-insights-week', String(weekNumber));
    setIsDismissed(true);
  };

  // Ne pas afficher si:
  // - IA non configurée
  // - Carte dismissée cette semaine
  if (!ai.isConfigured || isDismissed) {
    return null;
  }

  // Si pas de corrélations en cache, afficher le bouton pour lancer manuellement
  const showManualTrigger = !correlations && !isLoading;

  const getTypeColors = (type: string) => {
    switch (type) {
      case 'good_news':
        return {
          card: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500',
          badge: 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200',
          number: 'bg-emerald-500',
          action: 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700',
          actionText: 'text-emerald-800 dark:text-emerald-200'
        };
      case 'average':
        return {
          card: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500',
          badge: 'bg-yellow-200 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200',
          number: 'bg-yellow-500',
          action: 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700',
          actionText: 'text-yellow-800 dark:text-yellow-200'
        };
      case 'concern':
      default:
        return {
          card: 'bg-red-50 dark:bg-red-900/20 border-red-500',
          badge: 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200',
          number: 'bg-red-500',
          action: 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700',
          actionText: 'text-red-800 dark:text-red-200'
        };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <TrendingUp className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />

            {/* Content */}
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    Découvertes de la semaine
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Bouton refresh (seulement si corrélations déjà chargées) */}
                  {correlations && (
                    <button
                      onClick={handleManualAnalysis}
                      disabled={isLoading}
                      className="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-800 rounded-lg transition-colors disabled:opacity-50"
                      title="Relancer l'analyse"
                    >
                      <RefreshCw className={`w-4 h-4 text-orange-500 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  <button
                    onClick={handleDismiss}
                    className="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-800 rounded-lg transition-colors"
                    title="Masquer pour cette semaine"
                  >
                    <X className="w-4 h-4 text-orange-500" />
                  </button>
                </div>
              </div>

              {/* Bouton pour lancer manuellement l'analyse */}
              {showManualTrigger && (
                <div className="flex flex-col items-center gap-2 py-2">
                  <p className="text-xs text-orange-600 dark:text-orange-400 text-center">
                    Analyse des corrélations de tes 30 derniers jours
                  </p>
                  <button
                    onClick={handleManualAnalysis}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Lancer l'analyse
                  </button>
                  <p className="text-[10px] text-orange-500/70 dark:text-orange-400/70">
                    ~130k tokens • Utilise ton quota IA
                  </p>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyse de vos patterns comportementaux...</span>
                </div>
              )}

              {/* Content - Tableau structuré */}
              {!isLoading && correlations && correlations.length > 0 && (
                <div className="space-y-2">
                  {correlations.map((correlation, idx) => {
                    const colors = getTypeColors(correlation.type || 'concern');
                    const typeEmoji = correlation.type === 'good_news' ? '🎉' :
                                     correlation.type === 'average' ? '📊' : '⚠️';
                    const typeLabel = correlation.type === 'good_news' ? 'Bonne nouvelle' :
                                     correlation.type === 'average' ? 'Neutre' : correlation.impact;

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border-l-3 ${colors.card} space-y-1.5`}
                      >
                        {/* Header compact */}
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${colors.number}`}>
                            {idx + 1}
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${colors.badge}`}>
                            {typeEmoji} {typeLabel}
                          </span>
                        </div>

                        {/* Observation compacte */}
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight">
                          📊 {correlation.observation}
                        </p>

                        {/* Explication */}
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight">
                          {correlation.explication}
                        </p>

                        {/* Action */}
                        <div className={`mt-1 p-2 rounded border ${colors.action}`}>
                          <p className={`text-[11px] font-semibold flex items-start gap-1 ${colors.actionText}`}>
                            <span className="text-xs">💡</span>
                            <span className="flex-1">{correlation.action}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No correlations found */}
              {!isLoading && correlations && correlations.length === 0 && (
                <div className="px-3 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    💡 Continue à tracker tes données pour découvrir des patterns intéressants !
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
