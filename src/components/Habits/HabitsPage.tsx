import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, Sparkles, Activity, Brain, Target, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHabits } from '@/hooks/useHabits';
import { HabitCard } from './HabitCard';
import { HabitModal } from './HabitModal';
import { HabitStats } from './HabitStats';
import { HabitStatsCalendarCompact } from './HabitStatsCalendarCompact';
import { Habit, HabitCategory } from '@/types';
import { format, addDays, subDays, startOfDay, isToday as isTodayFn } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/lib/animations';

const HABIT_LAYOUT_QUADRANTS: Array<{
  id: string;
  title: string;
  description: string;
  icon: typeof Activity;
  categories: HabitCategory[];
  gradient: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}> = [
  {
    id: 'vitality',
    title: 'Vitalité & Santé',
    description: 'Bouger, bien manger, prendre soin de ton corps.',
    icon: Activity,
    categories: ['sante_sport', 'alimentation'],
    gradient: 'from-vitality-light to-vitality-light/30 dark:from-vitality/15 dark:to-vitality/5',
    iconBg: 'bg-vitality/10',
    iconColor: 'text-vitality',
    borderColor: 'border-l-vitality',
  },
  {
    id: 'mindset',
    title: 'Bien-être mental',
    description: 'Respiration, gratitude, rituels pour ton esprit.',
    icon: Brain,
    categories: ['bienetre_mental'],
    gradient: 'from-sleep-light to-sleep-light/30 dark:from-sleep/15 dark:to-sleep/5',
    iconBg: 'bg-sleep/10',
    iconColor: 'text-sleep',
    borderColor: 'border-l-sleep',
  },
  {
    id: 'productivity',
    title: 'Pro & Productivité',
    description: 'Habitudes pour progresser et rester organisé.',
    icon: Target,
    categories: ['productivite'],
    gradient: 'from-productivity-light to-productivity-light/30 dark:from-productivity/15 dark:to-productivity/5',
    iconBg: 'bg-productivity/10',
    iconColor: 'text-productivity',
    borderColor: 'border-l-productivity',
  },
  {
    id: 'lifestyle',
    title: 'Loisirs & Créativité',
    description: 'Moments pour toi, passions et exploration.',
    icon: Palette,
    categories: ['loisirs'],
    gradient: 'from-focus-light to-focus-light/30 dark:from-focus/15 dark:to-focus/5',
    iconBg: 'bg-focus/10',
    iconColor: 'text-focus',
    borderColor: 'border-l-focus',
  },
];

