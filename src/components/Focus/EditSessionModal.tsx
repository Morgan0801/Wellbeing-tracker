import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FocusSession, SessionTag, SessionType } from '@/types';

interface EditSessionModalProps {
  open: boolean;
  onClose: () => void;
  session: FocusSession | null;
  tags: SessionTag[];
  isSaving?: boolean;
  onSave: (input: {
    id: string;
    startTime: Date;
    durationMinutes: number;
    sessionType: SessionType;
    tags: string[];
    notes?: string | null;
    endTime?: Date | null;
    actualDurationMinutes?: number | null;
  }) => Promise<void>;
}

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  pomodoro: 'Focus',
  short_break: 'Pause courte',
  long_break: 'Pause longue',
};

export function EditSessionModal({
  open,
  onClose,
  session,
  tags,
  isSaving = false,
  onSave,
}: EditSessionModalProps) {
  const initial = useMemo(() => {
    if (!session) return null;
    const start = new Date(session.start_time);
    return {
      date: format(start, 'yyyy-MM-dd'),
      time: format(start, 'HH:mm'),
      durationMinutes: session.actual_duration_minutes ?? session.duration_minutes ?? 25,
      sessionType: session.session_type,
      tags: session.tags ?? (session.category ? [session.category] : []),
      notes: session.notes ?? '',
    };
  }, [session]);

  const [formData, setFormData] = useState(() => ({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    durationMinutes: 25,
    sessionType: 'pomodoro' as SessionType,
    tags: [] as string[],
    notes: '',
  }));

  useEffect(() => {
    if (!initial) return;
    setFormData(initial);
  }, [initial]);

  const toggleTag = (tagName: string) => {
    if (formData.tags.includes(tagName)) {
      setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagName) });
    } else {
      setFormData({ ...formData, tags: [...formData.tags, tagName] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
    if (selectedDateTime > new Date()) {
      alert('Vous ne pouvez pas enregistrer une session dans le futur');
      return;
    }

    if (formData.durationMinutes < 1 || formData.durationMinutes > 240) {
      alert('La durée doit être entre 1 et 240 minutes');
      return;
    }

    const shouldRecalculateEndTime = session.completed || session.is_manual_entry;
    const endTime = shouldRecalculateEndTime
      ? new Date(selectedDateTime.getTime() + formData.durationMinutes * 60000)
      : undefined;

    await onSave({
      id: session.id,
      startTime: selectedDateTime,
      durationMinutes: formData.durationMinutes,
      sessionType: formData.sessionType,
      tags: formData.tags,
      notes: formData.notes || null,
      endTime,
      actualDurationMinutes: shouldRecalculateEndTime ? formData.durationMinutes : undefined,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la session</DialogTitle>
          <DialogDescription>
            Ajustez la date, durée, tags et notes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Type
            </label>
            <select
              value={formData.sessionType}
              onChange={(e) =>
                setFormData({ ...formData, sessionType: e.target.value as SessionType })
              }
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
            >
              {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map((type) => (
                <option key={type} value={type}>
                  {SESSION_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

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

          {/* Tags */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Catégories (optionnel, plusieurs choix possibles)
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = formData.tags.includes(tag.name);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.name)}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all border"
                    style={{
                      backgroundColor: isSelected ? `${tag.color}20` : 'transparent',
                      borderColor: isSelected ? tag.color : 'transparent',
                      color: isSelected ? tag.color : 'inherit',
                    }}
                  >
                    <span className="mr-1">{tag.emoji}</span>
                    {tag.name}
                  </button>
                );
              })}
            </div>
            {formData.tags.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {formData.tags.length} tag{formData.tags.length > 1 ? 's' : ''} sélectionné{formData.tags.length > 1 ? 's' : ''}
              </p>
            )}
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
              disabled={!session || isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

