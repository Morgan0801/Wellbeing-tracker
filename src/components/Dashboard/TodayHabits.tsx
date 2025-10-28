import { useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckSquare, Check, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function TodayHabits() {
  const { habits, getLogsForDate, logHabit, calculateStreak, isLoggingHabit } = useHabits();
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
  const [showQuantityInput, setShowQuantityInput] = useState<Record<string, boolean>>({});

  const today = format(new Date(), 'yyyy-MM-dd');
  // All habits are considered active (no is_active property in the schema)
  const activeHabits = habits;

  const handleQuickCheck = (habitId: string, quantifiable: boolean) => {
    if (quantifiable) {
      setShowQuantityInput((prev) => ({ ...prev, [habitId]: true }));
    } else {
      logHabit({
        habitId,
        date: today,
        completed: true,
        quantity: undefined,
      });
    }
  };

  const handleSubmitQuantity = (habitId: string, e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantityInputs[habitId] || '0');

    if (!isNaN(qty) && qty > 0) {
      logHabit({
        habitId,
        date: today,
        completed: true,
        quantity: qty,
      });
      setQuantityInputs((prev) => ({ ...prev, [habitId]: '' }));
      setShowQuantityInput((prev) => ({ ...prev, [habitId]: false }));
    }
  };

  const handleCancelQuantity = (habitId: string) => {
    setShowQuantityInput((prev) => ({ ...prev, [habitId]: false }));
    setQuantityInputs((prev) => ({ ...prev, [habitId]: '' }));
  };

  if (activeHabits.length === 0) {
    return (
      <Card className="p-2 md:p-4">
        <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
          <CardTitle className="text-sm md:text-lg flex items-center gap-1 md:gap-2">
            <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
            <span>Habitudes du jour</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <div className="text-center py-6 md:py-8 text-gray-500 dark:text-gray-400">
            <CheckSquare className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-20" />
            <p className="text-xs md:text-sm">Aucune habitude active</p>
            <p className="text-[10px] md:text-xs mt-1">
              Créez des habitudes pour les suivre ici
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-2 md:p-4">
      <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
        <CardTitle className="text-sm md:text-lg flex items-center gap-1 md:gap-2">
          <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
          <span>Habitudes du jour</span>
          <span className="text-[10px] md:text-xs font-normal text-gray-500 dark:text-gray-400 ml-auto">
            {activeHabits.filter((h) => getLogsForDate(h.id, today).length > 0).length} / {activeHabits.length}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 md:p-6 pt-0 space-y-2 md:space-y-3">
        {activeHabits.map((habit) => {
          const logsForToday = getLogsForDate(habit.id, today);
          const hasLogs = logsForToday.length > 0;
          const streak = calculateStreak(habit.id);
          const totalQuantity = logsForToday.reduce((sum, log) => sum + (log.quantity || 0), 0);
          const isShowingInput = showQuantityInput[habit.id];

          return (
            <div
              key={habit.id}
              className={cn(
                'flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border transition-all',
                hasLogs
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              )}
            >
              {/* Checkbox / Check */}
              <div className="shrink-0">
                {hasLogs ? (
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                ) : (
                  <button
                    onClick={() => handleQuickCheck(habit.id, habit.quantifiable)}
                    disabled={isLoggingHabit}
                    className="w-5 h-5 md:w-6 md:h-6 rounded-md border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500 transition-colors"
                    aria-label={`Marquer ${habit.name} comme complété`}
                  />
                )}
              </div>

              {/* Habit info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 md:gap-2">
                  <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate">
                    {habit.name}
                  </span>
                  {streak > 0 && (
                    <span className="text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                      🔥{streak}
                    </span>
                  )}
                </div>

                {/* Quantity info or input */}
                {habit.quantifiable && (
                  <>
                    {isShowingInput ? (
                      <form
                        onSubmit={(e) => handleSubmitQuantity(habit.id, e)}
                        className="flex gap-1 mt-1"
                      >
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={quantityInputs[habit.id] || ''}
                          onChange={(e) =>
                            setQuantityInputs((prev) => ({ ...prev, [habit.id]: e.target.value }))
                          }
                          placeholder={`${habit.unit}`}
                          className="h-6 md:h-7 text-[10px] md:text-xs"
                          autoFocus
                        />
                        <Button
                          type="submit"
                          size="sm"
                          className="h-6 md:h-7 px-2 text-[10px] md:text-xs"
                        >
                          ✓
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelQuantity(habit.id)}
                          className="h-6 md:h-7 px-2 text-[10px] md:text-xs"
                        >
                          ✕
                        </Button>
                      </form>
                    ) : (
                      <>
                        {hasLogs && totalQuantity > 0 && (
                          <p className="text-[10px] md:text-xs text-green-700 dark:text-green-400 mt-0.5">
                            {totalQuantity} {habit.unit}
                            {logsForToday.length > 1 && (
                              <span className="text-gray-500 dark:text-gray-400 ml-1">
                                ({logsForToday.length}×)
                              </span>
                            )}
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Add more button for quantifiable habits */}
              {habit.quantifiable && hasLogs && !isShowingInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuantityInput((prev) => ({ ...prev, [habit.id]: true }))}
                  className="h-6 w-6 md:h-7 md:w-7 p-0 shrink-0"
                  title="Ajouter une autre entrée"
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
