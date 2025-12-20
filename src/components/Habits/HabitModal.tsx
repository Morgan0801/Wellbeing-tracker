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
import { useHabits } from '@/hooks/useHabits';
import { useAI } from '@/hooks/useAI';
import { Habit, HabitCategory, HABIT_CATEGORIES, HABIT_FREQUENCIES } from '@/types';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editHabit?: Habit;
  defaultCategory?: HabitCategory;
}

const defaultColorForCategory = (category: HabitCategory) =>
  HABIT_CATEGORIES.find((cat) => cat.type === category)?.color ?? '#66BB6A';

export function HabitModal({ open, onOpenChange, editHabit, defaultCategory = 'sante_sport' }: HabitModalProps) {
  const { addHabit, updateHabit, isAddingHabit } = useHabits();
  const ai = useAI();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('sante_sport');
  const [frequency, setFrequency] = useState<string>('daily');
  const [quantifiable, setQuantifiable] = useState(false);
  const [unit, setUnit] = useState('');
  const [color, setColor] = useState('#66BB6A');

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    name: string;
    category: string;
    frequency: string;
    reason: string;
  }>>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (editHabit) {
      setName(editHabit.name);
      setCategory(editHabit.category);
      setFrequency(editHabit.frequency);
      setQuantifiable(editHabit.quantifiable);
      setUnit(editHabit.unit || '');
      setColor(editHabit.color);
    } else {
      // Reset
      setName('');
      setCategory(defaultCategory);
      setFrequency('daily');
      setQuantifiable(false);
      setUnit('');
      setColor(defaultColorForCategory(defaultCategory));
    }
    // Reset suggestions when modal opens/closes
    setAiSuggestions([]);
    setShowSuggestions(false);
  }, [editHabit, open, defaultCategory]);

  // Debounced AI suggestions on name input
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Don't suggest if:
    // - editing existing habit
    // - name too short
    // - AI not configured
    if (editHabit || name.length < 3 || !ai.isConfigured) {
      setShowSuggestions(false);
      setAiSuggestions([]);
      return;
    }

    // Set loading state immediately
    setIsLoadingSuggestions(true);
    setShowSuggestions(true);

    // Debounce: wait 500ms after user stops typing
    debounceTimer.current = setTimeout(async () => {
      try {
        const suggestions = await ai.suggestHabits({
          partialName: name,
        });
        setAiSuggestions(suggestions.slice(0, 3)); // Limit to 3 suggestions
      } catch (error) {
        console.error('Erreur suggestions habitudes:', error);
        setAiSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 500);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [name, category, editHabit, ai.isConfigured]);

  const handleSuggestionClick = (suggestion: typeof aiSuggestions[0]) => {
    setName(suggestion.name);
    setCategory(suggestion.category);
    setFrequency(suggestion.frequency);
    setColor(defaultColorForCategory(suggestion.category as HabitCategory));
    setShowSuggestions(false);
    setAiSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const habitData = {
      name,
      category: category as any,
      frequency: frequency as any,
      quantifiable,
      unit: quantifiable ? unit : undefined,
      color,
    };

    if (editHabit) {
      updateHabit({ id: editHabit.id, updates: habitData });
    } else {
      addHabit(habitData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editHabit ? 'Modifier l\'habitude' : 'Nouvelle habitude'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Nom */}
          <div className="space-y-2 relative">
            <Label htmlFor="name">Nom de l'habitude</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Courir 5km"
              required
            />

            {/* AI Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && ai.isConfigured && !editHabit && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-200 dark:border-gray-700">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                      Suggestions IA
                    </span>
                  </div>

                  {/* Loading state */}
                  {isLoadingSuggestions && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recherche d'habitudes similaires...</span>
                    </div>
                  )}

                  {/* Suggestions list */}
                  {!isLoadingSuggestions && aiSuggestions.length > 0 && (
                    <div className="py-1">
                      {aiSuggestions.map((suggestion, idx) => {
                        const catData = HABIT_CATEGORIES.find(c => c.type === suggestion.category);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-xl flex-shrink-0">{catData?.emoji || '📌'}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {suggestion.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {catData?.label}
                                  </span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {HABIT_FREQUENCIES.find(f => f.value === suggestion.frequency)?.label}
                                  </span>
                                </div>
                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 line-clamp-1">
                                  {suggestion.reason}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* No results */}
                  {!isLoadingSuggestions && aiSuggestions.length === 0 && (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                      Aucune suggestion trouvée
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <div className="grid grid-cols-2 gap-2">
              {HABIT_CATEGORIES.map((cat) => (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => {
                    setCategory(cat.type);
                    setColor(cat.color);
                  }}
                  className={cn(
                    'p-3 rounded-lg border-2 text-left transition-all',
                    category === cat.type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className="text-2xl mb-1">{cat.emoji}</div>
                  <div className="text-sm font-medium">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Fréquence */}
          <div className="space-y-2">
            <Label>Fréquence</Label>
            <div className="grid grid-cols-2 gap-2">
              {HABIT_FREQUENCIES.map((freq) => (
                <button
                  key={freq.value}
                  type="button"
                  onClick={() => setFrequency(freq.value)}
                  className={cn(
                    'p-2 rounded-lg border-2 text-sm transition-all',
                    frequency === freq.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  )}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantifiable */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Quantifiable</Label>
              <Switch checked={quantifiable} onCheckedChange={setQuantifiable} />
            </div>
            <p className="text-xs text-gray-500">
              Activer si tu veux mesurer une quantité (km, L, min, etc.)
            </p>
          </div>

          {/* Unité (si quantifiable) */}
          {quantifiable && (
            <div className="space-y-2">
              <Label htmlFor="unit">Unité de mesure</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ex: km, L, min, pages"
                required={quantifiable}
              />
            </div>
          )}

          {/* Couleur */}
          <div className="space-y-2">
            <Label htmlFor="color">Couleur</Label>
            <div className="flex gap-2">
              <input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 rounded cursor-pointer"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
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
            <Button type="submit" disabled={isAddingHabit} className="flex-1">
              {isAddingHabit
                ? 'Enregistrement...'
                : editHabit
                ? 'Modifier'
                : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
