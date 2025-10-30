import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useXPHistory } from '@/hooks/useXPHistory';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMemo } from 'react';

export function XPChart() {
  const { xpHistory } = useXPHistory();

  // Préparer les données pour les 30 derniers jours
  const chartData = useMemo(() => {
    const data: { date: string, xp: number, displayDate: string }[] = [];

    // Créer un map pour accumuler l'XP par jour
    const xpByDay: Record<string, number> = {};

    xpHistory.forEach((entry) => {
      const dateKey = format(new Date(entry.created_at), 'yyyy-MM-dd');
      xpByDay[dateKey] = (xpByDay[dateKey] || 0) + entry.xp_gained;
    });

    // Générer les 30 derniers jours
    let cumulativeXP = 0;
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const dailyXP = xpByDay[dateKey] || 0;

      cumulativeXP += dailyXP;

      data.push({
        date: dateKey,
        xp: cumulativeXP,
        displayDate: format(date, 'd MMM', { locale: fr }),
      });
    }

    return data;
  }, [xpHistory]);

  const totalXPGained = useMemo(() => {
    const last30Days = subDays(new Date(), 30);
    return xpHistory
      .filter((entry) => new Date(entry.created_at) >= last30Days)
      .reduce((sum, entry) => sum + entry.xp_gained, 0);
  }, [xpHistory]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
          Progression XP (30 jours)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 && chartData.some(d => d.xp > 0) ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-500">XP gagné ces 30 derniers jours</p>
              <p className="text-2xl md:text-3xl font-bold text-purple-600">+{totalXPGained} XP</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ fontWeight: 'bold' }}
                  formatter={(value: number) => [`${value} XP`, 'Total cumulé']}
                />
                <Line
                  type="monotone"
                  dataKey="xp"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">
              Commence à logger tes habitudes pour voir ta progression !
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
