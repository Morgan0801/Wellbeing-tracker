import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActivityCorrelations } from '@/hooks/useActivityCorrelations';

export function ActivityInsights() {
    const {
        positiveCorrelations,
        negativeCorrelations,
        contexteCorrelations,
        hasEnoughData
    } = useActivityCorrelations(30);

    if (!hasEnoughData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        Corrélations Activités-Humeur
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">
                            Continue à logger tes activités et ton humeur pour découvrir
                            les corrélations ! 📊
                        </p>
                        <p className="text-xs mt-2">
                            Minimum 5 jours de données pour chaque activité.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    Impact sur ton humeur (30 derniers jours)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Contexte de vie */}
                {contexteCorrelations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-2 mb-3">
                      🌍 Contexte de vie & humeur
                    </h4>
                    <div className="space-y-2">
                      {contexteCorrelations.map((corr) => (
                        <motion.div
                          key={corr.activityId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            corr.isPositive
                              ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                              : 'bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{corr.activityEmoji}</span>
                            <div>
                              <span className="font-medium text-sm">{corr.activityName}</span>
                              <p className="text-xs text-muted-foreground">
                                {corr.daysWithActivity} jour{corr.daysWithActivity > 1 ? 's' : ''} de données
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${corr.isPositive ? 'text-orange-600' : 'text-slate-500'}`}>
                              {corr.isPositive ? '+' : ''}{corr.difference}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              moy. {corr.avgMoodWith}/10
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    {contexteCorrelations.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2 px-1">
                        Différence de score par rapport à tes journées sans ce contexte.
                        {contexteCorrelations.some(c => c.significance === 'low') && ' (⚠️ peu de données — continue à logger !)'}
                      </p>
                    )}
                  </div>
                )}

                {/* Positive Correlations */}
                {positiveCorrelations.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4" />
                            Ce qui améliore ton humeur
                        </h4>
                        <div className="space-y-2">
                            {positiveCorrelations.map((corr) => (
                                <motion.div
                                    key={corr.activityId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{corr.activityEmoji}</span>
                                        <div>
                                            <span className="font-medium text-sm">{corr.activityName}</span>
                                            <p className="text-xs text-muted-foreground">
                                                {corr.daysWithActivity} jours avec, {corr.daysWithoutActivity} jours sans
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-green-600">+{corr.difference}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {corr.avgMoodWith} vs {corr.avgMoodWithout}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Negative Correlations */}
                {negativeCorrelations.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2 mb-3">
                            <TrendingDown className="w-4 h-4" />
                            Ce qui diminue ton humeur
                        </h4>
                        <div className="space-y-2">
                            {negativeCorrelations.map((corr) => (
                                <motion.div
                                    key={corr.activityId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{corr.activityEmoji}</span>
                                        <div>
                                            <span className="font-medium text-sm">{corr.activityName}</span>
                                            <p className="text-xs text-muted-foreground">
                                                {corr.daysWithActivity} jours avec, {corr.daysWithoutActivity} jours sans
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-red-600">{corr.difference}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {corr.avgMoodWith} vs {corr.avgMoodWithout}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary */}
                <div className="pt-3 border-t text-center">
                    <p className="text-xs text-muted-foreground">
                        💡 Ces insights sont basés sur tes données. Plus tu logges, plus ils sont précis !
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
