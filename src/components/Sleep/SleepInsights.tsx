import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Heart, Moon, Users, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSleepCorrelations } from '@/hooks/useSleepCorrelations';

export function SleepInsights() {
  const {
    sleepAloneStats,
    sleepCoupleStats,
    hasSufficientData,
    sleepQualityVsMood,
    sleepDurationVsEnergy,
  } = useSleepCorrelations();

  if (!hasSufficientData) {
    return (
      <Card variant="elevated" className="border-sleep/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="w-4 h-4 text-sleep" />
            Insights Sommeil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Moon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Continue à logger ton sommeil pour découvrir des insights personnalisés ! 💤
            </p>
            <p className="text-xs mt-2">
              Minimum 5 nuits pour générer des statistiques.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasCoupleData = sleepCoupleStats && sleepCoupleStats.count >= 1;
  const hasAloneData = sleepAloneStats && sleepAloneStats.count >= 1;
  const canCompare = hasCoupleData && hasAloneData;

  return (
    <Card variant="elevated" className="border-sleep/10">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Moon className="w-4 h-4 text-sleep" />
          Insights Sommeil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comparaison Seul vs En Couple */}
        {canCompare && (
          <div>
            <h4 className="text-sm font-medium text-sleep mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Impact de dormir en couple
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Seul(e) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800"
              >
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                    Seul(e) 🛏️
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Qualité moy.</span>
                    <span className="font-bold text-blue-700 dark:text-blue-400">
                      {sleepAloneStats.avgQuality}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durée moy.</span>
                    <span className="font-bold text-blue-700 dark:text-blue-400">
                      {sleepAloneStats.avgDuration}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sommeil profond</span>
                    <span className="font-bold text-blue-700 dark:text-blue-400">
                      {sleepAloneStats.avgDeep}h
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    {sleepAloneStats.count} nuits
                  </p>
                </div>
              </motion.div>

              {/* En couple */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-100 dark:border-pink-800"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-semibold text-pink-800 dark:text-pink-300">
                    En couple 💑
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Qualité moy.</span>
                    <span className="font-bold text-pink-700 dark:text-pink-400">
                      {sleepCoupleStats.avgQuality}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durée moy.</span>
                    <span className="font-bold text-pink-700 dark:text-pink-400">
                      {sleepCoupleStats.avgDuration}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sommeil profond</span>
                    <span className="font-bold text-pink-700 dark:text-pink-400">
                      {sleepCoupleStats.avgDeep}h
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    {sleepCoupleStats.count} nuits
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Conclusion */}
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-pink-50 dark:from-blue-900/10 dark:to-pink-900/10 rounded-lg border border-sleep/20">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                {sleepCoupleStats.avgQuality > sleepAloneStats.avgQuality ? (
                  <>
                    💑 <strong>Tu dors mieux en couple !</strong> Qualité {' '}
                    <span className="text-green-600 font-bold">
                      +{(sleepCoupleStats.avgQuality - sleepAloneStats.avgQuality).toFixed(1)}
                    </span>
                    {' '}points en moyenne
                  </>
                ) : sleepCoupleStats.avgQuality < sleepAloneStats.avgQuality ? (
                  <>
                    🛏️ <strong>Tu dors mieux seul(e) !</strong> Qualité {' '}
                    <span className="text-orange-600 font-bold">
                      +{(sleepAloneStats.avgQuality - sleepCoupleStats.avgQuality).toFixed(1)}
                    </span>
                    {' '}points quand tu es seul(e)
                  </>
                ) : (
                  <>✨ <strong>Pas de différence notable</strong> entre dormir seul(e) ou en couple</>
                )}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 border-t border-sleep/10 pt-2">
                ⏱️ <strong>Durée moyenne :</strong> {' '}
                {sleepCoupleStats.avgDuration > sleepAloneStats.avgDuration ? (
                  <>
                    Tu dors <span className="font-semibold text-pink-700 dark:text-pink-400">
                      {(sleepCoupleStats.avgDuration - sleepAloneStats.avgDuration).toFixed(1)}h de plus
                    </span> en couple
                  </>
                ) : sleepCoupleStats.avgDuration < sleepAloneStats.avgDuration ? (
                  <>
                    Tu dors <span className="font-semibold text-blue-700 dark:text-blue-400">
                      {(sleepAloneStats.avgDuration - sleepCoupleStats.avgDuration).toFixed(1)}h de plus
                    </span> seul(e)
                  </>
                ) : (
                  <>Même durée moyenne</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Corrélation Qualité du Sommeil vs Humeur */}
        {sleepQualityVsMood && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-purple-600" />
              <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                Impact sur ton humeur
              </h4>
            </div>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center justify-between">
                <span>Humeur après bon sommeil (8+)</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-700 dark:text-purple-400">
                    {sleepQualityVsMood.goodSleepMood}/10
                  </span>
                  {sleepQualityVsMood.correlation > 0 && (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Humeur après sommeil moyen (&lt;8)</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-700 dark:text-purple-400">
                    {sleepQualityVsMood.poorSleepMood}/10
                  </span>
                  {sleepQualityVsMood.correlation < 0 && (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              {Math.abs(sleepQualityVsMood.correlation) > 0.5 && (
                <p className="pt-2 text-xs border-t border-purple-200 dark:border-purple-800">
                  💡 <strong>Forte corrélation :</strong> Ton humeur est {' '}
                  {sleepQualityVsMood.correlation > 0 ? 'significativement meilleure' : 'affectée'} après une bonne nuit.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Corrélation Durée du Sommeil vs Énergie */}
        {sleepDurationVsEnergy && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔋</span>
              <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                Impact sur ton énergie
              </h4>
            </div>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center justify-between">
                <span>Énergie après 7h+ de sommeil</span>
                <span className="font-bold text-orange-700 dark:text-orange-400">
                  {sleepDurationVsEnergy.longSleepEnergy}/10
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Énergie après &lt;7h de sommeil</span>
                <span className="font-bold text-orange-700 dark:text-orange-400">
                  {sleepDurationVsEnergy.shortSleepEnergy}/10
                </span>
              </div>
              {Math.abs(sleepDurationVsEnergy.difference) > 1 && (
                <p className="pt-2 text-xs border-t border-orange-200 dark:border-orange-800">
                  ⚡ <strong>Impact notable :</strong> {sleepDurationVsEnergy.difference > 0 ? '+' : ''}
                  {sleepDurationVsEnergy.difference.toFixed(1)} points d'énergie avec plus de sommeil
                </p>
              )}
            </div>
          </motion.div>
        )}

        <div className="pt-2 border-t text-center">
          <p className="text-xs text-muted-foreground">
            💤 Ces insights sont basés sur tes données de sommeil et d'humeur
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
