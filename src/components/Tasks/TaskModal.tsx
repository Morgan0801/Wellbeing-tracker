import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTasks } from '@/hooks/useTasks';
import { Task, TASK_QUADRANTS } from '@/types';
import { cn } from '@/lib/utils';

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultQuadrant?: 1 | 2 | 3 | 4;
  editTask?: Task;
}

export function TaskModal({ open, onOpenChange, defaultQuadrant = 1, editTask }: TaskModalProps) {
  const { addTask, updateTask, isAddingTask } = useTasks();

  // Ref pour l'autofocus
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [quadrant, setQuadrant] = useState<1 | 2 | 3 | 4>(defaultQuadrant);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [recurring, setRecurring] = useState(false);

  // Effet pour remplir le formulaire en mode édition ou reset en mode création
  useEffect(() => {
    if (editTask && open) {
      // Mode édition : pré-remplir avec les données de la tâche
      setTitle(editTask.title);
      setQuadrant(editTask.quadrant);
      setHasDeadline(!!editTask.deadline);
      setDeadline(editTask.deadline || '');
      setRecurring(editTask.recurring);
    } else if (open) {
      // Mode création : reset + utiliser defaultQuadrant
      setTitle('');
      setQuadrant(defaultQuadrant);
      setHasDeadline(false);
      setDeadline('');
      setRecurring(false);
    }
  }, [editTask, open, defaultQuadrant]);

  // Autofocus sur le champ titre quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editTask) {
      // Mode édition : mettre à jour la tâche existante
      updateTask({
        id: editTask.id,
        updates: {
          title,
          quadrant,
          deadline: hasDeadline ? deadline : undefined,
          recurring,
          recurrence_pattern: recurring ? 'weekly' : undefined,
        },
      });
    } else {
      // Mode création : ajouter une nouvelle tâche
      addTask({
        title,
        quadrant,
        deadline: hasDeadline ? deadline : undefined,
        recurring,
        recurrence_pattern: recurring ? 'weekly' : undefined,
        completed: false,
      });
    }

    // Fermer le modal
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la tâche</Label>
            <Input
              id="title"
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Appeler le dentiste"
              required
              autoComplete="off"
            />
          </div>

          {/* Quadrant */}
          <div className="space-y-2">
            <Label>Quadrant (Eisenhower)</Label>
            <div className="grid grid-cols-2 gap-2">
              {TASK_QUADRANTS.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setQuadrant(q.id as 1 | 2 | 3 | 4)}
                  className={cn(
                    'p-3 rounded-lg border-2 text-left transition-all',
                    quadrant === q.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className="text-2xl mb-1">{q.emoji}</div>
                  <div className="text-sm font-medium">{q.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{q.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Deadline</Label>
              <Switch checked={hasDeadline} onCheckedChange={setHasDeadline} />
            </div>
            {hasDeadline && (
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required={hasDeadline}
              />
            )}
          </div>

          {/* Récurrent */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tâche récurrente</Label>
              <Switch checked={recurring} onCheckedChange={setRecurring} />
            </div>
            <p className="text-xs text-gray-500">
              La tâche réapparaîtra automatiquement chaque semaine
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isAddingTask} className="flex-1">
              {isAddingTask ? 'Enregistrement...' : editTask ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
