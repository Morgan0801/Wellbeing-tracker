import { motion } from 'framer-motion';
import { Battery, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEnergyCorrelations } from '@/hooks/useEnergyCorrelations';

export function EnergyInsights() {
  const {
    averageEnergy,
    energyTrend,
    topEnergyBoosters,
    topEnergyDrainers,
    hasSufficientData,
  } = useEnergyCorrelations(30);

  if (!hasSufficientData) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Battery className="w-4 h-4 text-orange-500" />
            Analyse d'Énergie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Battery className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Continue à logger ton niveau d'énergie avec tes moods pour des insights ! 🔋
            </p>
            <p className="text-xs mt-2">
              Minimum 5 entrées avec niveau d'énergie requis.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Battery className="w-4 h-4 text-orange-500" />
          Analyse d'Énergie (30 derniers jours)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Moyenne d'énergie */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 p-4 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Niveau d'énergie moyen</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl">🔋</span>
                <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {averageEnergy}/10
                </span>
              </div>
            </div>
            {energyTrend !== 0 && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                energyTrend > 0
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {energyTrend > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {energyTrend > 0 ? '+' : ''}{energyTrend.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Ce qui booste ton énergie */}
        {topEnergyBoosters.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" />
              Ce qui te donne de l'énergie
            </h4>
            <div className="space-y-2">
              {topEnergyBoosters.map((item) => (
                <motion.div
                  key={item.activityId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.activityEmoji}</span>
                    <div>
                      <span className="font-medium text-sm">{item.activityName}</span>
                      <p className="text-xs text-muted-foreground">
                        {item.count} fois observé
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {item.avgEnergyWith}/10
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +{item.difference} vs sans
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Ce qui draine ton énergie */}
        {topEnergyDrainers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2 mb-3">
              <Battery className="w-4 h-4" />
              Ce qui te fatigue
            </h4>
            <div className="space-y-2">
              {topEnergyDrainers.map((item) => (
                <motion.div
                  key={item.activityId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.activityEmoji}</span>
                    <div>
                      <span className="font-medium text-sm">{item.activityName}</span>
                      <p className="text-xs text-muted-foreground">
                        {item.count} fois observé
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {item.avgEnergyWith}/10
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.difference} vs sans
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t text-center">
          <p className="text-xs text-muted-foreground">
            ⚡ Insights basés sur ton niveau d'énergie et tes activités
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
