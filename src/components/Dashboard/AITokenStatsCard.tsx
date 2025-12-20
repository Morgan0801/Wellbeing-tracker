import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { aiTokenLogger } from '@/services/aiTokenLogger';

export function AITokenStatsCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [period, setPeriod] = useState(30); // jours

  const stats = aiTokenLogger.getStats(period);

  // Trier par tokens décroissant
  const sortedFeatures = Object.entries(stats.byFeature).sort(
    (a, b) => b[1].totalTokens - a[1].totalTokens
  );

  const handleExportCSV = () => {
    aiTokenLogger.downloadCSV();
  };

  const handleClearLogs = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer tous les logs de tokens ? Cette action est irréversible.')) {
      aiTokenLogger.clearLogs();
      window.location.reload();
    }
  };

  if (stats.totalTokens === 0) {
    return null; // Ne rien afficher si pas d'utilisation
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              Utilisation API IA
            </h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-800 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-purple-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-purple-500" />
            )}
          </button>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white dark:bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Tokens</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {stats.totalTokens.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Coût Estimé</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              ${stats.totalCost.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Détails étendus */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t border-purple-200 dark:border-purple-700">
            {/* Sélecteur de période */}
            <div className="flex gap-2">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setPeriod(days)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    period === days
                      ? 'bg-purple-500 text-white'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800'
                  }`}
                >
                  {days}j
                </button>
              ))}
            </div>

            {/* Stats par fonctionnalité */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                Par Fonctionnalité ({period} derniers jours)
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sortedFeatures.map(([feature, data]) => {
                  const percentage = ((data.totalTokens / stats.totalTokens) * 100).toFixed(1);
                  return (
                    <div
                      key={feature}
                      className="p-2 bg-white dark:bg-gray-800/50 rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                          {percentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{data.calls} appels</span>
                        <span>•</span>
                        <span>{data.totalTokens.toLocaleString()} tokens</span>
                        <span>•</span>
                        <span>${data.cost.toFixed(4)}</span>
                      </div>
                      {/* Barre de progression */}
                      <div className="h-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 dark:bg-purple-400 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExportCSV}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Exporter CSV
              </button>
              <button
                onClick={handleClearLogs}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
                title="Effacer les logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Info */}
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              💡 Prix Gemini 2.5 Flash: $0.30/1M input, $2.50/1M output tokens (cache: $0.03/1M)
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
