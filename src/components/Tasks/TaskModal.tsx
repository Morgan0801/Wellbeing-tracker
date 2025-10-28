import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
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

const toIsoWithOffset = (offsetDays: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
};

const toIso = (value?: string) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
};

const extractNaturalDeadline = (rawTitle: string, existingDeadline?: string) => {
  let cleaned = rawTitle;
  let derived: string | undefined;

  const rules: Array<{ regex: RegExp; offset: number }> = [
    { regex: /\b(today|aujourd'hui)\b/gi, offset: 0 },
    { regex: /\b(demain|tomorrow)\b/gi, offset: 1 },
  ];

  rules.forEach(({ regex, offset }) => {
    if (regex.test(cleaned)) {
      derived = toIsoWithOffset(offset);
      cleaned = cleaned.replace(regex, ' ');
    }
  });

  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  const safeTitle = cleaned.length > 0 ? cleaned : rawTitle.trim();

  return {
    title: safeTitle,
    deadline: derived ?? toIso(existingDeadline),
    derived: Boolean(derived),
  };
};

export function TaskModal({
  open,
  onOpenChange,
  defaultQuadrant = 1,
  editTask,
}: TaskModalProps) {
  const { addTask, updateTask, isAddingTask } = useTasks();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [quadrant, setQuadrant] = useState<1 | 2 | 3 | 4>(defaultQuadrant);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [recurring, setRecurring] = useState(false);

  useEffect(() => {
    if (editTask && open) {
      setTitle(editTask.title);
      setQuadrant(editTask.quadrant);
      setHasDeadline(Boolean(editTask.deadline));
      setDeadline(editTask.deadline ? format(new Date(editTask.deadline), "yyyy-MM-dd'T'HH:mm") : '');
      setRecurring(editTask.recurring);
    } else if (open) {
      setTitle('');
      setQuadrant(defaultQuadrant);
      setHasDeadline(false);
      setDeadline('');
      setRecurring(false);
    }
  }, [editTask, open, defaultQuadrant]);

  useEffect(() => {
    if (open) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const { title: cleanTitle, deadline: smartDeadline, derived } = extractNaturalDeadline(
      title,
      hasDeadline ? deadline : undefined,
    );

    const finalDeadline = smartDeadline;
    const shouldPersistDeadline = Boolean(finalDeadline) || hasDeadline || derived;

    if (editTask) {
      updateTask({
        id: editTask.id,
        updates: {
          title: cleanTitle,
          quadrant,
          deadline: shouldPersistDeadline ? finalDeadline : undefined,
          recurring,
          recurrence_pattern: recurring ? 'weekly' : undefined,
        },
      });
    } else {
      addTask({
        title: cleanTitle,
        quadrant,
        deadline: shouldPersistDeadline ? finalDeadline : undefined,
        recurring,
        recurrence_pattern: recurring ? 'weekly' : undefined,
        completed: false,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editTask ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la tâche</Label>
            <Input
              id="title"
              ref={titleInputRef}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex : Appeler le dentiste"
              required
              autoComplete="off"
            />
          </div>

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
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
                  )}
                >
                  <div className="text-2xl mb-1">{q.emoji}</div>
                  <div className="text-sm font-medium">{q.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{q.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Deadline</Label>
              <Switch checked={hasDeadline} onCheckedChange={setHasDeadline} />
            </div>
            {hasDeadline && (
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                required
              />
            )}
            <p className="text-xs text-muted-foreground">
              Astuce : ajoute « today » ou « demain » dans le titre pour fixer la deadline automatiquement.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tâche récurrente</Label>
              <Switch checked={recurring} onCheckedChange={setRecurring} />
            </div>
            <p className="text-xs text-gray-500">
              La tâche réapparaîtra automatiquement chaque semaine.
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
