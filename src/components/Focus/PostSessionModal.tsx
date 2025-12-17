import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ENERGY_LEVELS, SESSION_MOODS } from '@/types';
import { cn } from '@/lib/utils';

interface PostSessionModalProps {
  open: boolean;
  objective?: string;
  duration: number;
  distractionsCount: number;
  onClose: () => void;
  onSubmit: (data: {
    postFocusQuality?: number;
    sessionMood?: string;
    notes?: string;
  }) => void;
}

export function PostSessionModal({
  open,
  objective,
  duration,
  distractionsCount,
  onClose,
  onSubmit,
}: PostSessionModalProps) {
  const [focusQuality, setFocusQuality] = useState<number | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onSubmit({
      postFocusQuality: focusQuality || undefined,
      sessionMood: mood || undefined,
      notes: notes.trim() || undefined,
    });
    // Réinitialiser
    setFocusQuality(null);
    setMood(null);
    setNotes('');
  };

  const handleSkip = () => {
    onSubmit({});
    // Réinitialiser
    setFocusQuality(null);
    setMood(null);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-vitality" />
            Session terminée !
          </DialogTitle>
        </DialogHeader>

        {/* Session Summary */}
        <div className="bg-gradient-to-br from-vitality/10 to-vitality/5 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-vitality">{duration}m</div>
              <div className="text-xs text-muted-foreground">Durée</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-productivity">{distractionsCount}</div>
              <div className="text-xs text-muted-foreground">Distractions</div>
            </div>
          </div>
          {objective && (
            <div className="mt-3 pt-3 border-t border-vitality/20 text-center">
              <div className="text-xs text-muted-foreground mb-1">Objectif</div>
              <div className="text-sm font-medium">{objective}</div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Focus Quality Rating */}
          <div>
            <label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Qualité de votre focus
            </label>
            <div className="flex gap-2 justify-center">
              {ENERGY_LEVELS.map((level) => (
                <motion.button
                  key={level.value}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFocusQuality(level.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all border-2",
                    focusQuality === level.value
                      ? "border-current shadow-soft-md"
                      : "border-transparent hover:bg-muted/20"
                  )}
                  style={{
                    backgroundColor: focusQuality === level.value ? `${level.color}20` : undefined,
                    color: focusQuality === level.value ? level.color : undefined,
                  }}
                >
                  <span className="text-2xl">{level.emoji}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Session Mood */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Comment vous sentez-vous ?
            </label>
            <div className="flex flex-wrap gap-2 justify-center">
              {SESSION_MOODS.map((m) => (
                <motion.button
                  key={m.emoji}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMood(m.emoji)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-sm transition-all border-2",
                    mood === m.emoji
                      ? "bg-focus/20 border-focus text-focus"
                      : "border-transparent hover:bg-muted/20"
                  )}
                >
                  <span className="mr-1">{m.emoji}</span>
                  {m.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comment s'est passée cette session ?"
              rows={2}
              maxLength={300}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-focus focus:border-focus"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {notes.length}/300
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={handleSkip}>
            Passer
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
