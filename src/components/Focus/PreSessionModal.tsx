import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, Play } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ENERGY_LEVELS } from '@/types';
import { cn } from '@/lib/utils';

interface PreSessionModalProps {
  open: boolean;
  onClose: () => void;
  onStart: (data: {
    objective?: string;
    preEnergyLevel?: number;
  }) => void;
}

export function PreSessionModal({ open, onClose, onStart }: PreSessionModalProps) {
  const [objective, setObjective] = useState('');
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);

  const handleStart = () => {
    onStart({
      objective: objective.trim() || undefined,
      preEnergyLevel: energyLevel || undefined,
    });
    setObjective('');
    setEnergyLevel(null);
  };

  const handleSkip = () => {
    onStart({});
    setObjective('');
    setEnergyLevel(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-focus" />
            Préparer votre session
          </DialogTitle>
          <DialogDescription>
            Définissez votre objectif et évaluez votre énergie pour optimiser votre focus.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Objective Input */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              Objectif de la session
            </label>
            <Input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Que souhaitez-vous accomplir ?"
              maxLength={200}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {objective.length}/200
            </p>
          </div>

          {/* Energy Level Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              Niveau d'énergie actuel
            </label>
            <div className="flex gap-2 justify-center">
              {ENERGY_LEVELS.map((level) => (
                <motion.button
                  key={level.value}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEnergyLevel(level.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all border-2",
                    energyLevel === level.value
                      ? "border-current shadow-soft-md"
                      : "border-transparent hover:bg-muted/20"
                  )}
                  style={{
                    backgroundColor: energyLevel === level.value ? `${level.color}20` : undefined,
                    color: energyLevel === level.value ? level.color : undefined,
                  }}
                >
                  <span className="text-2xl">{level.emoji}</span>
                  <span className="text-xs font-medium whitespace-nowrap">{level.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleSkip}>
            Passer
          </Button>
          <Button
            onClick={handleStart}
            className="gap-2 bg-gradient-to-r from-focus to-focus-light text-white"
          >
            <Play className="w-4 h-4" />
            Démarrer la session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
