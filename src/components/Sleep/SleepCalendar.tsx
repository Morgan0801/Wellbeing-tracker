import { SleepLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SleepCalendarProps {
  sleepLogs: SleepLog[];
}

// Fonction pour obtenir la couleur selon la qualité
const getQualityColor = (quality: number): string => {
  if (quality >= 9) return 'bg-green-600';
  if (quality >= 7) return 'bg-green-500';
  if (quality >= 5) return 'bg-yellow-500';
  if (quality >= 3) return 'bg-orange-500';
  return 'bg-red-500';
};

// Fonction pour obtenir l'emoji selon la qualité
const getQualityEmoji = (quality: number): string => {
  if (quality >= 9) return '😴';
  if (quality >= 7) return '😊';
  if (quality >= 5) return '😐';
  if (quality >= 3) return '😕';
  return '😩';
};

export function SleepCalendar({ sleepLogs }: SleepCalendarProps) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getSleepForDay = (day: Date): SleepLog | undefined => {
    return sleepLogs.find((log) => isSameDay(new Date(log.date), day));
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {format(now, 'MMMM yyyy', { locale: fr })}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-medium text-gray-500 py-0.5"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Jours du mois */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Padding pour commencer au bon jour */}
          {Array.from({ length: (daysInMonth[0].getDay() + 6) % 7 }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}

          {/* Jours */}
          {daysInMonth.map((day) => {
            const sleepLog = getSleepForDay(day);
            const isToday = isSameDay(day, now);
            const isFuture = day > now;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center rounded text-[10px] transition-all cursor-default',
                  sleepLog
                    ? cn(
                        getQualityColor(sleepLog.quality_score),
                        'text-white font-medium'
                      )
                    : isFuture
                    ? 'bg-gray-50 dark:bg-gray-900 text-gray-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400',
                  isToday && 'ring-1 ring-blue-500'
                )}
                title={
                  sleepLog
                    ? `${format(day, 'd MMM', { locale: fr })}: ${sleepLog.total_hours}h - Qualité ${sleepLog.quality_score}/10`
                    : format(day, 'd MMM', { locale: fr })
                }
              >
                <div className="font-medium text-[10px]">{format(day, 'd')}</div>
                {sleepLog && (
                  <div className="text-xs leading-none">
                    {getQualityEmoji(sleepLog.quality_score)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Légende compacte */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-green-600" />
            <span className="text-gray-600 dark:text-gray-400">9-10</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
            <span className="text-gray-600 dark:text-gray-400">7-8</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-yellow-500" />
            <span className="text-gray-600 dark:text-gray-400">5-6</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
            <span className="text-gray-600 dark:text-gray-400">3-4</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span className="text-gray-600 dark:text-gray-400">1-2</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
