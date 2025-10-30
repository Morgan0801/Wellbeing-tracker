import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Heart, ListTodo, Moon, ArrowRight } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { useMood } from '@/hooks/useMood';
import { useTasks } from '@/hooks/useTasks';
import { useSleep } from '@/hooks/useSleep';
import { format, subDays, startOfDay } from 'date-fns';
import { getMoodEmoji } from '@/lib/utils';
import { useNavigation } from '@/contexts/NavigationContext';

export function DashboardSummaryCards() {
  const { setActiveTab } = useNavigation();
  const { habits, getLogsForDate } = useHabits();
  const { moods } = useMood();
  const { tasks } = useTasks();
  const { sleepLogs } = useSleep();

  // === HABITUDES DU JOUR ===
  const today = format(new Date(), 'yyyy-MM-dd');
  const habitsCompleted = habits.filter(habit => {
    const logs = getLogsForDate(habit.id, today);
    return logs.length > 0;
  }).length;
  const totalHabits = habits.length;
  const habitsPercent = totalHabits > 0 ? Math.round((habitsCompleted / totalHabits) * 100) : 0;

  // === HUMEUR MOYENNE 7J ===
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    return startOfDay(date).getTime();
  });

  const moodsLast7Days = moods.filter(mood => {
    const moodDate = startOfDay(new Date(mood.datetime)).getTime();
    return last7Days.includes(moodDate);
  });

  const avgMood7d = moodsLast7Days.length > 0
    ? Math.round((moodsLast7Days.reduce((sum, m) => sum + m.score_global, 0) / moodsLast7Days.length) * 10) / 10
    : 0;

  // === TÂCHES URGENTES ===
  const urgentTasks = tasks.filter(t => !t.completed && (t.quadrant === 1 || t.quadrant === 2)).length;

  // === SOMMEIL MOYEN 7J ===
  const sleepLast7Days = sleepLogs.filter(log => {
    const logDate = startOfDay(new Date(log.date)).getTime();
    return last7Days.includes(logDate);
  });

  const avgSleep7d = sleepLast7Days.length > 0
    ? Math.round((sleepLast7Days.reduce((sum, s) => sum + Number(s.total_hours), 0) / sleepLast7Days.length) * 10) / 10
    : 0;

  const cards = [
    {
      title: 'Habitudes',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      value: `${habitsCompleted}/${totalHabits}`,
      subtitle: `${habitsPercent}% complétées`,
      tab: 'habits',
      delay: 0.1,
    },
    {
      title: 'Humeur 7j',
      icon: Heart,
      iconColor: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      borderColor: 'border-pink-200 dark:border-pink-800',
      value: moodsLast7Days.length > 0 ? `${avgMood7d}/10` : '—',
      subtitle: moodsLast7Days.length > 0 ? getMoodEmoji(avgMood7d) : 'Pas de données',
      tab: 'mood',
      delay: 0.2,
    },
    {
      title: 'Tâches urgentes',
      icon: ListTodo,
      iconColor: 'text-orange-600',
      bgColor: urgentTasks > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: urgentTasks > 0 ? 'border-orange-200 dark:border-orange-800' : 'border-gray-200 dark:border-gray-800',
      value: urgentTasks.toString(),
      subtitle: urgentTasks > 0 ? 'À faire !' : 'Aucune',
      tab: 'tasks',
      delay: 0.3,
    },
    {
      title: 'Sommeil 7j',
      icon: Moon,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      value: sleepLast7Days.length > 0 ? `${avgSleep7d}h` : '—',
      subtitle: sleepLast7Days.length > 0 ? 'Moyenne' : 'Pas de données',
      tab: 'sleep',
      delay: 0.4,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.delay }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={`${card.bgColor} ${card.borderColor} border-2 cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => setActiveTab(card.tab)}
            >
              <CardContent className="p-3 md:p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <Icon className={`w-4 h-4 md:w-5 md:h-5 ${card.iconColor}`} />
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                </div>

                {/* Titre */}
                <h3 className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {card.title}
                </h3>

                {/* Valeur */}
                <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {card.value}
                </div>

                {/* Subtitle */}
                <p className="text-[10px] md:text-xs text-gray-500">
                  {card.subtitle}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
