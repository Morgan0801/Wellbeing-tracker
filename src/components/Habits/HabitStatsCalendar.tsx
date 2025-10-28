import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { format, subDays, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { HABIT_CATEGORIES } from '@/types';

export function HabitStatsCalendar() {
  const { habits, habitLogs } = useHabits();
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [period, setPeriod] = useState<7 | 30>(30);
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

  // Stats pour la période sélectionnée (7j ou 30j)
  const periodStats = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, period);

    const logsInPeriod = selectedHabitLogs.filter((log) => {
      const logDate = startOfDay(new Date(log.date));
      return logDate >= startDate && logDate <= today;
    });

    const totalCount = logsInPeriod.length;
    const totalQuantity = selectedHabit?.quantifiable
      ? logsInPeriod.reduce((sum, log) => sum + (log.quantity || 0), 0)
      : 0;

    return { totalCount, totalQuantity };
  }, [selectedHabitLogs, period, selectedHabit]);

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
      <Card className="p-4 md:p-6">
        <CardContent className="text-center py-8">
          <BarChart2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Aucune donnée disponible. Commence à logger tes habitudes !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-3 md:p-6">
      <CardHeader className="p-3 md:p-6 pb-3">
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <BarChart2 className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
          Statistiques d'habitude
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 md:p-6 pt-0 space-y-4">
        {/* Sélecteur d'habitude */}
        <div>
          <label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Habitude :
          </label>
          <select
            value={activeHabitId || ''}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="w-full p-2 md:p-3 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            {habitsWithLogs.map((habit) => {
              const category = HABIT_CATEGORIES.find((c) => c.type === habit.category);
              return (
                <option key={habit.id} value={habit.id}>
                  {category?.emoji} {habit.name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Sélecteur de période */}
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Période :</span>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setPeriod(7)}
              className={`px-3 py-1 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                period === 7
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              7j
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setPeriod(30)}
              className={`px-3 py-1 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                period === 30
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              30j
            </motion.button>
          </div>
        </div>

        {/* Stats de la période */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeHabitId}-${period}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-2 gap-3 md:gap-4 p-3 md:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-2xl md:text-3xl font-bold text-purple-600"
              >
                {periodStats.totalCount}
              </motion.div>
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                fois réalisé
              </div>
            </div>

            {selectedHabit?.quantifiable && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="text-2xl md:text-3xl font-bold text-green-600"
                >
                  {periodStats.totalQuantity}
                </motion.div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {selectedHabit.unit || 'unités'}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation mois */}
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            ←
          </motion.button>
          <div className="text-sm md:text-base font-medium">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={currentMonth >= new Date()}
          >
            →
          </motion.button>
        </div>

        {/* Calendrier mensuel */}
        <div className="space-y-1">
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-0.5 md:gap-1 text-center text-[10px] md:text-xs text-gray-500">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
              <div key={i}>{day}</div>
            ))}
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-0.5 md:gap-1">
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
                  whileHover={hasLogs ? { scale: 1.1 } : {}}
                  className={`aspect-square md:aspect-auto md:h-10 flex flex-col items-center justify-center rounded text-[10px] md:text-xs p-0.5 ${
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
                  <div className="text-[9px] md:text-[10px]">{format(day.date, 'd')}</div>
                  {hasLogs && selectedHabit?.quantifiable && (
                    <div className="text-[8px] md:text-[9px] leading-none font-bold">{day.quantity}</div>
                  )}
                  {hasLogs && !selectedHabit?.quantifiable && (
                    <div className="text-[7px] md:text-[8px] leading-none opacity-80">✓</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Légende */}
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
            <span>Aucun</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Réalisé</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-purple-500 rounded" />
            <span>Aujourd'hui</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
