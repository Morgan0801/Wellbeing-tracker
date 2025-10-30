import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Moon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useSleep } from '@/hooks/useSleep';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMemo } from 'react';

export function SleepChart() {
  const { sleepLogs } = useSleep();

  // Préparer les données pour les 30 derniers jours
  const chartData = useMemo(() => {
    const data: { date: string, hours: number, quality: number, displayDate: string }[] = [];
    const sleepByDay: Record<string, { hours: number; quality: number }> = {};

    sleepLogs.forEach((log) => {
      const dateKey = format(new Date(log.date), 'yyyy-MM-dd');
      sleepByDay[dateKey] = {
        hours: log.total_hours,
        quality: log.quality_score,
      };
    });

    // Générer les 30 derniers jours
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const sleepData = sleepByDay[dateKey];

      data.push({
        date: dateKey,
        hours: sleepData?.hours || 0,
        quality: sleepData?.quality || 0,
        displayDate: format(date, 'd MMM', { locale: fr }),
      });
    }

    return data;
  }, [sleepLogs]);

  const avgSleep30d = useMemo(() => {
    const last30Days = subDays(new Date(), 30);
    const recentLogs = sleepLogs.filter((log) => new Date(log.date) >= last30Days);
    if (recentLogs.length === 0) return 0;
    return Math.round((recentLogs.reduce((sum, log) => sum + log.total_hours, 0) / recentLogs.length) * 10) / 10;
  }, [sleepLogs]);

  const avgQuality30d = useMemo(() => {
    const last30Days = subDays(new Date(), 30);
    const recentLogs = sleepLogs.filter((log) => new Date(log.date) >= last30Days);
    if (recentLogs.length === 0) return 0;
    return Math.round((recentLogs.reduce((sum, log) => sum + log.quality_score, 0) / recentLogs.length) * 10) / 10;
  }, [sleepLogs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <Moon className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
          Évolution du sommeil (30 jours)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 && chartData.some(d => d.hours > 0) ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs md:text-sm text-gray-500">Durée moyenne</p>
                <p className="text-xl md:text-2xl font-bold text-indigo-600">{avgSleep30d}h</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Qualité moyenne</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">{avgQuality30d}/10</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Heures', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10 }}
                  domain={[0, 10]}
                  label={{ value: 'Qualité', angle: 90, position: 'insideRight', style: { fontSize: 10 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ fontWeight: 'bold' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'hours') return [`${value}h`, 'Durée'];
                    if (name === 'quality') return [`${value}/10`, 'Qualité'];
                    return [value, name];
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="hours"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="hours"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="quality"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="quality"
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="text-center py-8">
            <Moon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">
              Commence à logger ton sommeil pour voir ton évolution !
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
