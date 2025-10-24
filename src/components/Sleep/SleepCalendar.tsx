import { useMemo, useState } from 'react';
import { SleepLog } from '@/types';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { getMoodEmoji, getMoodColor } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SleepCalendarProps {
  sleepLogs: SleepLog[];
}

export function SleepCalendar({ sleepLogs }: SleepCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getSleepForDay = (day: Date) => {
    return sleepLogs.find((log) => isSameDay(new Date(log.date), day));
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            Calendrier - {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Jours du mois */}
        <div className="grid grid-cols-7 gap-1">
          {/* Espaces vides avant le premier jour */}
          {Array.from({ length: (calendarDays[0].getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Jours avec données */}
          {calendarDays.map((day) => {
            const sleep = getSleepForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`
                  relative p-2 rounded-lg border transition-all
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${
                    sleep
                      ? 'border-gray-300 dark:border-gray-600 hover:shadow-md cursor-pointer'
                      : 'border-gray-200 dark:border-gray-700'
                  }
                `}
                style={{
                  backgroundColor: sleep
                    ? `${getMoodColor(sleep.quality_score)}15`
                    : undefined,
                }}
              >
                <div className="text-xs font-medium text-gray-900 dark:text-white">
                  {format(day, 'd')}
                </div>
                {sleep && (
                  <div className="flex flex-col items-center mt-1">
                    <span className="text-xl">{getMoodEmoji(sleep.quality_score)}</span>
                    <span
                      className="text-xs font-bold mt-1"
                      style={{ color: getMoodColor(sleep.quality_score) }}
                    >
                      {sleep.quality_score}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 mb-2 font-medium">Légende :</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="text-2xl">😴</div>
              <span>Très mauvais (1-2)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl">😕</div>
              <span>Mauvais (3-4)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl">😐</div>
              <span>Moyen (5-6)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl">😊</div>
              <span>Bon (7-8)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl">😄</div>
              <span>Excellent (9-10)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
