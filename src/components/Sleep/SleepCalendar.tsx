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
import { motion } from 'framer-motion';

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
              <motion.div
                key={day.toISOString()}
                whileHover={sleep ? { scale: 1.05, zIndex: 10 } : {}}
                className="relative group"
              >
                <div
                  className={`
                    p-2 rounded-lg border transition-all
                    ${isToday ? 'ring-2 ring-blue-500' : ''}
                    ${
                      sleep
                        ? 'border-gray-300 dark:border-gray-600 cursor-pointer'
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

                {/* Tooltip au hover - Style identique à MoodHeatmap */}
                {sleep && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-64">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3">
                      <div className="text-sm font-semibold mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                        {format(day, 'd MMMM yyyy', { locale: fr })}
                      </div>

                      <div className="space-y-2.5">
                        {/* Horaires */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <Moon className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-gray-600 dark:text-gray-400">Coucher:</span>
                          </div>
                          <span className="font-bold text-indigo-600">{sleep.bedtime}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <Sun className="w-3.5 h-3.5 text-orange-600" />
                            <span className="text-gray-600 dark:text-gray-400">Lever:</span>
                          </div>
                          <span className="font-bold text-orange-600">{sleep.wakeup_time}</span>
                        </div>

                        {/* Durée totale */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-600" />
                            <span className="text-gray-600 dark:text-gray-400">Durée:</span>
                          </div>
                          <span className="font-bold text-purple-600">{formatHoursToTime(sleep.total_hours)}</span>
                        </div>

                        {/* Qualité */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Qualité:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">{getMoodEmoji(sleep.quality_score)}</span>
                            <span
                              className="font-bold"
                              style={{ color: getMoodColor(sleep.quality_score) }}
                            >
                              {sleep.quality_score}/10
                            </span>
                          </div>
                        </div>

                        {/* Sommeil profond et REM */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                          <div className="text-[10px]">
                            <div className="text-gray-500 mb-0.5">Profond:</div>
                            <div className="font-bold text-blue-700">{formatHoursToTime(sleep.deep_hours)}</div>
                          </div>
                          <div className="text-[10px]">
                            <div className="text-gray-500 mb-0.5">REM:</div>
                            <div className="font-bold text-purple-600">{formatHoursToTime(sleep.rem_hours)}</div>
                          </div>
                        </div>

                        {/* Note si présente */}
                        {sleep.notes && (
                          <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
                            <div className="text-[10px] text-gray-500 mb-1">Note:</div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                              "{sleep.notes}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
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
