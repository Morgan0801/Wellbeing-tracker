import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { SleepLog } from '@/types';
import { format, subDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SleepScheduleChartProps {
  sleepLogs: SleepLog[];
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

// Formatter pour l'axe Y (heures) - Affiche 1h, 2h, 8h30 au lieu de 25h, 26h
const formatYAxis = (minutes: number): string => {
  let h = Math.floor(minutes / 60);
  const m = minutes % 60;
  // Si >= 24h, ramener à l'équivalent (ex: 25h -> 1h)
  if (h >= 24) h = h - 24;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
};

export function SleepScheduleChart({ sleepLogs }: SleepScheduleChartProps) {
  const [periodDays, setPeriodDays] = useState(30);
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
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <CardTitle className="text-sm md:text-base flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-500" />
            Horaires de sommeil
          </CardTitle>

          {/* Filtres de période */}
          <div className="flex gap-1">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant={periodDays === days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriodDays(days)}
                className="text-xs px-2 py-1 h-7"
              >
                {days}j
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Stats moyennes - Plus compactes */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <Moon className="w-3 h-3 text-indigo-600" />
            <div>
              <p className="text-[10px] text-gray-500">Coucher moy.</p>
              <p className="text-sm md:text-base font-bold text-indigo-600">{avgStats.avgBedtime}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Sun className="w-3 h-3 text-orange-500" />
            <div>
              <p className="text-[10px] text-gray-500">Lever moy.</p>
              <p className="text-sm md:text-base font-bold text-orange-600">{avgStats.avgWakeup}</p>
            </div>
          </div>
        </div>

        {/* Graphique - Plus grand */}
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[20 * 60, 34 * 60]} // De 20h à 10h du matin (34h = 10h du lendemain)
              ticks={[
                20*60, // 20h
                21*60, // 21h
                22*60, // 22h
                22*60+30, // 22h30
                23*60, // 23h
                23*60+30, // 23h30
                24*60, // 0h (minuit)
                24*60+30, // 0h30
                25*60, // 1h du matin
                26*60, // 2h
                27*60, // 3h
                28*60, // 4h
                29*60, // 5h
                30*60, // 6h
                31*60, // 7h
                32*60, // 8h
                32*60+30, // 8h30
                33*60, // 9h
                33*60+30, // 9h30
                34*60 // 10h
              ]}
              tickFormatter={formatYAxis}
              tick={{ fontSize: 9 }}
              width={45}
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
              height={28}
              iconType="line"
              wrapperStyle={{ fontSize: '11px' }}
              formatter={(value) => {
                if (value === 'bedtime') return 'Coucher';
                if (value === 'wakeup') return 'Lever';
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
