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

// Échelle non-linéaire : transformer les minutes réelles en position sur le graphique
// On donne plus d'espace visuel aux zones 23h-1h et 8h-10h
const minutesToScaledPosition = (minutes: number): number => {
  // Normaliser en heures (22h = 0, 23h = 1, 0h = 2, 1h = 3, etc.)
  let hour = Math.floor(minutes / 60);
  const min = minutes % 60;

  // Convertir en heures depuis 22h
  if (hour >= 22) {
    hour = hour - 22; // 22h -> 0, 23h -> 1
  } else {
    hour = hour + 2; // 0h -> 2, 1h -> 3, 8h -> 10, 11h -> 13
  }

  const totalMinutes = hour * 60 + min;

  // Échelle non-linéaire :
  // 22h-23h (0-60min) -> 0-100 (facteur 1.67x)
  // 23h-1h (60-180min) -> 100-350 (facteur 2.08x, zone étendue)
  // 1h-8h (180-600min) -> 350-550 (facteur 0.48x, zone compressée)
  // 8h-10h (600-720min) -> 550-750 (facteur 1.67x, zone étendue)
  // 10h-11h (720-780min) -> 750-850 (facteur 1.67x)

  if (totalMinutes <= 60) {
    // 22h-23h
    return (totalMinutes / 60) * 100;
  } else if (totalMinutes <= 180) {
    // 23h-1h (zone étendue)
    return 100 + ((totalMinutes - 60) / 120) * 250;
  } else if (totalMinutes <= 600) {
    // 1h-8h (zone compressée)
    return 350 + ((totalMinutes - 180) / 420) * 200;
  } else if (totalMinutes <= 720) {
    // 8h-10h (zone étendue)
    return 550 + ((totalMinutes - 600) / 120) * 200;
  } else {
    // 10h-11h
    return 750 + ((totalMinutes - 720) / 60) * 100;
  }
};

// Fonction inverse pour l'affichage des ticks
const scaledPositionToMinutes = (position: number): number => {
  if (position <= 100) {
    const minutes = (position / 100) * 60;
    return 22 * 60 + minutes;
  } else if (position <= 350) {
    const minutes = 60 + ((position - 100) / 250) * 120;
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    return (22 + hour) * 60 + min;
  } else if (position <= 550) {
    const minutes = 180 + ((position - 350) / 200) * 420;
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    if (22 + hour >= 24) {
      return (22 + hour - 24) * 60 + min;
    }
    return (22 + hour) * 60 + min;
  } else if (position <= 750) {
    const minutes = 600 + ((position - 550) / 200) * 120;
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    return (22 + hour - 24) * 60 + min;
  } else {
    const minutes = 720 + ((position - 750) / 100) * 60;
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    return (22 + hour - 24) * 60 + min;
  }
};

// Formatter pour l'axe Y (heures) - Affiche 22h, 23h, 0h, 1h, etc.
const formatYAxis = (position: number): string => {
  const minutes = scaledPositionToMinutes(position);
  let h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);

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
          bedtime: minutesToScaledPosition(bedtimeMinutes),
          wakeup: minutesToScaledPosition(wakeupMinutes),
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
              domain={[0, 850]} // Échelle transformée de 22h à 11h
              ticks={[
                0,    // 22h
                50,   // 22h30
                100,  // 23h
                150,  // 23h20
                200,  // 23h40
                225,  // 23h50
                250,  // 0h (minuit)
                275,  // 0h10
                300,  // 0h20
                325,  // 0h40
                350,  // 1h
                400,  // ~3h
                450,  // ~5h
                500,  // ~7h
                550,  // 8h
                600,  // 8h30
                650,  // 9h
                700,  // 9h30
                750,  // 10h
                800,  // 10h30
                850   // 11h
              ]}
              tickFormatter={formatYAxis}
              tick={{ fontSize: 9 }}
              width={50}
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