export function HabitsPage() {
  const { habits, isLoading } = useHabits();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [statsHabit, setStatsHabit] = useState<Habit | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [defaultCategory, setDefaultCategory] = useState<HabitCategory>('sante_sport');

  const isToday = isTodayFn(selectedDate);
  const isFuture = selectedDate > startOfDay(new Date());

  const overview = useMemo(() => {
    const counts: Record<string, number> = {};
    habits.forEach((habit) => {
      counts[habit.category] = (counts[habit.category] || 0) + 1;
    });
    return counts;
  }, [habits]);

  const openCreateModal = (category: HabitCategory = 'sante_sport') => {
    setEditingHabit(undefined);
    setDefaultCategory(category);
    setIsModalOpen(true);
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setDefaultCategory(habit.category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(undefined);
  };

  const handleViewStats = (habit: Habit) => {
    setStatsHabit(habit);
  };

  const goToPreviousDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(startOfDay(new Date()));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-2 border-vitality border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  const noHabits = habits.length === 0;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="container mx-auto p-3 md:p-4 lg:p-5 pb-20 md:pb-6 space-y-3"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Mes habitudes</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {habits.length} habitude{habits.length > 1 ? 's' : ''} à suivre
          </p>
        </div>
        <Button onClick={() => openCreateModal()} variant="glow" className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle habitude
        </Button>
      </motion.div>

      {/* Sélecteur de date */}
      <motion.div variants={staggerItem}>
        <Card variant="glass" className="border-primary/10">
          <CardContent className="p-2">
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={goToPreviousDay} className="gap-1 h-7 px-2">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Hier</span>
              </Button>

              <div className="text-center flex-1">
                <p className="text-sm font-display font-bold text-foreground">
                  {isToday ? "Aujourd'hui" : format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                </p>
                <p className="text-[10px] text-muted-foreground">{format(selectedDate, 'dd/MM/yyyy')}</p>
              </div>

              {!isToday ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isFuture ? goToPreviousDay : goToNextDay}
                  className="gap-1 h-7 px-2"
                >
                  <span className="hidden sm:inline text-xs">{isFuture ? 'Hier' : 'Demain'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={goToNextDay} className="gap-1 h-7 px-2">
                  <span className="hidden sm:inline text-xs">Demain</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {!isToday && (
              <div className="text-center mt-1">
                <Button variant="link" size="sm" onClick={goToToday} className="text-[10px] text-primary h-5 p-0">
                  Retour à aujourd&apos;hui
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {noHabits ? (
        <motion.div variants={staggerItem}>
          <Card variant="elevated" className="border-dashed border-2">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-vitality/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-vitality" />
              </div>
              <h3 className="text-lg font-display font-bold mb-2">Aucune habitude</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Crée ta première habitude pour commencer à suivre ta progression quotidienne !
              </p>
              <Button onClick={() => openCreateModal()} variant="glow" size="lg">
                Créer ma première habitude
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
          {HABIT_LAYOUT_QUADRANTS.map((quadrant, index) => {
            const Icon = quadrant.icon;
            const quadrantHabits = habits.filter((habit) =>
              quadrant.categories.includes(habit.category),
            );

            return (
              <motion.div
                key={quadrant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "h-full border-l-4 overflow-hidden",
                    quadrant.borderColor,
                    `bg-gradient-to-br ${quadrant.gradient}`
                  )}
                >
                  <CardHeader className="flex flex-row items-start justify-between gap-2 p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn("p-2 rounded-lg", quadrant.iconBg)}>
                          <Icon className={cn("w-5 h-5", quadrant.iconColor)} />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-display">
                            {quadrant.title}
                          </CardTitle>
                          <span className={cn(
                            "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium mt-0.5",
                            quadrant.iconBg, quadrant.iconColor
                          )}>
                            {overviewCount(overview, quadrant.categories)} habitude{overviewCount(overview, quadrant.categories) > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 ml-11">
                        {quadrant.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openCreateModal(quadrant.categories[0])}
                      className="gap-1 shrink-0 h-6 w-6 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3 pt-0">
                    {quadrantHabits.length === 0 ? (
                      <div className="rounded-lg border-2 border-dashed border-border/50 bg-background/50 p-3 text-xs text-muted-foreground text-center">
                        Aucune habitude
                      </div>
                    ) : (
                      quadrantHabits.map((habit) => (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          selectedDate={selectedDate}
                          onEdit={handleEdit}
                          onViewStats={habit.quantifiable ? handleViewStats : undefined}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Astuces */}
      {habits.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card variant="glass" className="border-primary/10">
            <CardContent className="p-3">
              <h3 className="font-display font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                Astuces
              </h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                <strong>Navigation :</strong> utilise les flèches pour cocher les jours passés.
                <span className="hidden md:inline"> • </span>
                <br className="md:hidden" />
                <strong>Quadrants :</strong> organise tes routines par sphère de vie.
                <span className="hidden md:inline"> • </span>
                <br className="md:hidden" />
                <strong>Statistiques :</strong> ouvre une habitude quantifiable pour suivre tes progrès.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <HabitModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        editHabit={editingHabit}
        defaultCategory={defaultCategory}
      />

      <HabitStats
        open={!!statsHabit}
        onOpenChange={(open) => !open && setStatsHabit(null)}
        habit={statsHabit}
      />

      {/* Calendriers de stats habitudes */}
      {!noHabits && (
        <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <HabitStatsCalendarCompact />
          <HabitStatsCalendarCompact />
          <HabitStatsCalendarCompact />
        </motion.div>
      )}
    </motion.div>
  );
}

const overviewCount = (overview: Record<string, number>, categories: HabitCategory[]) =>
  categories.reduce((total, category) => total + (overview[category] || 0), 0);
