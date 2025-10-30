import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { HABIT_CATEGORIES } from '@/types';
import { Button } from '@/components/ui/button';

interface HabitStatsCalendarCompactProps {
  habitId?: string;
}

export function HabitStatsCalendarCompact({ habitId: initialHabitId }: HabitStatsCalendarCompactProps) {
  const { habits, habitLogs } = useHabits();
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(initialHabitId || null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Filtre les habitudes qui ont au moins 1 log
  const habitsWithLogs = useMemo(() => {
    return habits.filter((habit) =>
      habitLogs.some((log) => log.habit_id === habit.id)
    );
  }, [habits, habitLogs]);

  // Auto-sélectionne la première habitude si aucune n'est sélectionnée
  const activeHabitId = selectedHabitId || habitsWithLogs[0]?.id;
  const selectedHabit = habits.find((h) => h.id === activeHabitId);

  // Logs pour l'habitude sélectionnée
  const selectedHabitLogs = useMemo(() => {
    if (!activeHabitId) return [];
    return habitLogs.filter((log) => log.habit_id === activeHabitId);
  }, [habitLogs, activeHabitId]);

  // Données du calendrier pour le mois sélectionné
  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map((day) => {
      const dayLogs = selectedHabitLogs.filter((log) =>
        isSameDay(new Date(log.date), day)
      );

      return {
        date: day,
        count: dayLogs.length,
        quantity: dayLogs.reduce((sum, log) => sum + (log.quantity || 0), 0),
      };
    });
  }, [selectedHabitLogs, currentMonth]);

  if (habitsWithLogs.length === 0) {
    return (
      <Card className="max-w-md">
        <CardContent className="text-center py-6">
          <BarChart2 className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Aucune donnée disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart2 className="w-3 h-3 text-purple-500" />
          Statistiques
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Sélecteur d'habitude */}
        <div>
          <select
            value={activeHabitId || ''}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="w-full p-1.5 text-xs border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            {habitsWithLogs.map((habit) => {
              const cat = HABIT_CATEGORIES.find((c) => c.type === habit.category);
              return (
                <option key={habit.id} value={habit.id}>
                  {cat?.emoji} {habit.name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Navigation mois */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="h-6 w-6 p-0"
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <div className="text-xs font-medium">
            {format(currentMonth, 'MMM yyyy', { locale: fr })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            disabled={currentMonth >= new Date()}
            className="h-6 w-6 p-0"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>

        {/* Calendrier mensuel */}
        <div className="space-y-1">
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] text-gray-500">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
              <div key={i}>{day}</div>
            ))}
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-0.5">
            {/* Padding pour le premier jour du mois */}
            {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Jours du mois */}
            {calendarData.map((day) => {
              const isToday = isSameDay(day.date, new Date());
              const hasLogs = day.count > 0;

              return (
                <motion.div
                  key={day.date.toISOString()}
                  whileHover={hasLogs ? { scale: 1.15 } : {}}
                  className={`aspect-square flex flex-col items-center justify-center rounded text-[8px] ${
                    hasLogs
                      ? 'bg-green-500 text-white font-medium cursor-pointer'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  } ${isToday ? 'ring-1 ring-purple-500' : ''}`}
                  title={
                    hasLogs
                      ? `${format(day.date, 'dd MMM', { locale: fr })}: ${day.count}x${
                          selectedHabit?.quantifiable ? ` (${day.quantity} ${selectedHabit.unit || 'u'})` : ''
                        }`
                      : format(day.date, 'dd MMM', { locale: fr })
                  }
                >
                  <div className="text-[8px]">{format(day.date, 'd')}</div>
                  {hasLogs && selectedHabit?.quantifiable && (
                    <div className="text-[7px] leading-none font-bold">{day.quantity}</div>
                  )}
                  {hasLogs && !selectedHabit?.quantifiable && (
                    <div className="text-[7px] leading-none">✓</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Légende */}
        <div className="flex items-center gap-2 text-[9px] text-gray-600 dark:text-gray-400 pt-2 border-t">
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-2 bg-gray-100 dark:bg-gray-800 rounded" />
            <span>Aucun</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-2 bg-green-500 rounded" />
            <span>OK</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-2 border border-purple-500 rounded" />
            <span>Auj.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
