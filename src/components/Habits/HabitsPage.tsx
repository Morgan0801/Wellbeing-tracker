import { useMemo, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
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

const HABIT_LAYOUT_QUADRANTS: Array<{
  id: string;
  title: string;
  description: string;
  emoji: string;
  categories: HabitCategory[];
  accentBorder: string;
  accentBadge: string;
}> = [
  {
    id: 'vitality',
    title: 'Vitalité & Santé',
    description: 'Bouger, bien manger, prendre soin de ton corps.',
    emoji: '💪',
    categories: ['sante_sport', 'alimentation'],
    accentBorder: 'border-green-400 dark:border-green-500',
    accentBadge: 'bg-green-500/15 text-green-700 dark:text-green-300',
  },
  {
    id: 'mindset',
    title: 'Bien-être mental',
    description: 'Respiration, gratitude, rituels pour ton esprit.',
    emoji: '🧠',
    categories: ['bienetre_mental'],
    accentBorder: 'border-blue-400 dark:border-blue-500',
    accentBadge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  },
  {
    id: 'productivity',
    title: 'Pro & Productivité',
    description: 'Habitudes pour progresser et rester organisé.',
    emoji: '🎯',
    categories: ['productivite'],
    accentBorder: 'border-purple-400 dark:border-purple-500',
    accentBadge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
  },
  {
    id: 'lifestyle',
    title: 'Loisirs & Créativité',
    description: 'Moments pour toi, passions et exploration.',
    emoji: '🎨',
    categories: ['loisirs'],
    accentBorder: 'border-orange-400 dark:border-orange-500',
    accentBadge: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
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
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  const noHabits = habits.length === 0;

  return (
    <div className="container mx-auto p-3 md:p-4 pb-20 md:pb-4 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-2 md:gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Mes habitudes</h1>
          <p className="text-sm md:text-base text-gray-500 mt-0.5 md:mt-1">
            {habits.length} habitude{habits.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => openCreateModal()} className="gap-2 text-sm md:text-base">
          <Plus className="w-4 h-4" />
          Nouvelle habitude
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            <Button variant="outline" size="sm" onClick={goToPreviousDay} className="gap-1 text-xs md:text-sm px-2 md:px-3">
              <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Hier</span>
            </Button>

            <div className="text-center flex-1">
              <p className="text-sm md:text-lg font-bold">
                {isToday ? "Aujourd'hui" : format(selectedDate, 'EEEE d MMMM', { locale: fr })}
              </p>
              <p className="text-[10px] md:text-xs text-gray-500">{format(selectedDate, 'dd/MM/yyyy')}</p>
            </div>

            {!isToday ? (
              <Button
                variant="outline"
                size="sm"
                onClick={isFuture ? goToPreviousDay : goToNextDay}
                className="gap-1 text-xs md:text-sm px-2 md:px-3"
              >
                <span className="hidden sm:inline">{isFuture ? 'Hier' : 'Demain'}</span>
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={goToNextDay} className="gap-1 text-xs md:text-sm px-2 md:px-3">
                <span className="hidden sm:inline">Demain</span>
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
            )}
          </div>

          {!isToday && (
            <div className="text-center mt-3">
              <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs">
                Retour à aujourd&apos;hui
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {noHabits ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-lg font-medium mb-2">Aucune habitude</h3>
            <p className="text-gray-500 mb-4">
              Crée ta première habitude pour commencer à suivre ta progression !
            </p>
            <Button onClick={() => openCreateModal()}>
              Créer ma première habitude
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-2">
          {HABIT_LAYOUT_QUADRANTS.map((quadrant) => {
            const quadrantHabits = habits.filter((habit) =>
              quadrant.categories.includes(habit.category),
            );

            return (
              <Card
                key={quadrant.id}
                className={`border-l-4 ${quadrant.accentBorder}`}
              >
                <CardHeader className="flex items-start justify-between gap-1 md:gap-2 p-3 md:p-6">
                  <div>
                    <CardTitle className="flex items-center gap-1 md:gap-2 text-sm md:text-lg">
                      <span className="text-lg md:text-2xl">{quadrant.emoji}</span>
                      <span className="leading-tight">{quadrant.title}</span>
                    </CardTitle>
                    <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {quadrant.description}
                    </p>
                    <span className={`mt-1 md:mt-2 inline-flex items-center rounded-full px-1.5 md:px-2 py-0.5 text-[9px] md:text-[11px] font-medium ${quadrant.accentBadge}`}>
                      {overviewCount(overview, quadrant.categories)} hab.
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openCreateModal(quadrant.categories[0])}
                    className="gap-1 p-1 md:p-2 h-auto"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden md:inline text-xs">Ajouter</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 md:space-y-3 p-3 md:p-6 pt-0">
                  {quadrantHabits.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white/70 p-2 md:p-4 text-[10px] md:text-sm text-gray-500 dark:border-gray-700 dark:bg-slate-900/40">
                      Aucune habitude.
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
            );
          })}
        </div>
      )}

      {habits.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3 md:p-4">
            <h3 className="font-semibold text-xs md:text-sm mb-1 md:mb-2">💡 Astuces</h3>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">
              <strong>Navigation :</strong> utilise les flèches pour cocher les jours passés.<br />
              <strong>Quadrants :</strong> organise tes routines par sphère de vie.<br className="hidden md:inline" />
              <strong>Statistiques :</strong> ouvre une habitude quantifiable pour suivre tes progrès.
            </p>
          </CardContent>
        </Card>
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

      {/* Calendriers de stats habitudes - Comparaison côte à côte */}
      {!noHabits && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <HabitStatsCalendarCompact />
          <HabitStatsCalendarCompact />
          <HabitStatsCalendarCompact />
        </div>
      )}
    </div>
  );
}

const overviewCount = (overview: Record<string, number>, categories: HabitCategory[]) =>
  categories.reduce((total, category) => total + (overview[category] || 0), 0);
