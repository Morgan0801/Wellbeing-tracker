import { useState } from 'react';
import { Habit } from '@/types';
import { useHabits } from '@/hooks/useHabits';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Trash2, Edit, TrendingUp, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HABIT_FREQUENCIES } from '@/types';
import { format } from 'date-fns';

interface HabitCardProps {
  habit: Habit;
  selectedDate: Date;
  onEdit: (habit: Habit) => void;
  onViewStats?: (habit: Habit) => void;
}

export function HabitCard({ habit, selectedDate, onEdit, onViewStats }: HabitCardProps) {
  const { getLogsForDate, logHabit, deleteHabitLog, calculateStreak, isLoggingHabit } = useHabits();
  
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const logsForDate = getLogsForDate(habit.id, dateStr);
  const hasLogs = logsForDate.length > 0;
  const streak = calculateStreak(habit.id);

  const [showQuantityInput, setShowQuantityInput] = useState(false);
  const [quantityValue, setQuantityValue] = useState<string>('');

  const handleAddLog = () => {
    if (habit.quantifiable) {
      setShowQuantityInput(true);
    } else {
      // Si non quantifiable, on ajoute juste un log "completed"
      logHabit({
        habitId: habit.id,
        date: dateStr,
        completed: true,
        quantity: undefined,
      });
    }
  };

  const handleSubmitQuantity = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantityValue);
    
    if (!isNaN(qty) && qty > 0) {
      logHabit({
        habitId: habit.id,
        date: dateStr,
        completed: true,
        quantity: qty,
      });
      setQuantityValue('');
      setShowQuantityInput(false);
    }
  };

  const handleDeleteLog = (logId: string) => {
    if (confirm('Supprimer ce log ?')) {
      deleteHabitLog(logId);
    }
  };

  const handleDeleteHabit = () => {
    if (confirm(`Supprimer l'habitude "${habit.name}" ?`)) {
      // On utilise la fonction deleteHabit du hook
      const { deleteHabit } = useHabits();
      deleteHabit(habit.id);
    }
  };

  const frequencyLabel = HABIT_FREQUENCIES.find((f) => f.value === habit.frequency)?.label;

  // Calculer le total de quantité pour ce jour
  const totalQuantity = logsForDate.reduce((sum, log) => sum + (log.quantity || 0), 0);

  return (
    <Card
      className={cn(
        'p-4 transition-all',
        hasLogs && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Info + Logs */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Titre */}
          <div>
            <h3 className="font-medium flex items-center gap-2">
              {habit.name}
              {hasLogs && <span className="text-green-600">✓</span>}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1 text-xs">
              <span
                className="px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: habit.color + '20',
                  color: habit.color,
                }}
              >
                {frequencyLabel}
              </span>
              {habit.quantifiable && habit.unit && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {habit.unit}
                </span>
              )}
              {streak > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                  🔥 {streak} jour{streak > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Logs existants pour ce jour */}
          {logsForDate.length > 0 && (
            <div className="space-y-1.5">
              {logsForDate.map((log, index) => (
                <div
                  key={log.id}
                  className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 rounded-md px-3 py-2 border border-green-200 dark:border-green-800"
                >
                  <Check className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="flex-1">
                    {habit.quantifiable && log.quantity ? (
                      <span className="font-medium">
                        {log.quantity} {habit.unit}
                      </span>
                    ) : (
                      <span>Complété</span>
                    )}
                    {logsForDate.length > 1 && (
                      <span className="ml-2 text-xs text-gray-500">
                        #{index + 1}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {/* Total si quantifiable */}
              {habit.quantifiable && totalQuantity > 0 && logsForDate.length > 1 && (
                <div className="text-sm font-bold text-green-700 dark:text-green-400 pt-1">
                  Total : {totalQuantity} {habit.unit}
                </div>
              )}
            </div>
          )}

          {/* Input pour ajouter une quantité */}
          {habit.quantifiable && showQuantityInput && (
            <form onSubmit={handleSubmitQuantity} className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={quantityValue}
                onChange={(e) => setQuantityValue(e.target.value)}
                placeholder={`Ex: 5 ${habit.unit}`}
                className="h-9 text-sm"
                autoFocus
              />
              <Button type="submit" size="sm" className="h-9">
                Valider
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowQuantityInput(false)}
                className="h-9"
              >
                Annuler
              </Button>
            </form>
          )}

          {/* Bouton "Ajouter" */}
          {!showQuantityInput && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddLog}
              disabled={isLoggingHabit}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter {habit.quantifiable ? 'une quantité' : ''}
            </Button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          {/* Bouton Stats (si quantifiable) */}
          {habit.quantifiable && onViewStats && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewStats(habit)}
              className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              title="Voir les statistiques"
            >
              <TrendingUp className="w-4 h-4" />
            </Button>
          )}
          
          {/* Bouton Edit */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(habit)}
            className="h-8 w-8"
          >
            <Edit className="w-4 h-4" />
          </Button>

          {/* Bouton Delete */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteHabit}
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
