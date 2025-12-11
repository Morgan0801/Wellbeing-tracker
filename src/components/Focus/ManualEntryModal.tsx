import { useState } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFocusEnhanced } from '@/hooks/useFocusEnhanced';

interface ManualEntryModalProps {
  open: boolean;
  onClose: () => void;
}

export function ManualEntryModal({ open, onClose }: ManualEntryModalProps) {
  const { tags, createManualSession } = useFocusEnhanced();

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    durationMinutes: 25,
    category: null as string | null,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation : empêcher les dates futures
    const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
    if (selectedDateTime > new Date()) {
      alert('Vous ne pouvez pas ajouter une session dans le futur');
      return;
    }

    // Validation : durée valide
    if (formData.durationMinutes < 1 || formData.durationMinutes > 240) {
      alert('La durée doit être entre 1 et 240 minutes');
      return;
    }

    try {
      await createManualSession.mutateAsync({
        startTime: selectedDateTime,
        durationMinutes: formData.durationMinutes,
        category: formData.category || undefined,
        notes: formData.notes || undefined,
      });

      // Réinitialiser le formulaire
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        durationMinutes: 25,
        category: null,
        notes: '',
      });

      onClose();
    } catch (error) {
      console.error('Error creating manual session:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une session manuellement</DialogTitle>
          <DialogDescription>
            Enregistrez une session Pomodoro passée que vous avez réalisée.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Date */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Date
            </label>
            <Input
              type="date"
              value={formData.date}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
          </div>

          {/* Heure */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Heure de début
            </label>
            <Input
              type="time"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
              required
            />
          </div>

          {/* Durée */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Durée (minutes)
            </label>
            <div className="space-y-2">
              <Input
                type="range"
                min="5"
                max="120"
                step="5"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationMinutes: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>5 min</span>
                <span className="font-semibold text-foreground text-lg">
                  {formData.durationMinutes} min
                </span>
                <span>120 min</span>
              </div>

              {/* Boutons rapides */}
              <div className="flex gap-2 flex-wrap">
                {[15, 25, 30, 45, 60, 90].map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, durationMinutes: duration })
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      formData.durationMinutes === duration
                        ? 'bg-focus text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {duration}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Catégorie (optionnel)
            </label>
            <div className="flex flex-wrap gap-2">
              {/* Option "Aucune" */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: null })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  formData.category === null
                    ? 'bg-muted/20 border-foreground text-foreground'
                    : 'bg-muted/5 border-transparent text-muted-foreground hover:border-muted-foreground/30'
                }`}
              >
                Aucune
              </button>

              {/* Tags */}
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, category: tag.name })
                  }
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border`}
                  style={{
                    backgroundColor:
                      formData.category === tag.name
                        ? `${tag.color}20`
                        : 'transparent',
                    borderColor:
                      formData.category === tag.name ? tag.color : 'transparent',
                    color: formData.category === tag.name ? tag.color : 'inherit',
                  }}
                >
                  <span className="mr-1">{tag.emoji}</span>
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Notes (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Ajoutez des détails sur cette session..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-focus"
            />
            <div className="text-xs text-muted-foreground text-right mt-1">
              {formData.notes.length}/500
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createManualSession.isPending}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {createManualSession.isPending
                ? 'Ajout en cours...'
                : 'Ajouter la session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
