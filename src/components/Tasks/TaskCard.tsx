import { Task } from '@/types';
import { useTasks } from '@/hooks/useTasks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Trash2, Calendar, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const { toggleTask, deleteTask } = useTasks();

  const handleToggle = () => {
    toggleTask(task.id);
  };

  const handleDelete = () => {
    if (confirm(`Supprimer la tâche "${task.title}" ?`)) {
      deleteTask(task.id);
    }
  };

  const handleEdit = () => {
    onEdit?.(task);
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;

  return (
    <Card
      className={cn(
        'p-3 transition-all',
        task.completed && 'bg-gray-50 dark:bg-gray-800/50 opacity-75'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5',
            task.completed
              ? 'bg-green-600 border-green-600 text-white'
              : 'border-gray-300 hover:border-green-500 dark:border-gray-600'
          )}
        >
          {task.completed && <Check className="w-3 h-3" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'font-medium text-sm',
              task.completed && 'line-through text-gray-500 dark:text-gray-400'
            )}
          >
            {task.title}
          </p>
          
          {task.deadline && (
            <div className={cn(
              'flex items-center gap-1 text-xs mt-1',
              isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500'
            )}>
              <Calendar className="w-3 h-3" />
              {format(new Date(task.deadline), 'dd MMM yyyy', { locale: fr })}
            </div>
          )}
          
          {task.recurring && (
            <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs mt-1">
              🔄 Récurrent
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 shrink-0">
          {/* Bouton Edit */}
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Edit className="w-3 h-3" />
            </Button>
          )}

          {/* Bouton Delete */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
