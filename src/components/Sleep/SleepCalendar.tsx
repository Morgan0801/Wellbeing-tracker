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
import { getMoodEmoji, getMoodColor, formatHoursToTime } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Moon, Sun, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SleepCalendarProps {
  sleepLogs: SleepLog[];
}

export function SleepCalendar({ sleepLogs }: SleepCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSleep, setSelectedSleep] = useState<SleepLog | null>(null);

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
                onClick={() => sleep && setSelectedSleep(sleep)}
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

      {/* Dialog avec détails du sommeil */}
      <Dialog open={!!selectedSleep} onOpenChange={(open) => !open && setSelectedSleep(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-500" />
              Détails du sommeil - {selectedSleep && format(new Date(selectedSleep.date), 'PPP', { locale: fr })}
            </DialogTitle>
          </DialogHeader>

          {selectedSleep && (
            <div className="space-y-4">
              {/* Horaires */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                  <Moon className="w-5 h-5 text-indigo-600 mt-1" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Heure de coucher</p>
                    <p className="text-lg font-bold text-indigo-600">{selectedSleep.bedtime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <Sun className="w-5 h-5 text-orange-600 mt-1" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Heure de lever</p>
                    <p className="text-lg font-bold text-orange-600">{selectedSleep.wakeup_time}</p>
                  </div>
                </div>
              </div>

              {/* Durée totale */}
              <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Durée totale de sommeil</p>
                  <p className="text-lg font-bold text-purple-600">{formatHoursToTime(selectedSleep.total_hours)}</p>
                </div>
              </div>

              {/* Qualité du sommeil */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Qualité du sommeil</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getMoodEmoji(selectedSleep.quality_score)}</span>
                  <span
                    className="text-3xl font-bold"
                    style={{ color: getMoodColor(selectedSleep.quality_score) }}
                  >
                    {selectedSleep.quality_score}/10
                  </span>
                </div>
              </div>

              {/* Détails sommeil profond/REM */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Sommeil profond</p>
                  <p className="text-lg font-bold text-blue-700">{formatHoursToTime(selectedSleep.deep_hours)}</p>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Sommeil REM</p>
                  <p className="text-lg font-bold text-purple-600">{formatHoursToTime(selectedSleep.rem_hours)}</p>
                </div>
              </div>

              {/* Note si présente */}
              {selectedSleep.notes && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Note</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedSleep.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
