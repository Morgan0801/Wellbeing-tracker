import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle2, AlertCircle, LayoutGrid, CalendarDays, Check, ListTodo, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { Task, TASK_QUADRANTS } from '@/types';
import { startOfDay } from 'date-fns';
import { TaskCalendarView } from './TaskCalendarView';
import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/lib/animations';

const QUADRANT_STYLES = {
  1: { gradient: 'from-focus-light to-focus-light/30', iconBg: 'bg-focus/10', iconColor: 'text-focus', borderColor: 'border-l-focus' },
  2: { gradient: 'from-vitality-light to-vitality-light/30', iconBg: 'bg-vitality/10', iconColor: 'text-vitality', borderColor: 'border-l-vitality' },
  3: { gradient: 'from-productivity-light to-productivity-light/30', iconBg: 'bg-productivity/10', iconColor: 'text-productivity', borderColor: 'border-l-productivity' },
  4: { gradient: 'from-muted to-muted/30', iconBg: 'bg-muted-foreground/10', iconColor: 'text-muted-foreground', borderColor: 'border-l-muted-foreground' },
};

export function TasksPage() {
  const { tasks, getTasksByQuadrantWithToday, getCompletedTasks, toggleTask, isLoading } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuadrant, setSelectedQuadrant] = useState<1 | 2 | 3 | 4>(1);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<'matrix' | 'calendar'>('matrix');

  const handleOpenModal = (quadrant: 1 | 2 | 3 | 4 = 1) => {
    setEditingTask(undefined);
    setSelectedQuadrant(quadrant);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setSelectedQuadrant(task.quadrant);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-2 border-productivity border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  const activeTasks = tasks.filter((task) => !task.completed);
  const today = startOfDay(new Date());
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Il y a 7 jours

  // Tâches complétées récentes (derniers 7 jours seulement)
  const completedTasks = getCompletedTasks().filter((task) => {
    if (!task.completed_at) return false;
    return new Date(task.completed_at) >= sevenDaysAgo;
  });

  // Toutes les tâches du jour (uniquement celles non complétées)
  const allTodayTasks = tasks.filter((task) => {
    // Exclure toutes les tâches complétées
    if (task.completed) return false;

    const hasDeadlineToday =
      task.deadline && startOfDay(new Date(task.deadline)).getTime() === today.getTime();
    const isQuadrantOne = task.quadrant === 1;
    const isOverdue = task.deadline && new Date(task.deadline) < today;

    return hasDeadlineToday || isQuadrantOne || isOverdue;
  });

  const todayTasks = allTodayTasks;

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
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-productivity/10">
              <ListTodo className="w-6 h-6 text-productivity" />
            </div>
            Mes tâches
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTasks.length} tâche{activeTasks.length > 1 ? 's' : ''} active{activeTasks.length > 1 ? 's' : ''}
            {completedTasks.length > 0 &&
              ` · ${completedTasks.length} complétée${completedTasks.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Card variant="glass" padding="none" className="border-0">
            <div className="flex rounded-xl p-1">
              <Button
                variant={viewMode === 'matrix' ? 'default' : 'ghost'}
                size="sm"
                className="gap-1.5 rounded-lg"
                onClick={() => setViewMode('matrix')}
              >
                <LayoutGrid className="h-4 w-4" />
                Matrice
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                className="gap-1.5 rounded-lg"
                onClick={() => setViewMode('calendar')}
              >
                <CalendarDays className="h-4 w-4" />
                Calendrier
              </Button>
            </div>
          </Card>
          <Button onClick={() => handleOpenModal(viewMode === 'matrix' ? selectedQuadrant : 1)} variant="glow" className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle tâche
          </Button>
        </div>
      </motion.div>

      {/* Tâches du jour */}
      {allTodayTasks.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card className="bg-gradient-to-br from-focus-light to-focus-light/30 dark:from-focus/15 dark:to-focus/5 border-focus/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-focus/10 shrink-0">
                  <AlertCircle className="w-5 h-5 text-focus" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-sm mb-3">
                    Tâches à faire aujourd'hui ({todayTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {allTodayTasks.map((task) => {
                      const isOverdue = task.deadline && new Date(task.deadline) < today;
                      const quadrant = TASK_QUADRANTS.find((q) => q.id === task.quadrant);

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg bg-background/50 text-sm",
                            task.completed && 'opacity-60'
                          )}
                        >
                          <button
                            onClick={() => toggleTask(task.id)}
                            className={cn(
                              "flex-shrink-0 w-5 h-5 border-2 border-focus rounded-md flex items-center justify-center transition-colors",
                              task.completed ? 'bg-focus' : 'bg-transparent hover:bg-focus/10'
                            )}
                          >
                            {task.completed && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <span className="text-lg">{quadrant?.emoji}</span>
                          <span className={cn("font-medium flex-1", task.completed && 'line-through text-muted-foreground')}>
                            {task.title}
                          </span>
                          {isOverdue && !task.completed && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-destructive text-white font-medium">
                              EN RETARD
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {viewMode === 'calendar' ? (
        <motion.div variants={staggerItem}>
          <TaskCalendarView
            tasks={tasks}
            onCreateTask={() => handleOpenModal(1)}
            onEditTask={handleEditTask}
          />
        </motion.div>
      ) : (
        <>
          <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {TASK_QUADRANTS.map((quadrant, index) => {
              const quadrantTasks = getTasksByQuadrantWithToday(quadrant.id as 1 | 2 | 3 | 4);
              const style = QUADRANT_STYLES[quadrant.id as 1 | 2 | 3 | 4];

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
                      style.borderColor,
                      `bg-gradient-to-br ${style.gradient} dark:from-transparent dark:to-transparent`
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{quadrant.emoji}</span>
                          <div>
                            <CardTitle className="text-base font-display">{quadrant.label}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{quadrant.description}</p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenModal(quadrant.id as 1 | 2 | 3 | 4)}
                          className="h-8 w-8 shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {quadrantTasks.length === 0 ? (
                        <div className="text-center py-8">
                          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3", style.iconBg)}>
                            <Sparkles className={cn("w-6 h-6", style.iconColor)} />
                          </div>
                          <p className="text-sm text-muted-foreground">Aucune tâche</p>
                        </div>
                      ) : (
                        quadrantTasks.map((task) => (
                          <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
                        ))
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Tâches complétées */}
          {completedTasks.length > 0 && (
            <motion.div variants={staggerItem}>
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-vitality/10">
                        <CheckCircle2 className="w-5 h-5 text-vitality" />
                      </div>
                      <CardTitle className="text-base font-display">Tâches complétées</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowCompleted(!showCompleted)}>
                      {showCompleted ? 'Masquer' : 'Afficher'} ({completedTasks.length})
                    </Button>
                  </div>
                </CardHeader>
                {showCompleted && (
                  <CardContent className="space-y-2">
                    {completedTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
                    ))}
                  </CardContent>
                )}
              </Card>
            </motion.div>
          )}

          {/* Guide Eisenhower */}
          <motion.div variants={staggerItem}>
            <Card variant="glass" className="border-primary/10">
              <CardContent className="p-4">
                <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Matrice d'Eisenhower
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-focus/5">
                    <span className="font-bold text-focus">Q1</span>
                    <span>Urgent & Important : à faire immédiatement</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-vitality/5">
                    <span className="font-bold text-vitality">Q2</span>
                    <span>Important : à planifier et prioriser</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-productivity/5">
                    <span className="font-bold text-productivity">Q3</span>
                    <span>Urgent : à déléguer si possible</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <span className="font-bold text-muted-foreground">Q4</span>
                    <span>Ni urgent ni important : à éliminer</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      <TaskModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingTask(undefined);
          }
        }}
        defaultQuadrant={selectedQuadrant}
        editTask={editingTask}
      />
    </motion.div>
  );
}
