import { motion } from 'framer-motion';
import { Users, User, Sparkles, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdvancedMoodInsights } from '@/hooks/useAdvancedMoodInsights';

export function AdvancedMoodInsights() {
  const {
    socialPatterns,
    winningCombinations,
    hasSufficientData,
  } = useAdvancedMoodInsights(30);

  if (!hasSufficientData) {
    return null;
  }

  const hasSocialData = socialPatterns.social || socialPatterns.alone;
  const hasContent = hasSocialData || winningCombinations.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Patterns & Insights Avancés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pattern Social vs Seul */}
        {socialPatterns.social && socialPatterns.alone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-purple-600" />
              <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                Social vs Temps pour soi
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Social */}
              <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg border border-pink-200 dark:border-pink-800">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-medium text-pink-800 dark:text-pink-300">
                    Moments sociaux
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Humeur:</span>
                    <span className="font-bold text-pink-600">
                      {socialPatterns.social.avgMood}/10
                    </span>
                  </div>
                  {socialPatterns.social.avgEnergy > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Énergie:</span>
                      <span className="font-bold text-orange-600">
                        {socialPatterns.social.avgEnergy}/10
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-1">
                    {socialPatterns.social.count} entrées
                  </p>
                </div>
              </div>

              {/* Seul */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                    Temps pour soi
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Humeur:</span>
                    <span className="font-bold text-indigo-600">
                      {socialPatterns.alone.avgMood}/10
                    </span>
                  </div>
                  {socialPatterns.alone.avgEnergy > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Énergie:</span>
                      <span className="font-bold text-orange-600">
                        {socialPatterns.alone.avgEnergy}/10
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-1">
                    {socialPatterns.alone.count} entrées
                  </p>
                </div>
              </div>
            </div>

            {/* Conclusion */}
            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {socialPatterns.social.avgMood > socialPatterns.alone.avgMood ? (
                  <>
                    💝 <strong>Tu t'épanouis dans les moments sociaux !</strong> Humeur{' '}
                    <span className="text-green-600 font-bold">
                      +{(socialPatterns.social.avgMood - socialPatterns.alone.avgMood).toFixed(1)}
                    </span>
                    {' '}points avec d'autres personnes.
                  </>
                ) : socialPatterns.alone.avgMood > socialPatterns.social.avgMood ? (
                  <>
                    🧘 <strong>Tu te ressources dans la solitude !</strong> Humeur{' '}
                    <span className="text-green-600 font-bold">
                      +{(socialPatterns.alone.avgMood - socialPatterns.social.avgMood).toFixed(1)}
                    </span>
                    {' '}points pendant tes moments seul(e).
                  </>
                ) : (
                  <>✨ <strong>Équilibre parfait !</strong> Tu te sens aussi bien seul(e) qu'avec d'autres.</>
                )}
              </p>
            </div>
          </motion.div>
        )}

        {/* Combinaisons gagnantes */}
        {winningCombinations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-green-600" />
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">
                Combinaisons gagnantes
              </h4>
            </div>
            <div className="space-y-2">
              {winningCombinations.map((combo, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-100 dark:border-green-900"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {combo.emojis.map((emoji, i) => (
                        <span key={i} className="text-xl">{emoji}</span>
                      ))}
                      <span className="text-sm font-medium">
                        {combo.activities.join(' + ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Humeur</div>
                        <div className="text-sm font-bold text-green-600">
                          {combo.avgMood}/10
                        </div>
                      </div>
                      {combo.avgEnergy > 0 && (
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Énergie</div>
                          <div className="text-sm font-bold text-orange-600">
                            {combo.avgEnergy}/10
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Observé {combo.count} fois
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              💡 Ces combinaisons d'activités te font du bien !
            </p>
          </motion.div>
        )}

        <div className="pt-2 border-t text-center">
          <p className="text-xs text-muted-foreground">
            🔍 Analyses basées sur tes patterns d'humeur, énergie et activités des 30 derniers jours
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
