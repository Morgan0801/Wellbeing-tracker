import { motion } from 'framer-motion';
import { CheckSquare, AlertCircle, Clock, Check } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { TASK_QUADRANTS } from '@/types';
import { formatDate } from '@/lib/utils';
import { format, startOfDay } from 'date-fns';

export function PerformanceHeader() {
  const { tasks, toggleTask } = useTasks();
  const { habits, getLogsForDate } = useHabits();

  // Tâches du jour
  const today = startOfDay(new Date());

  // Toutes les tâches du jour (non complétées OU complétées aujourd'hui)
  const allTodayTasks = tasks.filter((task) => {
    const hasDeadlineToday = task.deadline &&
      startOfDay(new Date(task.deadline)).getTime() === today.getTime();
    const isQuadrant1 = task.quadrant === 1;
    const isOverdue = task.deadline && new Date(task.deadline) < today;
    const isRelevant = hasDeadlineToday || isQuadrant1 || isOverdue;

    if (!isRelevant) return false;

    // Si la tâche est complétée, ne la garder que si complétée aujourd'hui
    if (task.completed && task.completed_at) {
      const completedDate = startOfDay(new Date(task.completed_at));
      return completedDate.getTime() === today.getTime();
    }

    // Sinon, garder toutes les tâches non complétées
    return !task.completed;
  });

  // Tâches non complétées pour le compteur
  const todayTasks = allTodayTasks.filter((t) => !t.completed);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
        {/* Tâches à faire */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4 md:col-span-2"
        >
          <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-3">
            <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-orange-300" />
            <span className="text-[10px] md:text-xs text-blue-100 font-medium">À faire aujourd'hui</span>
            <span className="ml-auto text-xs md:text-sm font-bold">{todayTasks.length}</span>
          </div>

          {allTodayTasks.length > 0 ? (
            <div className="space-y-1.5 max-h-32 overflow-y-auto overflow-x-hidden pl-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {allTodayTasks.slice(0, 5).map((task) => {
                const quadrantEmoji = TASK_QUADRANTS.find(q => q.id === task.quadrant)?.emoji || '📌';
                return (
                  <motion.div
                    key={task.id}
                    whileHover={{ scale: 1.01 }}
                    className={`flex items-center gap-1.5 bg-white/10 rounded p-1.5 cursor-pointer transition-opacity ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(task.id);
                      }}
                      className={`flex-shrink-0 w-4 h-4 border-2 border-white rounded flex items-center justify-center transition-colors ${
                        task.completed ? 'bg-white' : 'bg-transparent hover:bg-white/20'
                      }`}
                    >
                      {task.completed && <Check className="w-2.5 h-2.5 text-purple-600" />}
                    </button>
                    <span className="text-xs md:text-sm">{quadrantEmoji}</span>
                    <span
                      className={`text-[11px] md:text-xs text-white truncate flex-1 ${
                        task.completed ? 'line-through' : ''
                      }`}
                      onClick={() => toggleTask(task.id)}
                    >
                      {task.title}
                    </span>
                  </motion.div>
                );
              })}
              {allTodayTasks.length > 5 && (
                <p className="text-[10px] md:text-xs text-blue-100 text-center pt-1">
                  +{allTodayTasks.length - 5} tâche{allTodayTasks.length - 5 > 1 ? 's' : ''} de plus
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs md:text-sm text-blue-100 text-center py-4">
              Aucune tâche aujourd'hui 🎉
            </p>
          )}
        </motion.div>

        {/* Stats compactes */}
        <div className="space-y-2">
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
      </div>
    </motion.div>
  );
}
