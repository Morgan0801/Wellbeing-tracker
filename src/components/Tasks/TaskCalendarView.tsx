import { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  formatISO,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, TASK_QUADRANTS } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCalendarViewProps {
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

const parseDeadline = (deadline?: string | null) => {
  if (!deadline) return null;
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const tasksByDay = (tasks: Task[]) => {
  const map = new Map<string, Task[]>();
  tasks.forEach((task) => {
    const date = parseDeadline(task.deadline);
    if (!date) return;
    const key = formatISO(date, { representation: 'date' });
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(task);
    } else {
      map.set(key, [task]);
    }
  });
  return map;
};

const QUADRANT_STYLE: Record<1 | 2 | 3 | 4, { badge: string; emoji: string }> = {
  1: { badge: 'bg-red-500/15 text-red-600 dark:text-red-300', emoji: '🔥' },
  2: { badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-300', emoji: '🚀' },
  3: { badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300', emoji: '⚡' },
  4: { badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-300', emoji: '🌿' },
};

export function TaskCalendarView({ tasks, onCreateTask, onEditTask }: TaskCalendarViewProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const indexedTasks = useMemo(() => tasksByDay(tasks), [tasks]);

  const tasksForDate = (date: Date) => indexedTasks.get(formatISO(date, { representation: 'date' })) ?? [];

  const totalTasks = tasks.length;
  const scheduledTasks = useMemo(() => tasks.filter((task) => parseDeadline(task.deadline)), [tasks]);
  const unscheduledTasks = useMemo(() => tasks.filter((task) => !parseDeadline(task.deadline)), [tasks]);
  const todayCount = tasksForDate(new Date()).length;

  const goToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const goPrevious = () => {
    switch (view) {
      case 'month':
        setCurrentDate((prev) => subMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate((prev) => subDays(prev, 7));
        setSelectedDate((prev) => subDays(prev, 7));
        break;
      case 'day':
        setCurrentDate((prev) => subDays(prev, 1));
        setSelectedDate((prev) => subDays(prev, 1));
        break;
      default:
        break;
    }
  };

  const goNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate((prev) => addMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate((prev) => addDays(prev, 7));
        setSelectedDate((prev) => addDays(prev, 7));
        break;
      case 'day':
        setCurrentDate((prev) => addDays(prev, 1));
        setSelectedDate((prev) => addDays(prev, 1));
        break;
      default:
        break;
    }
  };

  const selectDay = (day: Date, jumpToDayView = false) => {
    setSelectedDate(day);
    setCurrentDate(day);
    if (jumpToDayView) {
      setView('day');
    }
  };

  const cellButtonProps = (day: Date) => ({
    role: 'button' as const,
    tabIndex: 0,
    onClick: () => selectDay(day, true),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectDay(day, true);
      }
    },
  });

  const renderMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let cursor = calendarStart;
    while (cursor <= calendarEnd) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }

    const headers = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase text-muted-foreground">
          {headers.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayTasks = tasksForDate(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const isOutOfMonth = !isSameMonth(day, monthStart);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div
                key={formatISO(day, { representation: 'date' })}
                {...cellButtonProps(day)}
                className={cn(
                  'rounded-lg border px-2 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                  isSelected ? 'border-blue-500 shadow-sm' : 'border-border',
                  isToday && !isSelected ? 'ring-1 ring-blue-300' : '',
                  isOutOfMonth
                    ? 'bg-muted/40 text-muted-foreground'
                    : isWeekend
                    ? 'bg-slate-50 dark:bg-slate-900/40'
                    : 'bg-background',
                )}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{format(day, 'd')}</span>
                  {isToday && <span className="text-[10px] text-blue-600">Aujourd&apos;hui</span>}
                </div>
                <div className="mt-2 space-y-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    const style = QUADRANT_STYLE[task.quadrant as 1 | 2 | 3 | 4];
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEditTask(task);
                        }}
                        className={cn(
                          'w-full truncate rounded px-2 py-1 text-[11px] font-medium',
                          style.badge,
                        )}
                      >
                        <span className="mr-1">{style.emoji}</span>
                        {task.title}
                      </button>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <p className="text-[10px] text-muted-foreground">
                      +{dayTasks.length - 3} autre{dayTasks.length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeek = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const dates = Array.from({ length: 7 }).map((_, index) => addDays(weekStart, index));

    return (
      <div className="space-y-3">
        {dates.map((day) => {
          const dayTasks = tasksForDate(day);
          const isToday = isSameDay(day, new Date());
          return (
            <Card
              key={formatISO(day, { representation: 'date' })}
              className={cn(
                'border transition',
                isToday ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/20' : 'border-border',
              )}
            >
              <CardContent className="space-y-3 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {format(day, 'EEEE d MMMM', { locale: fr })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dayTasks.length} tâche{dayTasks.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  {!isToday && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(day)}>
                      Voir le jour
                    </Button>
                  )}
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {dayTasks.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune tâche planifiée</p>
                  )}
                  {dayTasks.map((task) => {
                    const style = QUADRANT_STYLE[task.quadrant as 1 | 2 | 3 | 4];
                    const quadrant = TASK_QUADRANTS.find((q) => q.id === task.quadrant);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => onEditTask(task)}
                        className={cn(
                          'flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-left text-sm shadow-sm transition hover:border-blue-400',
                          style.badge,
                        )}
                      >
                        <span className="flex items-center gap-2 font-medium text-sm text-foreground">
                          <span>{style.emoji}</span>
                          {task.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Quadrant {quadrant?.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderDay = () => {
    const dayTasks = tasksForDate(selectedDate);
    const isToday = isSameDay(selectedDate, new Date());
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">
            {isToday ? "Aujourd'hui" : format(selectedDate, 'EEEE d MMMM', { locale: fr })}
          </h3>
          <p className="text-xs text-muted-foreground">
            {dayTasks.length} tâche{dayTasks.length > 1 ? 's' : ''} planifiée
          </p>
        </div>
        <div className="space-y-3">
          {dayTasks.length === 0 && (
            <Card className="border-dashed border-2">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Aucune tâche planifiée pour ce jour.
              </CardContent>
            </Card>
          )}
          {dayTasks.map((task) => {
            const style = QUADRANT_STYLE[task.quadrant as 1 | 2 | 3 | 4];
            const quadrant = TASK_QUADRANTS.find((q) => q.id === task.quadrant);
            return (
              <Card
                key={task.id}
                className="border border-blue-100 transition hover:border-blue-300 dark:border-blue-800/40"
              >
                <CardContent className="flex items-start justify-between gap-4 py-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span>{style.emoji}</span>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quadrant {quadrant?.id} · {quadrant?.label}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onEditTask(task)}>
                    Modifier
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const viewLabel = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: fr });
      case 'week': {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        return `${format(start, 'd MMM', { locale: fr })} - ${format(end, 'd MMM yyyy', {
          locale: fr,
        })}`;
      }
      case 'day':
      default:
        return format(selectedDate, 'EEEE d MMM yyyy', { locale: fr });
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle>Calendrier des tâches</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex rounded-lg border bg-muted/40 p-0.5">
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('month')}
              >
                Mois
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('week')}
              >
                Semaine
              </Button>
              <Button
                variant={view === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('day')}
              >
                Jour
              </Button>
            </div>
            <Button size="sm" onClick={onCreateTask} className="gap-2">
              Nouvelle tâche
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToday}>
              Aujourd&apos;hui
            </Button>
          </div>
          <p className="text-base font-semibold text-center md:text-right">{viewLabel()}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-background p-3 text-sm">
            <p className="text-muted-foreground">Toutes les tâches</p>
            <p className="text-lg font-semibold">{totalTasks}</p>
          </div>
          <div className="rounded-lg border bg-background p-3 text-sm">
            <p className="text-muted-foreground">Planifiées</p>
            <p className="text-lg font-semibold">{scheduledTasks.length}</p>
          </div>
          <div className="rounded-lg border bg-background p-3 text-sm">
            <p className="text-muted-foreground">Sans deadline</p>
            <p className="text-lg font-semibold">{unscheduledTasks.length}</p>
          </div>
          <div className="rounded-lg border bg-background p-3 text-sm">
            <p className="text-muted-foreground">Aujourd&apos;hui</p>
            <p className="text-lg font-semibold">{todayCount}</p>
          </div>
        </div>

        {view === 'month' && renderMonth()}
        {view === 'week' && renderWeek()}
        {view === 'day' && renderDay()}

        {unscheduledTasks.length > 0 && (
          <div className="rounded-lg border border-dashed p-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
              Sans deadline ({unscheduledTasks.length})
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {unscheduledTasks.map((task) => {
                const style = QUADRANT_STYLE[task.quadrant as 1 | 2 | 3 | 4];
                const quadrant = TASK_QUADRANTS.find((q) => q.id === task.quadrant);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onEditTask(task)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-left text-sm shadow-sm transition hover:border-blue-400',
                      style.badge,
                    )}
                  >
                    <span className="flex items-center gap-2 font-medium text-sm">
                      <span>{style.emoji}</span>
                      {task.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Quadrant {quadrant?.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
