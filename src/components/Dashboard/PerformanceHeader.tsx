import { motion } from 'framer-motion';
import { CheckSquare, AlertCircle, Clock } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { formatDate } from '@/lib/utils';
import { format, startOfDay } from 'date-fns';

export function PerformanceHeader() {
  const { tasks } = useTasks();
  const { habits, getLogsForDate } = useHabits();

  // Tâches du jour
  const today = startOfDay(new Date());
  const activeTasks = tasks.filter((t) => !t.completed);
  const todayTasks = activeTasks.filter((task) => {
    const hasDeadlineToday = task.deadline &&
      startOfDay(new Date(task.deadline)).getTime() === today.getTime();
    const isQuadrant1 = task.quadrant === 1;
    const isOverdue = task.deadline && new Date(task.deadline) < today;
    return hasDeadlineToday || isQuadrant1 || isOverdue;
  });

  const completedTodayTasks = tasks.filter(t => t.completed && t.completed_at && startOfDay(new Date(t.completed_at)).getTime() === today.getTime()).length;

  // Habitudes du jour
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const habitsCompleted = habits.filter(habit => {
    const logs = getLogsForDate(habit.id, todayStr);
    return logs.length > 0;
  }).length;
  const totalHabits = habits.length;
  const habitsPercent = totalHabits > 0 ? Math.round((habitsCompleted / totalHabits) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-600 rounded-xl p-4 md:p-8 text-white"
    >
      {/* Titre et date */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl md:text-3xl font-bold mb-1 md:mb-2"
      >
        Dashboard 🚀
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xs md:text-base text-blue-100 mb-4 md:mb-6"
      >
        {formatDate(new Date(), 'EEEE d MMMM yyyy')}
      </motion.p>

      {/* Indicateurs du jour */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {/* Tâches à faire */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4"
        >
          <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
            <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-orange-300" />
            <span className="text-[10px] md:text-xs text-blue-100">À faire</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold">{todayTasks.length}</div>
          <p className="text-[8px] md:text-[10px] text-blue-100 mt-1 md:mt-2">
            tâche{todayTasks.length > 1 ? 's' : ''} aujourd'hui
          </p>
        </motion.div>

        {/* Tâches complétées */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4"
        >
          <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
            <CheckSquare className="w-3 h-3 md:w-4 md:h-4 text-green-300" />
            <span className="text-[10px] md:text-xs text-blue-100">Complétées</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold">{completedTodayTasks}</div>
          <p className="text-[8px] md:text-[10px] text-blue-100 mt-1 md:mt-2">
            tâche{completedTodayTasks > 1 ? 's' : ''} terminée{completedTodayTasks > 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* Habitudes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4"
        >
          <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
            <Clock className="w-3 h-3 md:w-4 md:h-4 text-green-300" />
            <span className="text-[10px] md:text-xs text-blue-100">Habitudes</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold">{habitsCompleted}/{totalHabits}</div>
          <p className="text-[8px] md:text-[10px] text-blue-100 mt-1 md:mt-2">
            {habitsPercent}% complétées
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
