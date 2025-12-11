import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMood } from '@/hooks/useMood';
import { useSleep } from '@/hooks/useSleep';
import { useSleepCorrelations } from '@/hooks/useSleepCorrelations';
import { useEnergyCorrelations } from '@/hooks/useEnergyCorrelations';
import { useActivityCorrelations } from '@/hooks/useActivityCorrelations';
import { useAdvancedMoodInsights } from '@/hooks/useAdvancedMoodInsights';
import { useMemo } from 'react';
import { subDays, parseISO } from 'date-fns';

export function CrossInsights() {
  const { moods } = useMood();
  const { sleepLogs } = useSleep();
  const { sleepQualityVsMood, sleepAloneStats, sleepCoupleStats } = useSleepCorrelations();
  const { topEnergyBoosters, topEnergyDrainers, averageEnergy } = useEnergyCorrelations(30);
  const { positiveCorrelations, negativeCorrelations } = useActivityCorrelations(30);
  const { socialPatterns, winningCombinations } = useAdvancedMoodInsights(30);

  // Générer des insights intelligents basés sur toutes les données
  const insights = useMemo(() => {
    const results: { type: 'positive' | 'warning' | 'info'; text: string; emoji: string }[] = [];

    // Insight 1: Sommeil et humeur
    if (sleepQualityVsMood && Math.abs(sleepQualityVsMood.correlation) > 0.3) {
      results.push({
        type: 'positive',
        emoji: '😴',
        text: `Ton humeur est ${sleepQualityVsMood.correlation > 0 ? 'meilleure' : 'moins bonne'} de ${Math.abs(sleepQualityVsMood.goodSleepMood - sleepQualityVsMood.poorSleepMood).toFixed(1)} points après une bonne nuit.`,
      });
    }

    // Insight 2: Top activité positive
    if (positiveCorrelations.length > 0) {
      const top = positiveCorrelations[0];
      results.push({
        type: 'positive',
        emoji: top.activityEmoji,
        text: `${top.activityName} améliore ton humeur de ${top.difference} points en moyenne !`,
      });
    }

    // Insight 3: Activité négative à éviter
    if (negativeCorrelations.length > 0) {
      const worst = negativeCorrelations[0];
      results.push({
        type: 'warning',
        emoji: worst.activityEmoji,
        text: `${worst.activityName} semble réduire ton humeur de ${Math.abs(worst.difference)} points.`,
      });
    }

    // Insight 4: Énergie - booster
    if (topEnergyBoosters.length > 0) {
      const top = topEnergyBoosters[0];
      results.push({
        type: 'positive',
        emoji: top.activityEmoji,
        text: `${top.activityName} te donne un boost d'énergie de +${top.difference} points.`,
      });
    }

    // Insight 5: Énergie - drainer
    if (topEnergyDrainers.length > 0) {
      const worst = topEnergyDrainers[0];
      results.push({
        type: 'warning',
        emoji: worst.activityEmoji,
        text: `${worst.activityName} réduit ton énergie de ${worst.difference} points.`,
      });
    }

    // Insight 6: Tendance humeur récente
    const last7Days = moods.filter(m => parseISO(m.datetime) >= subDays(new Date(), 7));
    const previous7Days = moods.filter(m => {
      const date = parseISO(m.datetime);
      return date >= subDays(new Date(), 14) && date < subDays(new Date(), 7);
    });

    if (last7Days.length > 0 && previous7Days.length > 0) {
      const recentAvg = last7Days.reduce((sum, m) => sum + m.score_global, 0) / last7Days.length;
      const previousAvg = previous7Days.reduce((sum, m) => sum + m.score_global, 0) / previous7Days.length;
      const diff = recentAvg - previousAvg;

      if (Math.abs(diff) > 0.5) {
        results.push({
          type: diff > 0 ? 'positive' : 'warning',
          emoji: diff > 0 ? '📈' : '📉',
          text: `Ton humeur ${diff > 0 ? 'augmente' : 'diminue'} de ${Math.abs(diff).toFixed(1)} points cette semaine.`,
        });
      }
    }

    // Insight 7: Qualité sommeil récente
    const recentSleep = sleepLogs.filter(s => parseISO(s.date) >= subDays(new Date(), 7));
    if (recentSleep.length >= 3) {
      const avgQuality = recentSleep.reduce((sum, s) => sum + s.quality_score, 0) / recentSleep.length;
      if (avgQuality >= 8) {
        results.push({
          type: 'positive',
          emoji: '🌙',
          text: `Excellente semaine de sommeil ! Qualité moyenne de ${avgQuality.toFixed(1)}/10.`,
        });
      } else if (avgQuality < 6) {
        results.push({
          type: 'warning',
          emoji: '😴',
          text: `Ton sommeil pourrait être amélioré. Qualité moyenne de ${avgQuality.toFixed(1)}/10.`,
        });
      }
    }

    // Insight 8: Pattern social
    if (socialPatterns.social && socialPatterns.alone) {
      const diff = socialPatterns.social.avgMood - socialPatterns.alone.avgMood;
      if (Math.abs(diff) > 0.8) {
        results.push({
          type: diff > 0 ? 'positive' : 'info',
          emoji: diff > 0 ? '💝' : '🧘',
          text: diff > 0
            ? `Les moments sociaux boostent ton humeur de +${diff.toFixed(1)} points !`
            : `Tu te ressources mieux dans la solitude (+${Math.abs(diff).toFixed(1)} points).`,
        });
      }
    }

    // Insight 10: Sommeil seul vs couple
    if (sleepAloneStats && sleepCoupleStats && sleepAloneStats.count >= 1 && sleepCoupleStats.count >= 1) {
      const diff = sleepCoupleStats.avgQuality - sleepAloneStats.avgQuality;
      if (Math.abs(diff) > 0.5) {
        results.push({
          type: diff > 0 ? 'positive' : 'info',
          emoji: diff > 0 ? '💑' : '🛏️',
          text: diff > 0
            ? `Tu dors mieux en couple ! Qualité +${diff.toFixed(1)} points.`
            : `Tu dors mieux seul(e) ! Qualité +${Math.abs(diff).toFixed(1)} points.`,
        });
      }
    }

    // Insight 11: Combinaison gagnante
    if (winningCombinations.length > 0) {
      const best = winningCombinations[0];
      results.push({
        type: 'positive',
        emoji: '✨',
        text: `${best.activities.join(' + ')} : combo parfait avec ${best.avgMood}/10 d'humeur !`,
      });
    }

    // Insight 12: Niveau d'énergie
    if (averageEnergy > 0) {
      if (averageEnergy >= 7) {
        results.push({
          type: 'positive',
          emoji: '⚡',
          text: `Super énergie ce mois ! Moyenne de ${averageEnergy}/10.`,
        });
      } else if (averageEnergy < 5) {
        results.push({
          type: 'warning',
          emoji: '🔋',
          text: `Ton énergie est basse (${averageEnergy}/10). Pense à te reposer !`,
        });
      }
    }

    return results;
  }, [moods, sleepLogs, sleepQualityVsMood, positiveCorrelations, negativeCorrelations, topEnergyBoosters, topEnergyDrainers, socialPatterns, sleepAloneStats, sleepCoupleStats, winningCombinations, averageEnergy]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card variant="elevated" className="border-primary/10">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Insights Personnalisés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.slice(0, 6).map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-lg border ${
              insight.type === 'positive'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : insight.type === 'warning'
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{insight.emoji}</span>
              <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {insight.text}
              </p>
              {insight.type === 'positive' && (
                <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />
              )}
              {insight.type === 'warning' && (
                <TrendingDown className="w-4 h-4 text-orange-600 flex-shrink-0" />
              )}
            </div>
          </motion.div>
        ))}

        <div className="pt-2 border-t text-center">
          <p className="text-xs text-muted-foreground">
            ✨ Insights générés à partir de tes habitudes, humeur, sommeil et activités
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
