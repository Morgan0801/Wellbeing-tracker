import { SleepLog } from '@/types';
import { useSleep } from '@/hooks/useSleep';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Heart, Clock, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getMoodEmoji, getMoodColor } from '@/lib/utils';

interface SleepCardProps {
  sleep: SleepLog;
  onEdit: (sleep: SleepLog) => void;
}

export function SleepCard({ sleep, onEdit }: SleepCardProps) {
  const { deleteSleepLog } = useSleep();

  const handleDelete = () => {
    if (confirm('Supprimer ce log de sommeil ?')) {
      deleteSleepLog(sleep.id);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Info principale */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{getMoodEmoji(sleep.quality_score)}</span>
            <div>
              <h3 className="font-semibold">
                {format(new Date(sleep.date), 'EEEE d MMMM yyyy', { locale: fr })}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-3 h-3" />
                {sleep.bedtime} → {sleep.wakeup_time}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-gray-500 text-xs">Total</div>
              <div className="font-semibold">{sleep.total_hours}h</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">REM</div>
              <div className="font-semibold text-purple-600">{sleep.rem_hours}h</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Profond</div>
              <div className="font-semibold text-blue-600">{sleep.deep_hours}h</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs flex items-center gap-1">
                <Heart className="w-3 h-3" />
                BPM
              </div>
              <div className="font-semibold text-red-600">{sleep.avg_heart_rate}</div>
            </div>
          </div>

          {/* Score de qualité */}
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Qualité</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(sleep.quality_score / 10) * 100}%`,
                      backgroundColor: getMoodColor(sleep.quality_score),
                    }}
                  />
                </div>
                <span
                  className="font-semibold text-sm"
                  style={{ color: getMoodColor(sleep.quality_score) }}
                >
                  {sleep.quality_score}/10
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex flex-col gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(sleep)}
            className="h-8 w-8"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
