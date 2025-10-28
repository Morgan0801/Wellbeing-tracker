import { useState, useEffect } from 'react';
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
import { Habit, HabitCategory, HABIT_CATEGORIES, HABIT_FREQUENCIES } from '@/types';
import { cn } from '@/lib/utils';

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

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('sante_sport');
  const [frequency, setFrequency] = useState<string>('daily');
  const [quantifiable, setQuantifiable] = useState(false);
  const [unit, setUnit] = useState('');
  const [color, setColor] = useState('#66BB6A');

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
  }, [editHabit, open, defaultCategory]);

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
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'habitude</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Courir 5km"
              required
            />
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
