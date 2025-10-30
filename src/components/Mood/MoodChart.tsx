import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { useMood } from '@/hooks/useMood';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getMoodEmoji } from '@/lib/utils';

// Composant personnalisé pour afficher un emoji au lieu d'un point
const EmojiDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload.score) return null;

  const emoji = getMoodEmoji(payload.score);

  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="16"
      style={{ userSelect: 'none' }}
    >
      {emoji}
    </text>
  );
};

export function MoodChart() {
  const { moods } = useMood();
  const [period, setPeriod] = useState<7 | 30>(7);

  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    const data: { date: string, score: number | null, displayDate: string }[] = [];

    // Créer un map pour calculer la moyenne par jour
    const scoresByDay: Record<string, number[]> = {};

    moods.forEach((mood) => {
      const dateKey = format(new Date(mood.datetime), 'yyyy-MM-dd');
      if (!scoresByDay[dateKey]) {
        scoresByDay[dateKey] = [];
      }
      scoresByDay[dateKey].push(mood.score_global);
    });

    // Générer les X derniers jours
    for (let i = period - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const scores = scoresByDay[dateKey];

      const avgScore = scores && scores.length > 0
        ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10
        : null;

      data.push({
        date: dateKey,
        score: avgScore,
        displayDate: i === 0 ? "Aujourd'hui" : format(date, 'd MMM', { locale: fr }),
      });
    }

    return data;
  }, [moods, period]);

  const avgScore = useMemo(() => {
    const scores = chartData.filter(d => d.score !== null).map(d => d.score!);
    if (scores.length === 0) return null;
    return Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10;
  }, [chartData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-pink-500" />
          Évolution de l'humeur
        </CardTitle>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setPeriod(7)}
            className={`px-3 py-1 rounded-lg text-xs md:text-sm font-medium transition-colors ${
              period === 7
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            7j
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setPeriod(30)}
            className={`px-3 py-1 rounded-lg text-xs md:text-sm font-medium transition-colors ${
              period === 30
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            30j
          </motion.button>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.some(d => d.score !== null) ? (
          <>
            {avgScore !== null && (
              <div className="mb-4 flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500">Moyenne sur {period} jours</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getMoodEmoji(avgScore)}</span>
                    <span className="text-2xl md:text-3xl font-bold text-pink-600">{avgScore}/10</span>
                  </div>
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fontSize: 10 }}
                  ticks={[0, 2, 4, 6, 8, 10]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ fontWeight: 'bold' }}
                  formatter={(value: any) => {
                    if (value === null || value === undefined) return ['Pas de données', 'Humeur'];
                    return [`${value}/10 ${getMoodEmoji(Number(value))}`, 'Humeur'];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#ec4899"
                  strokeWidth={3}
                  fill="url(#colorScore)"
                  connectNulls={false}
                  dot={<EmojiDot />}
                  activeDot={<EmojiDot />}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">
              Commence à logger tes humeurs pour voir l'évolution !
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
