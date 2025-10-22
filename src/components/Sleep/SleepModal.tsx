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

export function SleepModal({ open, onOpenChange, editSleep }: SleepModalProps) {
  const { addSleepLog, updateSleepLog, isAddingSleepLog } = useSleep();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalHours, setTotalHours] = useState('7.5');
  const [remHours, setRemHours] = useState('1.5');
  const [deepHours, setDeepHours] = useState('2');
  const [avgHeartRate, setAvgHeartRate] = useState('60');
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeupTime, setWakeupTime] = useState('07:00');
  const [qualityScore, setQualityScore] = useState('7');

  useEffect(() => {
    if (editSleep) {
      setDate(editSleep.date);
      setTotalHours(editSleep.total_hours.toString());
      setRemHours(editSleep.rem_hours.toString());
      setDeepHours(editSleep.deep_hours.toString());
      setAvgHeartRate(editSleep.avg_heart_rate.toString());
      setBedtime(editSleep.bedtime);
      setWakeupTime(editSleep.wakeup_time);
      setQualityScore(editSleep.quality_score.toString());
    } else {
      // Reset values
      setDate(new Date().toISOString().split('T')[0]);
      setTotalHours('7.5');
      setRemHours('1.5');
      setDeepHours('2');
      setAvgHeartRate('60');
      setBedtime('23:00');
      setWakeupTime('07:00');
      setQualityScore('7');
    }
  }, [editSleep, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sleepData = {
      date,
      total_hours: parseFloat(totalHours),
      rem_hours: parseFloat(remHours),
      deep_hours: parseFloat(deepHours),
      avg_heart_rate: parseInt(avgHeartRate),
      bedtime,
      wakeup_time: wakeupTime,
      quality_score: parseInt(qualityScore),
    };

    if (editSleep) {
      updateSleepLog(editSleep.id, sleepData);
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
              type="number"
              step="0.1"
              min="0"
              max="24"
              value={totalHours}
              onChange={(e) => setTotalHours(e.target.value)}
              required
            />
          </div>

          {/* Sommeil paradoxal (REM) */}
          <div className="space-y-2">
            <Label htmlFor="remHours">Sommeil paradoxal (REM) - heures</Label>
            <Input
              id="remHours"
              type="number"
              step="0.1"
              min="0"
              max="24"
              value={remHours}
              onChange={(e) => setRemHours(e.target.value)}
              required
            />
          </div>

          {/* Sommeil profond */}
          <div className="space-y-2">
            <Label htmlFor="deepHours">Sommeil profond - heures</Label>
            <Input
              id="deepHours"
              type="number"
              step="0.1"
              min="0"
              max="24"
              value={deepHours}
              onChange={(e) => setDeepHours(e.target.value)}
              required
            />
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
