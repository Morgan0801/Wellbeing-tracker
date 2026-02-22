import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { EmotionSelector } from './EmotionSelector';
import { ActivityCheckboxes } from './ActivityCheckboxes';
import { DomainSliders } from './DomainSliders';
import { AIMoodSupportCard } from './AIMoodSupportCard';
import { useMood } from '@/hooks/useMood';
import { useActivities } from '@/hooks/useActivities';
import { MOOD_LEVELS, MoodLog, DOMAINS, DomainType, ActivityCategory } from '@/types';
import { WeatherData } from '@/types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface MoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weather: WeatherData | null;
  editingMood?: MoodLog;
}

// Initialiser les domaines avec des valeurs neutres (0)
const getInitialDomains = (): Record<DomainType, number> => {
  const initial: Partial<Record<DomainType, number>> = {};
  DOMAINS.forEach(d => { initial[d.type] = 0; });
  return initial as Record<DomainType, number>;
};

export function MoodModal({ open, onOpenChange, weather, editingMood }: MoodModalProps) {
  const [step, setStep] = useState(1);
  const [scoreGlobal, setScoreGlobal] = useState(5);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [moodDate, setMoodDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [energyLevel, setEnergyLevel] = useState(5);
  const [domains, setDomains] = useState<Record<DomainType, number>>(getInitialDomains());

  const { addMoodAsync, updateMoodAsync, isAdding, isUpdating } = useMood();
  const { activityTypes, addActivityType, saveMoodActivities } = useActivities();

  // Charger les mood_domains existants lors de l'édition
  const loadExistingDomains = async (moodId: string) => {
    const { data } = await supabase
      .from('mood_domains')
      .select('domain, impact')
      .eq('mood_id', moodId);

    if (data && data.length > 0) {
      const loadedDomains = getInitialDomains();
      data.forEach((d: { domain: string; impact: number }) => {
        if (d.domain in loadedDomains) {
          loadedDomains[d.domain as DomainType] = d.impact;
        }
      });
      setDomains(loadedDomains);
    }
  };

  // Charger les mood_activities existantes lors de l'édition
  const loadExistingActivities = async (moodId: string) => {
    const { data } = await supabase
      .from('mood_activities')
      .select('activity_type_id, done')
      .eq('mood_id', moodId);

    if (data && data.length > 0) {
      const loadedActivities = new Set<string>();
      data.forEach((a: { activity_type_id: string; done: boolean }) => {
        if (a.done) {
          loadedActivities.add(a.activity_type_id);
        }
      });
      setSelectedActivities(loadedActivities);
    }
  };

  useEffect(() => {
    if (editingMood && open) {
      setScoreGlobal(editingMood.score_global);
      setSelectedEmotions(editingMood.emotions || []);
      setNote(editingMood.note || '');
      setEnergyLevel(editingMood.energy_level || 5);
      try {
        setMoodDate(format(parseISO(editingMood.datetime), 'yyyy-MM-dd'));
      } catch {
        setMoodDate(format(new Date(), 'yyyy-MM-dd'));
      }
      // Charger les domaines existants
      loadExistingDomains(editingMood.id);
      // Charger les activités existantes
      loadExistingActivities(editingMood.id);
    } else if (!editingMood && open) {
      setScoreGlobal(5);
      setSelectedEmotions([]);
      setNote('');
      setMoodDate(format(new Date(), 'yyyy-MM-dd'));
      setSelectedActivities(new Set());
      setEnergyLevel(5);
      setDomains(getInitialDomains());
      setStep(1);
    }
  }, [editingMood, open]);

  const handleAddCustomActivity = (name: string, emoji: string, category: string) => {
    addActivityType.mutate({
      name,
      emoji,
      category: category as ActivityCategory,
      is_default: false,
      is_active: true,
    });
  };

  const handleSubmit = async () => {
    const now = new Date();
    const [year, month, day] = moodDate.split('-').map(Number);
    const datetimeWithTime = new Date(year, month - 1, day, now.getHours(), now.getMinutes());
    const datetimeISO = datetimeWithTime.toISOString();

    // Préparer les activités: done = in set, not done = not in set
    const activitiesToSave = activityTypes.map(a => ({
      activity_type_id: a.id,
      done: selectedActivities.has(a.id),
    }));

    // Préparer les domains (seulement ceux qui ne sont pas à 0)
    const domainsToSave = Object.entries(domains)
      .filter(([, impact]) => impact !== 0)
      .map(([domain, impact]) => ({ domain, impact }));

    if (editingMood) {
      await updateMoodAsync({
        id: editingMood.id,
        updates: {
          score_global: scoreGlobal,
          emotions: selectedEmotions,
          note: note || undefined,
          weather: weather || undefined,
          energy_level: energyLevel,
          datetime: datetimeISO,
          domains: domainsToSave,
        },
      });

      if (activitiesToSave.length > 0) {
        saveMoodActivities.mutate({
          moodId: editingMood.id,
          activities: activitiesToSave,
        });
      }
    } else {
      const newMood = await addMoodAsync({
        score_global: scoreGlobal,
        emotions: selectedEmotions,
        note: note || undefined,
        weather: weather || undefined,
        energy_level: energyLevel,
        datetime: datetimeISO,
        domains: domainsToSave,
      });

      if (newMood && activitiesToSave.length > 0) {
        saveMoodActivities.mutate({
          moodId: newMood.id,
          activities: activitiesToSave,
        });
      }
    }

    // Reset form
    setStep(1);
    setScoreGlobal(5);
    setSelectedEmotions([]);
    setNote('');
    setMoodDate(format(new Date(), 'yyyy-MM-dd'));
    setSelectedActivities(new Set());
    setEnergyLevel(5);
    setDomains(getInitialDomains());
    onOpenChange(false);
  };

  const getMoodLevel = () => {
    return MOOD_LEVELS.find(
      (level) => scoreGlobal >= level.range[0] && scoreGlobal <= level.range[1],
    );
  };

  const currentMoodLevel = getMoodLevel();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl max-h-[90vh] overflow-y-auto pb-24">
        <DialogHeader>
          <DialogTitle>
            {editingMood ? 'Modifier le mood' : 'Comment te sens-tu ?'}
          </DialogTitle>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => s < step ? setStep(s) : undefined}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300 flex-1',
                    s === step
                      ? 'bg-primary'
                      : s < step
                        ? 'bg-primary/40 cursor-pointer hover:bg-primary/60'
                        : 'bg-muted'
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {['Score & énergie', 'Émotions', 'Activités & contexte', 'Domaines de vie', 'Note & date'][step - 1]}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4 pb-4">
          {/* Étape 1: Score global */}
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
                      'p-3 md:p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-1 md:gap-2',
                      scoreGlobal >= level.range[0] && scoreGlobal <= level.range[1]
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
                    )}
                  >
                    <span className="text-2xl md:text-3xl">{level.emoji}</span>
                    <span className="text-xs font-medium hidden sm:block">{level.label}</span>
                  </button>
                ))}
              </div>

              {/* Energy Level Slider */}
              <div className="pt-4 border-t">
                <Label>Niveau d'énergie</Label>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-2xl">🔋</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-lg font-bold w-8 text-center">{energyLevel}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  1 = épuisé, 10 = plein d'énergie
                </p>
              </div>
            </div>
          )}

          {/* Carte de soutien IA (si score < 5) */}
          <AIMoodSupportCard
            score={scoreGlobal}
            emotions={selectedEmotions}
            show={step >= 1}
          />

          {/* Étape 2: Émotions */}
          {step === 2 && (
            <div className="space-y-4">
              <Label>Quelles émotions ressens-tu ?</Label>
              <p className="text-sm text-muted-foreground">
                Sélectionne toutes les émotions qui correspondent.
              </p>
              <EmotionSelector
                selectedEmotions={selectedEmotions}
                onChange={setSelectedEmotions}
              />
            </div>
          )}

          {/* Étape 3: Activités (Bearable-style) */}
          {step === 3 && (
            <div className="space-y-4">
              <Label>Qu'as-tu fait aujourd'hui ?</Label>
              <ActivityCheckboxes
                activityTypes={activityTypes}
                selectedActivities={selectedActivities}
                onChange={setSelectedActivities}
                onAddCustom={handleAddCustomActivity}
              />
            </div>
          )}

          {/* Étape 4: Impact par domaine de vie */}
          {step === 4 && (
            <div className="space-y-4">
              <Label>Comment ces domaines ont-ils impacté ta journée ?</Label>
              <p className="text-sm text-muted-foreground">
                Indique l'impact de chaque domaine sur ton humeur (-5 = très négatif, +5 = très positif, 0 = neutre)
              </p>
              <DomainSliders
                domains={domains}
                onChange={(domain, value) => {
                  setDomains(prev => ({ ...prev, [domain]: value }));
                }}
              />
            </div>
          )}

          {/* Étape 5: Note et date */}
          {step === 5 && (
            <div className="space-y-4">
              <Label htmlFor="note">Note (optionnel)</Label>
              <p className="text-sm text-muted-foreground">
                Ajoute du contexte ou des détails.
              </p>
              <Textarea
                id="note"
                placeholder="Que se passe-t-il ? Contexte, détails..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
              />
              <div className="space-y-2">
                <Label htmlFor="mood-date">Date du ressenti</Label>
                <Input
                  id="mood-date"
                  type="date"
                  value={moodDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setMoodDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 justify-between pt-4 border-t mt-auto">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Précédent
            </Button>
          )}
          <div className="flex-1" />
          {step < 5 ? (
            <Button onClick={() => setStep(step + 1)}>Suivant</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isAdding || isUpdating}>
              {isAdding || isUpdating
                ? 'Enregistrement...'
                : editingMood
                  ? 'Modifier'
                  : 'Enregistrer'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
