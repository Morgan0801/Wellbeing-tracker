import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmotionSelector } from './EmotionSelector';
import { DomainSliders } from './DomainSliders';
import { useMood } from '@/hooks/useMood';
import { MOOD_LEVELS, DomainType } from '@/types';
import { WeatherData } from '@/types';
import { cn } from '@/lib/utils';

interface MoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weather: WeatherData | null;
}

export function MoodModal({ open, onOpenChange, weather }: MoodModalProps) {
  const [step, setStep] = useState(1);
  const [scoreGlobal, setScoreGlobal] = useState(5);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [domains, setDomains] = useState<Record<DomainType, number>>({
    travail: 0,
    sport: 0,
    amour: 0,
    amis: 0,
    famille: 0,
    finances: 0,
    loisirs: 0,
    bienetre: 0,
  });

  const { addMood, isAdding } = useMood();

  const handleDomainChange = (domain: DomainType, value: number) => {
    setDomains((prev) => ({ ...prev, [domain]: value }));
  };

  const handleSubmit = () => {
    const domainsToSave = Object.entries(domains)
      .filter(([, impact]) => impact !== 0)
      .map(([domain, impact]) => ({ domain, impact }));

    addMood({
      score_global: scoreGlobal,
      emotions: selectedEmotions,
      note: note || undefined,
      weather: weather || undefined,
      domains: domainsToSave,
    });

    // Reset form
    setStep(1);
    setScoreGlobal(5);
    setSelectedEmotions([]);
    setNote('');
    setDomains({
      travail: 0,
      sport: 0,
      amour: 0,
      amis: 0,
      famille: 0,
      finances: 0,
      loisirs: 0,
      bienetre: 0,
    });
    onOpenChange(false);
  };

  const getMoodLevel = () => {
    return MOOD_LEVELS.find(
      (level) => scoreGlobal >= level.range[0] && scoreGlobal <= level.range[1]
    );
  };

  const currentMoodLevel = getMoodLevel();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comment te sens-tu ?</DialogTitle>
          <DialogDescription>
            Étape {step} sur 4
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Étape 1: Score Global */}
          {step === 1 && (
            <div className="space-y-4">
              <Label>Score global du moment</Label>
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="text-6xl">{currentMoodLevel?.emoji}</div>
                <div className="text-2xl font-bold">{scoreGlobal}/10</div>
                <div
                  className="text-lg font-medium"
                  style={{ color: currentMoodLevel?.color }}
                >
                  {currentMoodLevel?.label}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {MOOD_LEVELS.map((level) => (
                  <button
                    key={level.range[0]}
                    type="button"
                    onClick={() => setScoreGlobal(level.range[0])}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2',
                      scoreGlobal >= level.range[0] && scoreGlobal <= level.range[1]
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    )}
                  >
                    <span className="text-3xl">{level.emoji}</span>
                    <span className="text-xs font-medium">{level.label}</span>
                    <span className="text-xs text-gray-500">
                      {level.range[0]}-{level.range[1]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 2: Émotions */}
          {step === 2 && (
            <div className="space-y-4">
              <Label>Quelles émotions ressens-tu ?</Label>
              <p className="text-sm text-gray-500">
                Sélectionne toutes les émotions qui correspondent à ton état actuel
              </p>
              <EmotionSelector
                selectedEmotions={selectedEmotions}
                onChange={setSelectedEmotions}
              />
            </div>
          )}

          {/* Étape 3: Domaines */}
          {step === 3 && (
            <div className="space-y-4">
              <Label>Impact par domaine de vie</Label>
              <p className="text-sm text-gray-500">
                Glisse les curseurs pour indiquer l'impact de chaque domaine sur ton humeur (-5 à +5)
              </p>
              <DomainSliders domains={domains} onChange={handleDomainChange} />
            </div>
          )}

          {/* Étape 4: Note */}
          {step === 4 && (
            <div className="space-y-4">
              <Label htmlFor="note">Note (optionnel)</Label>
              <p className="text-sm text-gray-500">
                Ajoute du contexte ou des détails sur ce que tu ressens
              </p>
              <Textarea
                id="note"
                placeholder="Que se passe-t-il ? Contexte, détails..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-between">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Précédent
            </Button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)}>Suivant</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isAdding}>
              {isAdding ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
