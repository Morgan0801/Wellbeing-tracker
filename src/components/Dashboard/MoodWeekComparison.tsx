import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMood } from '@/hooks/useMood';
import { useSleep } from '@/hooks/useSleep';
import { cn } from '@/lib/utils';
import { startOfWeek, subDays, parseISO, isWithinInterval, startOfDay } from 'date-fns';

interface WeekStats {
  mood: number | null;
  energy: number | null;
  sleep: number | null;
  moodCount: number;
}

function computeAvg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function formatValue(val: number | null, decimals = 1): string {
  if (val === null) return '—';
  return val.toFixed(decimals);
}

interface DeltaDisplayProps {
  current: number | null;
  previous: number | null;
}

function DeltaDisplay({ current, previous }: DeltaDisplayProps) {
  if (current === null || previous === null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const delta = current - previous;
  const absD = Math.abs(delta);

  if (absD < 0.1) {
    return <span className="text-xs text-muted-foreground font-medium">~</span>;
  }

  const isPositive = delta > 0;
  const sign = isPositive ? '+' : '';
  const formatted = `${sign}${delta.toFixed(1)}`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold',
        isPositive ? 'text-green-500' : 'text-red-500'
      )}
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {formatted}
    </span>
  );
}

interface MetricColProps {
  label: string;
  emoji: string;
  current: number | null;
  previous: number | null;
  count: number;
  unit?: string;
  decimals?: number;
}

function MetricCol({ label, emoji, current, previous, count, unit = '', decimals = 1 }: MetricColProps) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
        <span>{emoji}</span>
        <span className="truncate">{label}</span>
      </div>

      <div className="text-lg font-bold text-foreground leading-none">
        {current !== null ? (
          <>
            {formatValue(current, decimals)}
            {unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>}
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>

      <DeltaDisplay current={current} previous={previous} />

      <div className="text-xs text-muted-foreground">
        {previous !== null ? (
          <span>
            vs {formatValue(previous, decimals)}
            {unit && <span className="ml-0.5">{unit}</span>}
          </span>
        ) : (
          <span>sem. préc.</span>
        )}
      </div>

      {count > 0 && (
        <div className="text-xs text-muted-foreground/60">
          {count} entrée{count > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export function MoodWeekComparison() {
  const { moods } = useMood();
  const { sleepLogs } = useSleep();

  const { thisWeek, lastWeek } = useMemo(() => {
    const today = startOfDay(new Date());

    // Lundi de la semaine courante
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });

    // Semaine précédente : 7 jours avant thisWeekStart
    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekStart, 1);

    // Intervalles
    const thisWeekInterval = { start: thisWeekStart, end: today };
    const lastWeekInterval = { start: lastWeekStart, end: lastWeekEnd };

    function getMoodStats(interval: { start: Date; end: Date }): WeekStats {
      const filtered = moods.filter((m) => {
        try {
          const d = startOfDay(parseISO(m.datetime));
          return isWithinInterval(d, interval);
        } catch {
          return false;
        }
      });

      const scores = filtered.map((m) => m.score_global).filter((s) => typeof s === 'number');
      const energies = filtered
        .map((m) => m.energy_level)
        .filter((e): e is number => typeof e === 'number' && e !== null);

      const sleepFiltered = sleepLogs.filter((s) => {
        try {
          const d = startOfDay(parseISO(s.date));
          return isWithinInterval(d, interval);
        } catch {
          return false;
        }
      });

      const sleepHours = sleepFiltered
        .map((s) => s.total_hours)
        .filter((h) => typeof h === 'number');

      return {
        mood: computeAvg(scores),
        energy: computeAvg(energies),
        sleep: computeAvg(sleepHours),
        moodCount: filtered.length,
      };
    }

    return {
      thisWeek: getMoodStats(thisWeekInterval),
      lastWeek: getMoodStats(lastWeekInterval),
    };
  }, [moods, sleepLogs]);

  // Si aucune donnée du tout → ne pas afficher le widget
  const hasAnyData =
    thisWeek.mood !== null ||
    thisWeek.energy !== null ||
    thisWeek.sleep !== null ||
    lastWeek.mood !== null ||
    lastWeek.energy !== null ||
    lastWeek.sleep !== null;

  if (!hasAnyData) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <span>📊</span>
          <span>Cette semaine vs la précédente</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="flex gap-2 divide-x divide-border">
          <MetricCol
            label="Humeur"
            emoji="😊"
            current={thisWeek.mood}
            previous={lastWeek.mood}
            count={thisWeek.moodCount}
            decimals={1}
          />
          <div className="flex-1 pl-2">
            <MetricCol
              label="Énergie"
              emoji="⚡"
              current={thisWeek.energy}
              previous={lastWeek.energy}
              count={0}
              decimals={1}
            />
          </div>
          <div className="flex-1 pl-2">
            <MetricCol
              label="Sommeil"
              emoji="😴"
              current={thisWeek.sleep}
              previous={lastWeek.sleep}
              count={0}
              unit="h"
              decimals={1}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
