import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Moon, Sun } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { SleepLog } from '@/types';
import { format, subDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SleepScheduleChartProps {
  sleepLogs: SleepLog[];
  periodDays?: number;
}

// Convertir une heure "HH:MM" en nombre de minutes depuis minuit
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Convertir des minutes en format "HH:MM"
const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Formatter pour l'axe Y (heures)
const formatYAxis = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  return `${h}h`;
};

export function SleepScheduleChart({ sleepLogs, periodDays = 30 }: SleepScheduleChartProps) {
  const chartData = useMemo(() => {
    const cutoffDate = subDays(new Date(), periodDays);

    return sleepLogs
      .filter((log) => new Date(log.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((log) => {
        let bedtimeMinutes = timeToMinutes(log.bedtime);
        let wakeupMinutes = timeToMinutes(log.wakeup_time);

        // Si l'heure de coucher est après 12h, on considère que c'est le soir (ajouter 24h si < 12h pour le graphique)
        // Si c'est avant 12h, c'est probablement après minuit du jour suivant
        if (bedtimeMinutes < 12 * 60) {
          bedtimeMinutes += 24 * 60; // Ajouter 24h (ex: 1h du matin = 25h)
        }

        // Pour le réveil, si c'est l'après-midi (> 12h), c'est probablement une sieste, on l'affiche tel quel
        // Sinon c'est le matin du lendemain, on ajoute 24h
        if (wakeupMinutes < bedtimeMinutes - 12 * 60) {
          wakeupMinutes += 24 * 60;
        }

        return {
          date: format(parseISO(log.date), 'dd/MM', { locale: fr }),
          fullDate: format(parseISO(log.date), 'PPP', { locale: fr }),
          bedtime: bedtimeMinutes,
          wakeup: wakeupMinutes,
          bedtimeDisplay: log.bedtime,
          wakeupDisplay: log.wakeup_time,
        };
      });
  }, [sleepLogs, periodDays]);

  const avgStats = useMemo(() => {
    if (chartData.length === 0) return { avgBedtime: '--:--', avgWakeup: '--:--' };

    const totalBedtime = chartData.reduce((sum, d) => sum + d.bedtime, 0);
    const totalWakeup = chartData.reduce((sum, d) => sum + d.wakeup, 0);

    let avgBedtimeMinutes = Math.round(totalBedtime / chartData.length);
    let avgWakeupMinutes = Math.round(totalWakeup / chartData.length);

    // Ramener les heures > 24h à leur équivalent réel
    if (avgBedtimeMinutes >= 24 * 60) avgBedtimeMinutes -= 24 * 60;
    if (avgWakeupMinutes >= 24 * 60) avgWakeupMinutes -= 24 * 60;

    return {
      avgBedtime: minutesToTime(avgBedtimeMinutes),
      avgWakeup: minutesToTime(avgWakeupMinutes),
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Moon className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
            Horaires de sommeil
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">Pas de données pour cette période</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <Moon className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
          Horaires de sommeil ({periodDays} jours)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats moyennes */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-600" />
            <div>
              <p className="text-xs md:text-sm text-gray-500">Coucher moyen</p>
              <p className="text-lg md:text-xl font-bold text-indigo-600">{avgStats.avgBedtime}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-xs md:text-sm text-gray-500">Lever moyen</p>
              <p className="text-lg md:text-xl font-bold text-orange-600">{avgStats.avgWakeup}</p>
            </div>
          </div>
        </div>

        {/* Graphique */}
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[20 * 60, 32 * 60]} // De 20h à 8h (32h = 8h du lendemain)
              ticks={[20*60, 21*60, 22*60, 23*60, 24*60, 25*60, 26*60, 27*60, 28*60, 29*60, 30*60, 31*60, 32*60]}
              tickFormatter={formatYAxis}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              formatter={(value: number, name: string) => {
                const dataPoint = chartData.find(d => d.bedtime === value || d.wakeup === value);
                if (name === 'bedtime') {
                  return [dataPoint?.bedtimeDisplay || minutesToTime(value % (24 * 60)), 'Coucher'];
                }
                if (name === 'wakeup') {
                  return [dataPoint?.wakeupDisplay || minutesToTime(value % (24 * 60)), 'Lever'];
                }
                return [value, name];
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
              formatter={(value) => {
                if (value === 'bedtime') return 'Heure de coucher';
                if (value === 'wakeup') return 'Heure de lever';
                return value;
              }}
            />
            <Line
              type="monotone"
              dataKey="bedtime"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={{ fill: '#4f46e5', r: 3 }}
              name="bedtime"
            />
            <Line
              type="monotone"
              dataKey="wakeup"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: '#f97316', r: 3 }}
              name="wakeup"
            />
          </LineChart>
        </ResponsiveContainer>

        <p className="text-xs text-gray-500 text-center mt-2">
          Suivez la régularité de vos horaires de sommeil pour optimiser votre repos
        </p>
      </CardContent>
    </Card>
  );
}
