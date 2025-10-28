import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useSleep } from '@/hooks/useSleep';
import { useMood } from '@/hooks/useMood';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { format } from 'date-fns';

interface CorrelationPoint {
  sleepHours: number;
  moodScore: number;
  quality: number;
  date: string;
}

export function SleepMoodCorrelation() {
  const { sleepLogs } = useSleep();
  const { moods } = useMood();

  const correlationData = useMemo(() => {
    if (sleepLogs.length === 0 || moods.length === 0) return null;

    const points: CorrelationPoint[] = [];

    // Créer un map de date -> sleep
    const sleepByDate = new Map<string, { hours: number; quality: number }>();
    sleepLogs.forEach((log) => {
      const dateKey = format(new Date(log.date), 'yyyy-MM-dd');
      sleepByDate.set(dateKey, {
        hours: log.total_hours,
        quality: log.quality_score,
      });
    });

    // Pour chaque mood, trouver le sommeil de la veille
    moods.forEach((mood) => {
      const moodDate = new Date(mood.datetime);
      const previousDay = new Date(moodDate);
      previousDay.setDate(previousDay.getDate() - 1);
      const prevDateKey = format(previousDay, 'yyyy-MM-dd');

      const sleep = sleepByDate.get(prevDateKey);
      if (sleep) {
        points.push({
          sleepHours: sleep.hours,
          moodScore: mood.score_global,
          quality: sleep.quality,
          date: format(moodDate, 'dd/MM'),
        });
      }
    });

    if (points.length === 0) return null;

    // Calculer la moyenne d'humeur par tranche de sommeil
    const hourRanges = [
      { min: 0, max: 5, label: '<5h' },
      { min: 5, max: 6, label: '5-6h' },
      { min: 6, max: 7, label: '6-7h' },
      { min: 7, max: 8, label: '7-8h' },
      { min: 8, max: 10, label: '8-9h' },
      { min: 9, max: 12, label: '>9h' },
    ];

    const insights = hourRanges.map((range) => {
      const inRange = points.filter((p) => p.sleepHours >= range.min && p.sleepHours < range.max);
      if (inRange.length === 0) return null;

      const avgMood = inRange.reduce((sum, p) => sum + p.moodScore, 0) / inRange.length;
      return {
        range: range.label,
        avgMood: avgMood.toFixed(1),
        count: inRange.length,
      };
    }).filter((i) => i !== null);

    // Trouver la meilleure tranche
    const bestRange = insights.reduce((best, current) => {
      return parseFloat(current!.avgMood) > parseFloat(best!.avgMood) ? current : best;
    }, insights[0]);

    return {
      points,
      insights,
      bestRange,
    };
  }, [sleepLogs, moods]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 md:p-3 shadow-lg">
          <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
            {data.date}
          </p>
          <p className="text-xs md:text-sm text-indigo-600 dark:text-indigo-400">
            Sommeil: {data.sleepHours.toFixed(1)}h
          </p>
          <p className="text-xs md:text-sm text-pink-600 dark:text-pink-400">
            Humeur: {data.moodScore}/10
          </p>
          <p className="text-[10px] md:text-xs text-gray-500">
            Qualité: {data.quality}/10
          </p>
        </div>
      );
    }
    return null;
  };

  if (!correlationData || correlationData.points.length < 3) {
    return (
      <Card className="p-2 md:p-4">
        <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
          <CardTitle className="text-sm md:text-lg flex items-center gap-1 md:gap-2">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
            <span>Sommeil vs Humeur</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-6 pt-0">
          <div className="flex flex-col items-center justify-center py-8 md:py-12 text-gray-500 dark:text-gray-400">
            <TrendingUp className="w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-3 opacity-20" />
            <p className="text-xs md:text-sm text-center">
              Pas assez de données pour analyser la corrélation
            </p>
            <p className="text-[10px] md:text-xs text-center mt-1">
              Continue à enregistrer ton sommeil et ton humeur
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-2 md:p-4">
      <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
        <CardTitle className="text-sm md:text-lg flex items-center gap-1 md:gap-2">
          <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
          <span>Sommeil vs Humeur</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-2 md:p-6 pt-0">
        {/* Insight principal */}
        {correlationData.bestRange && (
          <div className="mb-3 md:mb-4 p-2 md:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs md:text-sm text-purple-900 dark:text-purple-100">
              💡 <span className="font-semibold">Meilleure humeur</span> après{' '}
              <span className="font-bold">{correlationData.bestRange.range}</span> de sommeil
              <span className="text-[10px] md:text-xs text-purple-700 dark:text-purple-300 ml-1">
                (moy. {correlationData.bestRange.avgMood}/10)
              </span>
            </p>
          </div>
        )}

        {/* Scatter plot */}
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis
              type="number"
              dataKey="sleepHours"
              name="Sommeil"
              unit="h"
              domain={[0, 12]}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              label={{ value: 'Heures de sommeil', position: 'bottom', fontSize: 10, fill: '#6b7280', offset: 0 }}
            />
            <YAxis
              type="number"
              dataKey="moodScore"
              name="Humeur"
              unit="/10"
              domain={[0, 10]}
              tick={{ fontSize: 10, fill: '#6b7280' }}
            />
            <ZAxis type="number" dataKey="quality" range={[30, 150]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              data={correlationData.points}
              fill="#8b5cf6"
              fillOpacity={0.6}
              stroke="#7c3aed"
              strokeWidth={1}
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Stats par tranche */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1 md:gap-2 mt-3 md:mt-4">
          {correlationData.insights.map((insight) => (
            <div
              key={insight!.range}
              className={`text-center p-1.5 md:p-2 rounded-lg ${
                insight === correlationData.bestRange
                  ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700'
                  : 'bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400">
                {insight!.range}
              </div>
              <div className="text-xs md:text-sm font-bold text-purple-600 dark:text-purple-400">
                {insight!.avgMood}
              </div>
              <div className="text-[8px] md:text-[10px] text-gray-500">
                ({insight!.count})
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
