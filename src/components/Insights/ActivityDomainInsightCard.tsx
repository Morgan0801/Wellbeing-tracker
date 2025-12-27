// src/components/Insights/ActivityDomainInsightCard.tsx
// Composant pour afficher une corrélation croisée activité x domaine

import { CombinedCorrelation } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  data: CombinedCorrelation;
  compact?: boolean;
}

export function ActivityDomainInsightCard({ data, compact = false }: Props) {
  const totalPoints = data.overallStats.totalDataPoints;

  const getConfidenceLabel = () => {
    switch (data.confidence) {
      case 'high':
        return 'Fiable';
      case 'medium':
        return 'Modéré';
      case 'low':
        return 'Préliminaire';
    }
  };

  const getConfidenceColor = () => {
    switch (data.confidence) {
      case 'high':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getBorderColor = () => {
    switch (data.insightType) {
      case 'positive':
        return 'border-green-200 dark:border-green-800';
      case 'warning':
        return 'border-amber-200 dark:border-amber-800';
      case 'informational':
        return 'border-blue-200 dark:border-blue-800';
    }
  };

  const getBackgroundColor = () => {
    switch (data.insightType) {
      case 'positive':
        return 'bg-green-50/50 dark:bg-green-900/10';
      case 'warning':
        return 'bg-amber-50/50 dark:bg-amber-900/10';
      case 'informational':
        return 'bg-blue-50/50 dark:bg-blue-900/10';
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          'p-3 rounded-lg border transition-colors',
          getBorderColor(),
          getBackgroundColor()
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{data.activityEmoji}</span>
            <span className="text-xs text-muted-foreground">x</span>
            <span className="text-lg">{data.domainEmoji}</span>
          </div>
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', getConfidenceColor())}>
            {totalPoints} pts
          </span>
        </div>
        <p className="text-xs font-medium leading-snug">{data.primaryInsight}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-colors',
        getBorderColor(),
        getBackgroundColor()
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{data.activityEmoji}</span>
          <span className="text-lg text-muted-foreground">×</span>
          <span className="text-2xl">{data.domainEmoji}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn('text-xs px-2 py-0.5 rounded-full', getConfidenceColor())}>
            {getConfidenceLabel()}
          </span>
          <span className="text-[10px] text-muted-foreground">{totalPoints} données</span>
        </div>
      </div>

      {/* Insight principal */}
      <p className="text-sm font-medium mb-1">{data.primaryInsight}</p>

      {/* Insight secondaire */}
      {data.secondaryInsight && (
        <p className="text-xs text-muted-foreground mb-3">{data.secondaryInsight}</p>
      )}

      {/* Breakdown des 4 scénarios */}
      <div className="grid grid-cols-4 gap-1.5 mt-3">
        <ScenarioBox
          label="Fait + Positif"
          shortLabel="A"
          count={data.scenarios.A.count}
          color="green"
        />
        <ScenarioBox
          label="Pas fait + Négatif"
          shortLabel="B"
          count={data.scenarios.B.count}
          color="red"
        />
        <ScenarioBox
          label="Fait + Négatif"
          shortLabel="C"
          count={data.scenarios.C.count}
          color="orange"
        />
        <ScenarioBox
          label="Pas fait + Positif"
          shortLabel="D"
          count={data.scenarios.D.count}
          color="blue"
        />
      </div>

      {/* Légende des scénarios */}
      <div className="mt-2 text-[9px] text-muted-foreground text-center">
        A: "{data.activityName} m'aide" | B: "Manque de {data.activityName}" | C: "Mal passé" | D: "Bien sans"
      </div>
    </div>
  );
}

interface ScenarioBoxProps {
  label: string;
  shortLabel: string;
  count: number;
  color: 'green' | 'red' | 'orange' | 'blue';
}

function ScenarioBox({ shortLabel, count, color }: ScenarioBoxProps) {
  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  };

  return (
    <div className={cn('rounded-md px-1.5 py-1 text-center', colorClasses[color])}>
      <div className="text-sm font-bold">{count}</div>
      <div className="text-[9px] opacity-70">{shortLabel}</div>
    </div>
  );
}

export default ActivityDomainInsightCard;
