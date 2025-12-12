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
  const [period, setPeriod] = useState<7 | 30 | 90 | 'year'>(30);
  const [showAverage, setShowAverage] = useState(false);
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

  // Stats pour la période sélectionnée (7j, 30j, 90j ou année)
  const periodStats = useMemo(() => {
    const today = startOfDay(new Date());
    let startDate: Date;
    let daysInPeriod: number;

    if (period === 'year') {
      // Du 1er janvier à aujourd'hui
      startDate = new Date(today.getFullYear(), 0, 1);
      daysInPeriod = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    } else {
      startDate = subDays(today, period);
      daysInPeriod = period;
    }

    const logsInPeriod = selectedHabitLogs.filter((log) => {
      const logDate = startOfDay(new Date(log.date));
      return logDate >= startDate && logDate <= today;
    });

    const totalCount = logsInPeriod.length;
    const totalQuantity = selectedHabit?.quantifiable
      ? logsInPeriod.reduce((sum, log) => sum + (log.quantity || 0), 0)
      : 0;

    // Calcul de la moyenne par jour
    const averageQuantity = selectedHabit?.quantifiable && daysInPeriod > 0
      ? totalQuantity / daysInPeriod
      : 0;

    return { totalCount, totalQuantity, averageQuantity, daysInPeriod };
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
    <Card className="p-2 md:p-4">
      <CardHeader className="p-2 md:p-3 pb-2">
        <CardTitle className="text-sm md:text-base flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-purple-500" />
          Statistiques d'habitude
        </CardTitle>
      </CardHeader>

      <CardContent className="p-2 md:p-3 pt-0 space-y-2">
        {/* Sélecteur d'habitude + Période sur la même ligne */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={activeHabitId || ''}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="flex-1 min-w-[120px] p-1.5 text-xs border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
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

          {/* Sélecteur de période */}
          <div className="flex gap-1">
            {[7, 30, 90, 'year'].map((p) => (
              <motion.button
                key={p}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPeriod(p as 7 | 30 | 90 | 'year')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  period === p
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {p === 'year' ? 'An' : `${p}j`}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Toggle Total/Moyenne pour habitudes quantifiables (plus compact) */}
        {selectedHabit?.quantifiable && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-600 dark:text-gray-400">Affichage:</span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAverage(false)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                !showAverage
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              Total
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAverage(true)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                showAverage
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              Moyenne
            </motion.button>
          </div>
        )}

        {/* Stats de la période - Plus compact */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeHabitId}-${period}-${showAverage}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="grid grid-cols-2 gap-2 p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-base md:text-lg font-bold text-purple-600"
              >
                {periodStats.totalCount}
              </motion.div>
              <div className="text-[9px] md:text-[10px] text-gray-600 dark:text-gray-400">
                fois réalisé
              </div>
            </div>

            {selectedHabit?.quantifiable && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="text-base md:text-lg font-bold text-green-600"
                >
                  {showAverage
                    ? periodStats.averageQuantity.toFixed(1)
                    : periodStats.totalQuantity}
                </motion.div>
                <div className="text-[9px] md:text-[10px] text-gray-600 dark:text-gray-400">
                  {selectedHabit.unit || 'unités'}{showAverage ? '/jour' : ''}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation mois - Plus compact */}
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            ←
          </motion.button>
          <div className="text-xs md:text-sm font-medium">
            {format(currentMonth, 'MMM yyyy', { locale: fr })}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            disabled={currentMonth >= new Date()}
          >
            →
          </motion.button>
        </div>

        {/* Calendrier mensuel - Plus compact */}
        <div className="space-y-0.5">
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
                  whileHover={hasLogs ? { scale: 1.05 } : {}}
                  className={`aspect-square flex flex-col items-center justify-center rounded text-[9px] p-0.5 ${
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
                    <div className="text-[6px] leading-none opacity-80">✓</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Légende - Plus compacte */}
        <div className="flex items-center gap-2 text-[9px] text-gray-600 dark:text-gray-400 pt-1 border-t">
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-2 bg-gray-100 dark:bg-gray-800 rounded" />
            <span>Aucun</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-2 h-2 bg-green-500 rounded" />
            <span>Réalisé</span>
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
