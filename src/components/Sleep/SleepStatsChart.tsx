import { useMemo } from 'react';
import { SleepLog } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format, subDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SleepStatsChartProps {
  sleepLogs: SleepLog[];
  periodDays: number;
}

export function SleepStatsChart({ sleepLogs, periodDays }: SleepStatsChartProps) {
  const stats = useMemo(() => {
    const cutoffDate = startOfDay(subDays(new Date(), periodDays));
    const recentLogs = sleepLogs.filter(
      (log) => new Date(log.date) >= cutoffDate
    );

    if (recentLogs.length === 0) {
      return {
        avgQuality: 0,
        avgDuration: 0,
        avgRem: 0,
        avgDeep: 0,
        avgBpm: 0,
        count: 0,
      };
    }

    const total = recentLogs.length;
    return {
      avgQuality:
        recentLogs.reduce((sum, log) => sum + log.quality_score, 0) / total,
      avgDuration:
        recentLogs.reduce((sum, log) => sum + log.total_hours, 0) / total,
      avgRem: recentLogs.reduce((sum, log) => sum + log.rem_hours, 0) / total,
      avgDeep: recentLogs.reduce((sum, log) => sum + log.deep_hours, 0) / total,
      avgBpm:
        recentLogs.reduce((sum, log) => sum + log.avg_heart_rate, 0) / total,
      count: total,
    };
  }, [sleepLogs, periodDays]);

  const chartData = useMemo(() => {
    const cutoffDate = startOfDay(subDays(new Date(), periodDays));
    return sleepLogs
      .filter((log) => new Date(log.date) >= cutoffDate)
      .slice(0, 30) // Limiter à 30 points max pour la lisibilité
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sleepLogs, periodDays]);

  if (stats.count === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">
            Pas de données pour cette période
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats moyennes */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">
              Qualité moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.avgQuality.toFixed(1)}/10
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">
              Durée moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats.avgDuration.toFixed(1)}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">
              REM moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">
              {stats.avgRem.toFixed(1)}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">
              Profond moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {stats.avgDeep.toFixed(1)}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">
              BPM moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {Math.round(stats.avgBpm)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">
              Nuits enregistrées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">
              {stats.count}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique simple en barres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Évolution de la qualité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {chartData.map((log) => (
              <div key={log.id} className="flex items-center gap-2">
                <div className="text-xs text-gray-500 w-20">
                  {format(new Date(log.date), 'dd/MM', { locale: fr })}
                </div>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                    style={{ width: `${(log.quality_score / 10) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-medium w-8 text-right">
                  {log.quality_score}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
