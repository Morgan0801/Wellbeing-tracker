import { useState, useMemo } from 'react';
import { useMood } from '@/hooks/useMood';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MoodLog } from '@/types';

type Period = '7days' | '30days' | '90days';

export function MoodTimeline() {
  const { moods } = useMood();
  const [period, setPeriod] = useState<Period>('7days');

  const daysMap = {
    '7days': 7,
    '30days': 30,
    '90days': 90,
  };

  const chartData = useMemo(() => {
    const days = daysMap[period];
    const now = new Date();
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, 'yyyy-MM-dd');

      // Trouver toutes les entrées de ce jour
      const dayEntries = moods.filter(
        (entry: MoodLog) => format(new Date(entry.datetime), 'yyyy-MM-dd') === dateStr
      );

      if (dayEntries.length > 0) {
        // Calculer le score moyen du jour
        const avgScore = dayEntries.reduce((sum: number, entry: MoodLog) => sum + entry.score_global, 0) / dayEntries.length;

        data.push({
          date: dateStr,
          score: Math.round(avgScore * 10) / 10,
          displayDate: format(date, period === '7days' ? 'EEE' : 'dd/MM', { locale: fr }),
          fullDate: format(date, 'dd MMMM yyyy', { locale: fr }),
          entries: dayEntries.length,
        });
      } else {
        data.push({
          date: dateStr,
          score: null,
          displayDate: format(date, period === '7days' ? 'EEE' : 'dd/MM', { locale: fr }),
          fullDate: format(date, 'dd MMMM yyyy', { locale: fr }),
          entries: 0,
        });
      }
    }

    return data;
  }, [moods, period]);

  const getScoreColor = (score: number | null) => {
    if (score === null) return '#94a3b8';
    if (score >= 8) return '#22c55e';
    if (score >= 6) return '#84cc16';
    if (score >= 4) return '#facc15';
    if (score >= 2) return '#fb923c';
    return '#ef4444';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 md:p-3 shadow-lg">
          <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
            {data.fullDate}
          </p>
          {data.score !== null ? (
            <>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
                Score: <span className="font-bold" style={{ color: getScoreColor(data.score) }}>
                  {data.score}/10
                </span>
              </p>
              <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                {data.entries} entrée{data.entries > 1 ? 's' : ''}
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Aucune entrée</p>
          )}
        </div>
      );
    }
    return null;
  };

  const hasData = chartData.some((d) => d.score !== null);

  return (
    <Card className="p-2 md:p-4">
      <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-4">
          <CardTitle className="text-sm md:text-lg flex items-center gap-1 md:gap-2">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
            <span>Évolution de l'humeur</span>
          </CardTitle>

          <div className="flex gap-1 md:gap-2">
            <Button
              variant={period === '7days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('7days')}
              className="h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm"
            >
              7j
            </Button>
            <Button
              variant={period === '30days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('30days')}
              className="h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm"
            >
              30j
            </Button>
            <Button
              variant={period === '90days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('90days')}
              className="h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm"
            >
              90j
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2 md:p-6 pt-0 md:pt-2">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-8 md:py-12 text-gray-500 dark:text-gray-400">
            <TrendingUp className="w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-3 opacity-20" />
            <p className="text-xs md:text-sm text-center">
              Aucune donnée d'humeur pour cette période
            </p>
            <p className="text-[10px] md:text-xs text-center mt-1">
              Commencez à enregistrer votre humeur pour voir l'évolution
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={period === '7days' ? 200 : 180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: period === '7days' ? 11 : 9 }}
                stroke="#6b7280"
                className="dark:stroke-gray-400"
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
                className="dark:stroke-gray-400"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorScore)"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
