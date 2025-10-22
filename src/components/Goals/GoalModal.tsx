import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoals } from '@/hooks/useGoals';
import { GOAL_CATEGORIES } from '@/types/phase4-types';

interface GoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoalModal({ open, onOpenChange }: GoalModalProps) {
  const { addGoal } = useGoals();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('perso');
  const [targetDate, setTargetDate] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    addGoal({
      title,
      description: description || undefined,
      category,
      target_date: targetDate || undefined,
    });

    onOpenChange(false);
    // Reset form
    setTitle('');
    setDescription('');
    setCategory('perso');
    setTargetDate('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Nouvel objectif</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Titre *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Courir un marathon"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Décrivez votre objectif..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie *</label>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => setCategory(cat.type)}
                  className={`
                    flex items-center gap-2 p-3 border rounded-lg transition-all
                    ${category === cat.type 
                      ? 'border-2 shadow-sm' 
                      : 'border hover:border-gray-400'
                    }
                  `}
                  style={{
                    borderColor: category === cat.type ? cat.color : undefined,
                    backgroundColor: category === cat.type ? `${cat.color}10` : undefined,
                  }}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Date cible (optionnel)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
