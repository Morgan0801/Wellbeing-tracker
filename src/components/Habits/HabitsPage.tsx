import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useHabits } from '@/hooks/useHabits';
import { HabitCard } from './HabitCard';
import { HabitModal } from './HabitModal';
import { HabitStats } from './HabitStats';
import { Habit } from '@/types';
import { format, addDays, subDays, startOfDay, isToday as isTodayFn } from 'date-fns';
import { fr } from 'date-fns/locale';

export function HabitsPage() {
  const { habits, isLoading } = useHabits();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [statsHabit, setStatsHabit] = useState<Habit | null>(null);
  
  // État pour la date sélectionnée (par défaut = aujourd'hui)
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(undefined);
  };

  const handleViewStats = (habit: Habit) => {
    setStatsHabit(habit);
  };

  // Navigation temporelle
  const goToPreviousDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(startOfDay(new Date()));
  };

  const isToday = isTodayFn(selectedDate);
  const isFuture = selectedDate > startOfDay(new Date());

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24 md:pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes habitudes</h1>
          <p className="text-gray-500 mt-1">
            {habits.length} habitude{habits.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle habitude
        </Button>
      </div>

      {/* Navigation temporelle */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Bouton Hier */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousDay}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Hier
            </Button>

            {/* Date actuelle */}
            <div className="text-center flex-1">
              <p className="text-lg font-bold">
                {isToday ? "Aujourd'hui" : format(selectedDate, 'EEEE d MMMM', { locale: fr })}
              </p>
              <p className="text-xs text-gray-500">
                {format(selectedDate, 'dd/MM/yyyy')}
              </p>
            </div>

            {/* Bouton Demain (ou Aujourd'hui si on est dans le passé) */}
            {!isToday ? (
              <Button
                variant="outline"
                size="sm"
                onClick={isFuture ? goToPreviousDay : goToNextDay}
                className="gap-2"
              >
                {isFuture ? "Hier" : "Demain"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextDay}
                className="gap-2"
              >
                Demain
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Bouton "Retour à aujourd'hui" si on est dans le passé/futur */}
          {!isToday && (
            <div className="text-center mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="text-xs"
              >
                Retour à aujourd'hui
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {habits.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">💪</div>
            <h3 className="text-lg font-medium mb-2">Aucune habitude</h3>
            <p className="text-gray-500 mb-4">
              Commence à tracker tes habitudes quotidiennes !
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              Créer ma première habitude
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Liste des habitudes pour la date sélectionnée */}
      {habits.length > 0 && (
        <div className="space-y-3">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              selectedDate={selectedDate}
              onEdit={handleEdit}
              onViewStats={habit.quantifiable ? handleViewStats : undefined}
            />
          ))}
        </div>
      )}

      {/* Astuce */}
      {habits.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2">💡 Astuce</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Navigation :</strong> Utilise les flèches pour naviguer entre les jours et cocher tes habitudes passées !<br />
              <strong>Multi-logs :</strong> Tu peux cocher plusieurs fois la même habitude dans la journée (ex: courir matin + soir).<br />
              <strong>Statistiques :</strong> Clique sur 📊 pour voir tes stats hebdo/mensuelles (habitudes quantifiables uniquement).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal création/édition */}
      <HabitModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        editHabit={editingHabit}
      />

      {/* Modal statistiques */}
      <HabitStats
        open={!!statsHabit}
        onOpenChange={(open) => !open && setStatsHabit(null)}
        habit={statsHabit}
      />
    </div>
  );
}
