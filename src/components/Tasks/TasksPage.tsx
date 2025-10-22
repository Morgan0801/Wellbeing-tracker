import { useState } from 'react';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { Task, TASK_QUADRANTS } from '@/types';
import { startOfDay } from 'date-fns';

export function TasksPage() {
  const { tasks, getTasksByQuadrant, getCompletedTasks, isLoading } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuadrant, setSelectedQuadrant] = useState<1 | 2 | 3 | 4>(1);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [showCompleted, setShowCompleted] = useState(false);

  const handleOpenModal = (quadrant: 1 | 2 | 3 | 4) => {
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
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = getCompletedTasks();

  // Tâches à faire aujourd'hui (critères A + B + C)
  const today = startOfDay(new Date());
  const todayTasks = activeTasks.filter((task) => {
    // A) Deadline aujourd'hui
    const hasDeadlineToday = task.deadline && 
      startOfDay(new Date(task.deadline)).getTime() === today.getTime();
    
    // B) Quadrant 1 (Urgent & Important)
    const isQuadrant1 = task.quadrant === 1;
    
    // C) Overdue
    const isOverdue = task.deadline && new Date(task.deadline) < today;
    
    return hasDeadlineToday || isQuadrant1 || isOverdue;
  });

  return (
    <div className="container mx-auto p-4 pb-24 md:pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes tâches</h1>
          <p className="text-gray-500 mt-1">
            {activeTasks.length} tâche{activeTasks.length > 1 ? 's' : ''} active{activeTasks.length > 1 ? 's' : ''}
            {completedTasks.length > 0 && ` • ${completedTasks.length} complétée${completedTasks.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Notification : Tâches à faire aujourd'hui */}
      {todayTasks.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-orange-900 dark:text-orange-100 mb-2">
                  🔔 Tâches à faire aujourd'hui ({todayTasks.length})
                </h3>
                <div className="space-y-1.5">
                  {todayTasks.map((task) => {
                    const isOverdue = task.deadline && new Date(task.deadline) < today;
                    const quadrant = TASK_QUADRANTS.find(q => q.id === task.quadrant);
                    
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 text-xs text-orange-800 dark:text-orange-200"
                      >
                        <span>{quadrant?.emoji}</span>
                        <span className="font-medium">{task.title}</span>
                        {isOverdue && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-600 text-white font-medium">
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
      )}

      {/* Matrice d'Eisenhower */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TASK_QUADRANTS.map((quadrant) => {
          const quadrantTasks = getTasksByQuadrant(quadrant.id as 1 | 2 | 3 | 4);

          return (
            <Card
              key={quadrant.id}
              className="overflow-hidden"
              style={{ borderTopColor: quadrant.color, borderTopWidth: 3 }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">{quadrant.emoji}</span>
                      {quadrant.label}
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">{quadrant.description}</p>
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
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Aucune tâche dans ce quadrant
                  </div>
                ) : (
                  quadrantTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onEdit={handleEditTask}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Historique des tâches complétées */}
      {completedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg">
                  Historique des tâches complétées
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? 'Masquer' : 'Afficher'} ({completedTasks.length})
              </Button>
            </div>
          </CardHeader>
          {showCompleted && (
            <CardContent className="space-y-2">
              {completedTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  onEdit={handleEditTask}
                />
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Info Eisenhower (en bas maintenant) */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-2">📊 Matrice d'Eisenhower</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Q1 (Urgent & Important) :</strong> À faire immédiatement<br />
            <strong>Q2 (Important) :</strong> À planifier et prioriser<br />
            <strong>Q3 (Urgent) :</strong> À déléguer si possible<br />
            <strong>Q4 (Ni urgent ni important) :</strong> À éliminer ou reporter
          </p>
        </CardContent>
      </Card>

      {/* Modal */}
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
    </div>
  );
}
