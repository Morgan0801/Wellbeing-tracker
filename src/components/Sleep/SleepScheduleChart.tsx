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

// Mapping explicite des positions pour éviter les erreurs de calcul
const SCALE_MAP = [
  { position: 0, hour: 22, minute: 0 },
  { position: 50, hour: 22, minute: 30 },
  { position: 100, hour: 23, minute: 0 },
  { position: 175, hour: 23, minute: 30 },
  { position: 250, hour: 0, minute: 0 },  // Minuit
  { position: 325, hour: 0, minute: 30 },
  { position: 400, hour: 1, minute: 0 },
  { position: 450, hour: 3, minute: 0 },
  { position: 500, hour: 5, minute: 0 },
  { position: 550, hour: 7, minute: 0 },
  { position: 600, hour: 8, minute: 0 },
  { position: 650, hour: 8, minute: 30 },
  { position: 700, hour: 9, minute: 0 },
  { position: 750, hour: 9, minute: 30 },
  { position: 800, hour: 10, minute: 0 },
  { position: 825, hour: 10, minute: 30 },
  { position: 850, hour: 11, minute: 0 },
];

// Convertir minutes réelles en position sur l'échelle non-linéaire
const minutesToScaledPosition = (totalMinutes: number): number => {
  let hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  // Normaliser les heures >= 24h
  if (hour >= 24) hour -= 24;

  // Trouver les deux points d'ancrage dans SCALE_MAP
  let lower = SCALE_MAP[0];
  let upper = SCALE_MAP[SCALE_MAP.length - 1];

  for (let i = 0; i < SCALE_MAP.length - 1; i++) {
    const current = SCALE_MAP[i];
    const next = SCALE_MAP[i + 1];

    if (
      (current.hour === hour && current.minute <= minute && next.hour === hour && next.minute > minute) ||
      (current.hour === hour && current.minute <= minute && next.hour > hour) ||
      (current.hour < hour && next.hour === hour && next.minute > minute) ||
      (current.hour < hour && next.hour > hour)
    ) {
      lower = current;
      upper = next;
      break;
    }
  }

  // Interpolation linéaire entre les deux points
  const lowerMinutes = lower.hour * 60 + lower.minute;
  const upperMinutes = upper.hour * 60 + upper.minute;
  const targetMinutes = hour * 60 + minute;

  // Gérer le passage de minuit
  const adjustedUpperMinutes = upperMinutes < lowerMinutes ? upperMinutes + 24 * 60 : upperMinutes;
  const adjustedTargetMinutes = targetMinutes < lowerMinutes ? targetMinutes + 24 * 60 : targetMinutes;

  const ratio = (adjustedTargetMinutes - lowerMinutes) / (adjustedUpperMinutes - lowerMinutes);
  return lower.position + ratio * (upper.position - lower.position);
};

// Formatter pour l'axe Y - utilise directement SCALE_MAP
const formatYAxis = (position: number): string => {
  // Trouver le point le plus proche dans SCALE_MAP
  const closest = SCALE_MAP.reduce((prev, curr) =>
    Math.abs(curr.position - position) < Math.abs(prev.position - position) ? curr : prev
  );

  // Afficher "Minuit" au lieu de "0h"
  if (closest.hour === 0 && closest.minute === 0) return 'Minuit';

  if (closest.minute === 0) return `${closest.hour}h`;
  return `${closest.hour}h${closest.minute.toString().padStart(2, '0')}`;
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

    // Calculer la moyenne à partir des heures réelles (bedtimeDisplay et wakeupDisplay)
    // et non des positions scalées
    const totalBedtimeMinutes = chartData.reduce((sum, d) => {
      return sum + timeToMinutes(d.bedtimeDisplay);
    }, 0);

    const totalWakeupMinutes = chartData.reduce((sum, d) => {
      return sum + timeToMinutes(d.wakeupDisplay);
    }, 0);

    const avgBedtimeMinutes = Math.round(totalBedtimeMinutes / chartData.length);
    const avgWakeupMinutes = Math.round(totalWakeupMinutes / chartData.length);

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
                175,  // 23h30
                250,  // Minuit
                325,  // 0h30
                400,  // 1h
                450,  // 3h
                500,  // 5h
                550,  // 7h
                600,  // 8h
                650,  // 8h30
                700,  // 9h
                750,  // 9h30
                800,  // 10h
                825,  // 10h30
                850   // 11h
              ]}
              tickFormatter={formatYAxis}
              tick={{ fontSize: 9 }}
              width={55}
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
