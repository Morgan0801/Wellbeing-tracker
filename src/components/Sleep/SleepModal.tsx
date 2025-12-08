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
import { useSleep } from '@/hooks/useSleep';
import { SleepLog } from '@/types';

interface SleepModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editSleep?: SleepLog;
}

// Helper functions for time format conversion
const hoursToTimeFormat = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
};

const timeFormatToHours = (timeStr: string): number => {
  // Accepte: "2h30", "2h", "2.5", "2,5"
  timeStr = timeStr.toLowerCase().trim();

  // Si c'est juste un nombre (2.5 ou 2,5)
  if (!timeStr.includes('h')) {
    return parseFloat(timeStr.replace(',', '.'));
  }

  // Sinon format "2h30"
  const parts = timeStr.split('h');
  const hours = parseInt(parts[0]) || 0;
  const minutes = parts[1] ? parseInt(parts[1]) || 0 : 0;
  return hours + minutes / 60;
};

export function SleepModal({ open, onOpenChange, editSleep }: SleepModalProps) {
  const { addSleepLog, updateSleepLog, isAddingSleepLog } = useSleep();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalHours, setTotalHours] = useState('7h30');
  const [remHours, setRemHours] = useState('1h30');
  const [deepHours, setDeepHours] = useState('2h');
  const [avgHeartRate, setAvgHeartRate] = useState('60');
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeupTime, setWakeupTime] = useState('07:00');
  const [qualityScore, setQualityScore] = useState('7');
  const [sleptAlone, setSleptAlone] = useState(true);

  useEffect(() => {
    if (editSleep) {
      setDate(editSleep.date);
      setTotalHours(hoursToTimeFormat(editSleep.total_hours));
      setRemHours(hoursToTimeFormat(editSleep.rem_hours));
      setDeepHours(hoursToTimeFormat(editSleep.deep_hours));
      setAvgHeartRate(editSleep.avg_heart_rate.toString());
      setBedtime(editSleep.bedtime);
      setWakeupTime(editSleep.wakeup_time);
      setQualityScore(editSleep.quality_score.toString());
      setSleptAlone(editSleep.slept_alone ?? true);
    } else {
      // Reset values
      setDate(new Date().toISOString().split('T')[0]);
      setTotalHours('7h30');
      setRemHours('1h30');
      setDeepHours('2h');
      setAvgHeartRate('60');
      setBedtime('23:00');
      setWakeupTime('07:00');
      setQualityScore('7');
      setSleptAlone(true);
    }
  }, [editSleep, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sleepData = {
      date,
      total_hours: timeFormatToHours(totalHours),
      rem_hours: timeFormatToHours(remHours),
      deep_hours: timeFormatToHours(deepHours),
      avg_heart_rate: parseInt(avgHeartRate),
      bedtime,
      wakeup_time: wakeupTime,
      quality_score: parseInt(qualityScore),
      slept_alone: sleptAlone,
    };

    if (editSleep) {
      updateSleepLog({ id: editSleep.id, ...sleepData });
    } else {
      addSleepLog(sleepData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editSleep ? 'Modifier la nuit de sommeil' : 'Ajouter une nuit de sommeil'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Heures de coucher et réveil */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bedtime">Heure de coucher</Label>
              <Input
                id="bedtime"
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wakeupTime">Heure de réveil</Label>
              <Input
                id="wakeupTime"
                type="time"
                value={wakeupTime}
                onChange={(e) => setWakeupTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Heures totales */}
          <div className="space-y-2">
            <Label htmlFor="totalHours">Heures totales de sommeil</Label>
            <Input
              id="totalHours"
              type="text"
              value={totalHours}
              onChange={(e) => setTotalHours(e.target.value)}
              placeholder="Ex: 7h30 ou 7.5"
              required
            />
            <p className="text-xs text-gray-500">Format: 7h30 ou 7.5</p>
          </div>

          {/* Sommeil paradoxal (REM) */}
          <div className="space-y-2">
            <Label htmlFor="remHours">Sommeil paradoxal (REM)</Label>
            <Input
              id="remHours"
              type="text"
              value={remHours}
              onChange={(e) => setRemHours(e.target.value)}
              placeholder="Ex: 1h30 ou 1.5"
              required
            />
            <p className="text-xs text-gray-500">Format: 1h30 ou 1.5</p>
          </div>

          {/* Sommeil profond */}
          <div className="space-y-2">
            <Label htmlFor="deepHours">Sommeil profond</Label>
            <Input
              id="deepHours"
              type="text"
              value={deepHours}
              onChange={(e) => setDeepHours(e.target.value)}
              placeholder="Ex: 2h ou 2.0"
              required
            />
            <p className="text-xs text-gray-500">Format: 2h ou 2.0</p>
          </div>

          {/* Fréquence cardiaque */}
          <div className="space-y-2">
            <Label htmlFor="avgHeartRate">Fréquence cardiaque moyenne (bpm)</Label>
            <Input
              id="avgHeartRate"
              type="number"
              min="30"
              max="200"
              value={avgHeartRate}
              onChange={(e) => setAvgHeartRate(e.target.value)}
              required
            />
          </div>

          {/* Score de qualité */}
          <div className="space-y-2">
            <Label htmlFor="qualityScore">
              Score de qualité (1-10)
              <span className="ml-2 text-sm font-normal text-gray-500">
                Actuellement: {qualityScore}/10
              </span>
            </Label>
            <input
              id="qualityScore"
              type="range"
              min="1"
              max="10"
              value={qualityScore}
              onChange={(e) => setQualityScore(e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>

          {/* Dormi seul ou en couple */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{sleptAlone ? '🛏️' : '💑'}</span>
              <div>
                <Label>Situation</Label>
                <p className="text-xs text-muted-foreground">
                  {sleptAlone ? 'Dormi seul(e)' : 'Dormi en couple'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSleptAlone(!sleptAlone)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${sleptAlone
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300'
                }`}
            >
              {sleptAlone ? '🛏️ Seul(e)' : '💑 En couple'}
            </button>
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
            <Button type="submit" disabled={isAddingSleepLog} className="flex-1">
              {isAddingSleepLog
                ? 'Enregistrement...'
                : editSleep
                  ? 'Modifier'
                  : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
