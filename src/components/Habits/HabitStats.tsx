import { Habit } from '@/types';
import { useHabits } from '@/hooks/useHabits';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface HabitStatsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
}

export function HabitStats({ open, onOpenChange, habit }: HabitStatsProps) {
  const { getHabitLogs } = useHabits();

  if (!habit) return null;

  const logs = getHabitLogs(habit.id);
  const now = new Date();

  // Calculs pour la semaine en cours
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekLogs = logs.filter((log) => {
    const logDate = new Date(log.date);
    return logDate >= weekStart && logDate <= weekEnd;
  });

  // Calculs pour le mois en cours
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthLogs = logs.filter((log) => {
    const logDate = new Date(log.date);
    return logDate >= monthStart && logDate <= monthEnd;
  });

  // Statistiques hebdomadaires
  const weekCompletedCount = weekLogs.filter((l) => l.completed).length;
  const weekTotalQuantity = weekLogs.reduce((sum, log) => sum + (log.quantity || 0), 0);

  // Statistiques mensuelles
  const monthCompletedCount = monthLogs.filter((l) => l.completed).length;
  const monthTotalQuantity = monthLogs.reduce((sum, log) => sum + (log.quantity || 0), 0);

  // Calendrier du mois
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayStatus = (day: Date) => {
    const log = monthLogs.find((l) => isSameDay(new Date(l.date), day));
    if (log?.completed) {
      return {
        completed: true,
        quantity: log.quantity,
        className: 'bg-green-600 text-white',
      };
    }
    return {
      completed: false,
      quantity: null,
      className: 'bg-gray-100 dark:bg-gray-800 text-gray-400',
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Statistiques : {habit.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stats semaine */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cette semaine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Jours complétés</p>
                <p className="text-2xl font-bold text-blue-600">
                  {weekCompletedCount} / 7 jours
                </p>
              </div>
              {habit.quantifiable && weekTotalQuantity > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {weekTotalQuantity} {habit.unit}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {weekLogs.map((l) => l.quantity).filter(Boolean).join(' + ')} = {weekTotalQuantity} {habit.unit}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats mois */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ce mois-ci</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Jours complétés</p>
                <p className="text-2xl font-bold text-green-600">
                  {monthCompletedCount} / {daysInMonth.length} jours
                </p>
              </div>
              {habit.quantifiable && monthTotalQuantity > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {monthTotalQuantity} {habit.unit}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendrier mensuel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Calendrier - {format(now, 'MMMM yyyy', { locale: fr })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                  <div
                    key={i}
                    className="text-center text-xs font-medium text-gray-500 py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Jours du mois */}
              <div className="grid grid-cols-7 gap-1">
                {/* Padding pour commencer au bon jour */}
                {Array.from({ length: (daysInMonth[0].getDay() + 6) % 7 }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}

                {/* Jours */}
                {daysInMonth.map((day) => {
                  const status = getDayStatus(day);
                  const isToday = isSameDay(day, now);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all',
                        status.className,
                        isToday && 'ring-2 ring-blue-500'
                      )}
                      title={
                        status.completed && status.quantity
                          ? `${format(day, 'd MMM', { locale: fr })}: ${status.quantity} ${habit.unit}`
                          : format(day, 'd MMM', { locale: fr })
                      }
                    >
                      <div className="font-medium">{format(day, 'd')}</div>
                      {status.completed && status.quantity && (
                        <div className="text-[10px] font-bold mt-0.5">
                          {status.quantity}
                        </div>
                      )}
                      {status.completed && !status.quantity && (
                        <div className="text-lg leading-none">✓</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Légende */}
              <div className="flex gap-4 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-600" />
                  <span>Complété</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800" />
                  <span>Non complété</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
