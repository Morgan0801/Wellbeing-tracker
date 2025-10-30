import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lightbulb, TrendingUp, TrendingDown, Heart } from 'lucide-react';
import { useMood } from '@/hooks/useMood';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getMoodEmoji } from '@/lib/utils';

export function MoodInsights() {
  const { moods } = useMood();

  const insights = useMemo(() => {
    // Derniers 30 jours
    const last30Days = subDays(new Date(), 30);
    const recentMoods = moods.filter(m => new Date(m.datetime) >= last30Days);

    if (recentMoods.length === 0) {
      return null;
    }

    // Meilleur jour
    const bestDay = [...recentMoods].sort((a, b) => b.score_global - a.score_global)[0];

    // Pire jour
    const worstDay = [...recentMoods].sort((a, b) => a.score_global - b.score_global)[0];

    // Émotions les plus fréquentes
    const emotionCounts: Record<string, number> = {};
    recentMoods.forEach(mood => {
      mood.emotions.forEach((emotion: string) => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    });

    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion]) => emotion);

    // Domaines les plus impactants (positifs et négatifs)
    const domainImpacts: Record<string, { positive: number; negative: number; count: number }> = {};

    recentMoods.forEach(mood => {
      if (mood.domains) {
        mood.domains.forEach((domain: any) => {
          if (!domainImpacts[domain.domain]) {
            domainImpacts[domain.domain] = { positive: 0, negative: 0, count: 0 };
          }
          if (domain.impact > 0) {
            domainImpacts[domain.domain].positive += domain.impact;
          } else {
            domainImpacts[domain.domain].negative += Math.abs(domain.impact);
          }
          domainImpacts[domain.domain].count++;
        });
      }
    });

    const bestDomain = Object.entries(domainImpacts)
      .sort((a, b) => b[1].positive - a[1].positive)
      .filter(([_, data]) => data.positive > 0)[0];

    const worstDomain = Object.entries(domainImpacts)
      .sort((a, b) => b[1].negative - a[1].negative)
      .filter(([_, data]) => data.negative > 0)[0];

    return {
      bestDay,
      worstDay,
      topEmotions,
      bestDomain: bestDomain ? bestDomain[0] : null,
      worstDomain: worstDomain ? worstDomain[0] : null,
      totalMoods: recentMoods.length,
    };
  }, [moods]);

  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
            Insights émotionnels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lightbulb className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">
              Pas assez de données pour générer des insights.
              <br />
              Continue à logger tes humeurs !
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const domainLabels: Record<string, string> = {
    travail: 'Travail',
    sport: 'Sport',
    amour: 'Amour',
    amis: 'Amis',
    famille: 'Famille',
    finances: 'Finances',
    loisirs: 'Loisirs',
    bienetre: 'Bien-être',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
          Insights émotionnels (30 derniers jours)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Meilleurs et pires moments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Meilleur moment */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">
                Meilleur moment
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{getMoodEmoji(insights.bestDay.score_global)}</span>
              <span className="text-2xl font-bold text-green-600">{insights.bestDay.score_global}/10</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {format(new Date(insights.bestDay.datetime), 'd MMMM yyyy', { locale: fr })}
            </p>
            {insights.bestDay.note && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic line-clamp-2">
                "{insights.bestDay.note}"
              </p>
            )}
          </motion.div>

          {/* Pire moment */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                Moment difficile
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{getMoodEmoji(insights.worstDay.score_global)}</span>
              <span className="text-2xl font-bold text-orange-600">{insights.worstDay.score_global}/10</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {format(new Date(insights.worstDay.datetime), 'd MMMM yyyy', { locale: fr })}
            </p>
            {insights.worstDay.note && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic line-clamp-2">
                "{insights.worstDay.note}"
              </p>
            )}
          </motion.div>
        </div>

        {/* Émotions fréquentes */}
        {insights.topEmotions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                Émotions les plus fréquentes
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {insights.topEmotions.map((emotion) => (
                <span
                  key={emotion}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium"
                >
                  {emotion}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Domaines de vie */}
        {(insights.bestDomain || insights.worstDomain) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg"
          >
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
              Domaines de vie
            </h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {insights.bestDomain && (
                <p>
                  ✅ <strong>{domainLabels[insights.bestDomain] || insights.bestDomain}</strong> t'apporte
                  le plus de satisfaction
                </p>
              )}
              {insights.worstDomain && (
                <p>
                  ⚠️ <strong>{domainLabels[insights.worstDomain] || insights.worstDomain}</strong> semble
                  être source de stress
                </p>
              )}
            </div>
          </motion.div>
        )}

        <p className="text-xs text-gray-500 text-center pt-2">
          Basé sur {insights.totalMoods} entrée{insights.totalMoods > 1 ? 's' : ''} des 30 derniers jours
        </p>
      </CardContent>
    </Card>
  );
}
