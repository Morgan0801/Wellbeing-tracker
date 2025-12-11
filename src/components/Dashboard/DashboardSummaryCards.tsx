import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Heart, ListTodo, Moon, ArrowUpRight } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { useMood } from '@/hooks/useMood';
import { useTasks } from '@/hooks/useTasks';
import { useSleep } from '@/hooks/useSleep';
import { format, subDays, startOfDay } from 'date-fns';
import { getMoodEmoji, cn } from '@/lib/utils';
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
      title: 'Habitudes du jour',
      icon: CheckCircle2,
      value: `${habitsCompleted}/${totalHabits}`,
      subtitle: habitsPercent > 0 ? `${habitsPercent}% complétées` : 'Aucune complétée',
      progress: habitsPercent,
      tab: 'habits',
      gradient: 'from-vitality-light to-vitality-light/50 dark:from-vitality/15 dark:to-vitality/5',
      iconBg: 'bg-vitality/10',
      iconColor: 'text-vitality',
      progressVariant: 'vitality' as const,
    },
    {
      title: 'Humeur moyenne',
      icon: Heart,
      value: moodsLast7Days.length > 0 ? `${avgMood7d}/10` : '--',
      subtitle: moodsLast7Days.length > 0 ? '7 derniers jours' : 'Pas de données',
      emoji: moodsLast7Days.length > 0 ? getMoodEmoji(avgMood7d) : null,
      tab: 'mood',
      gradient: 'from-mood-light to-mood-light/50 dark:from-mood/15 dark:to-mood/5',
      iconBg: 'bg-mood/10',
      iconColor: 'text-mood',
    },
    {
      title: 'Tâches urgentes',
      icon: ListTodo,
      value: urgentTasks.toString(),
      subtitle: urgentTasks > 0 ? 'À traiter' : 'Tout est ok !',
      tab: 'tasks',
      gradient: urgentTasks > 0
        ? 'from-focus-light to-focus-light/50 dark:from-focus/15 dark:to-focus/5'
        : 'from-muted to-muted/50',
      iconBg: urgentTasks > 0 ? 'bg-focus/10' : 'bg-muted/30',
      iconColor: urgentTasks > 0 ? 'text-focus' : 'text-muted-foreground',
      alert: urgentTasks > 2,
    },
    {
      title: 'Sommeil moyen',
      icon: Moon,
      value: sleepLast7Days.length > 0 ? `${avgSleep7d}h` : '--',
      subtitle: sleepLast7Days.length > 0 ? 'Cette semaine' : 'Pas de données',
      tab: 'sleep',
      gradient: 'from-sleep-light to-sleep-light/50 dark:from-sleep/15 dark:to-sleep/5',
      iconBg: 'bg-sleep/10',
      iconColor: 'text-sleep',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Card
              hover
              padding="none"
              className={cn(
                "overflow-hidden border-0 shadow-soft-md h-full",
                `bg-gradient-to-br ${card.gradient}`
              )}
              onClick={() => setActiveTab(card.tab)}
            >
              <div className="p-4 md:p-5 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("p-2.5 rounded-xl", card.iconBg)}>
                    <Icon className={cn("w-5 h-5", card.iconColor)} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/50" />
                </div>

                {/* Value */}
                <div className="mb-1 flex-1">
                  {card.emoji ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl md:text-3xl font-display font-bold text-foreground">
                        {card.value}
                      </span>
                      <span className="text-2xl">{card.emoji}</span>
                    </div>
                  ) : (
                    <span className={cn(
                      "text-2xl md:text-3xl font-display font-bold",
                      card.alert ? "text-focus animate-pulse" : "text-foreground"
                    )}>
                      {card.value}
                    </span>
                  )}
                </div>

                {/* Title & Subtitle */}
                <p className="text-xs font-medium text-foreground/80 mb-0.5">{card.title}</p>
                <p className="text-[10px] text-muted-foreground mb-3">{card.subtitle}</p>

                {/* Progress bar si applicable */}
                {card.progress !== undefined && (
                  <Progress
                    value={card.progress}
                    variant={card.progressVariant}
                    size="sm"
                    animated={false}
                  />
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
