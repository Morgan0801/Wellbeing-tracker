import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFocusEnhanced } from '@/hooks/useFocusEnhanced';
import { StatsPeriod } from '@/types';
import { cn } from '@/lib/utils';
import { Clock, Target, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { staggerItem } from '@/lib/animations';

interface FocusStatisticsProps {
  period?: StatsPeriod;
  onPeriodChange?: (period: StatsPeriod) => void;
}

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  today: "Aujourd'hui",
  '7days': '7 jours',
  '30days': '30 jours',
  '90days': '90 jours',
};

export function FocusStatistics({ period: externalPeriod, onPeriodChange }: FocusStatisticsProps) {
  const [internalPeriod, setInternalPeriod] = useState<StatsPeriod>('7days');
  const period = externalPeriod ?? internalPeriod;

  const { getStats } = useFocusEnhanced();
  const stats = getStats(period);

  const handlePeriodChange = (newPeriod: StatsPeriod) => {
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    } else {
      setInternalPeriod(newPeriod);
    }
  };

  // Formater le temps total en heures et minutes
  const formatTotalTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Couleurs pour le pie chart (reprendre les couleurs des tags si disponibles)
  const CHART_COLORS = [
    'hsl(var(--focus))',
    'hsl(var(--vitality))',
    'hsl(var(--productivity))',
    'hsl(var(--sleep))',
    'hsl(var(--gratitude))',
    '#42A5F5',
    '#5C6BC0',
    '#66BB6A',
    '#FFA726',
    '#AB47BC',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Statistiques Focus</CardTitle>

        {/* Period Tabs */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {(Object.keys(PERIOD_LABELS) as StatsPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                period === p
                  ? "bg-focus/20 text-focus border-2 border-focus/30"
                  : "bg-muted/10 text-muted-foreground hover:bg-muted/20 border-2 border-transparent"
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            variants={staggerItem}
            className="bg-gradient-to-br from-focus/10 to-focus/5 rounded-xl p-4 border border-focus/20"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-focus/20">
                <Clock className="w-5 h-5 text-focus" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-focus">
                  {formatTotalTime(stats.totalMinutes)}
                </div>
                <p className="text-xs text-muted-foreground uppercase font-medium">
                  Temps total
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="bg-gradient-to-br from-vitality/10 to-vitality/5 rounded-xl p-4 border border-vitality/20"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-vitality/20">
                <Target className="w-5 h-5 text-vitality" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-vitality">
                  {stats.totalSessions}
                </div>
                <p className="text-xs text-muted-foreground uppercase font-medium">
                  Sessions
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="bg-gradient-to-br from-productivity/10 to-productivity/5 rounded-xl p-4 border border-productivity/20"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-productivity/20">
                <TrendingUp className="w-5 h-5 text-productivity" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-productivity">
                  {Math.round(stats.avgPerDay)}m
                </div>
                <p className="text-xs text-muted-foreground uppercase font-medium">
                  Moyenne/jour
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Grid */}
        {stats.totalSessions > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart: Time by Category */}
            <div>
              <h4 className="text-sm font-medium mb-4">Temps par catégorie</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [
                      `${value} min (${formatTotalTime(value)})`,
                      'Temps',
                    ]}
                  />
                  <Bar dataKey="minutes" fill="hsl(var(--focus))" radius={[8, 8, 0, 0]}>
                    {stats.byCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart: Session Distribution */}
            <div>
              <h4 className="text-sm font-medium mb-4">Distribution des sessions</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.byCategory as any}
                    dataKey="sessions"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) =>
                      `${entry.category} (${entry.percentage.toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {stats.byCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value} sessions (${props.payload.percentage.toFixed(1)}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune session pour cette période</p>
            <p className="text-xs mt-1">Commencez un Pomodoro pour voir vos statistiques</p>
          </div>
        )}

        {/* Category Breakdown Table */}
        {stats.byCategory.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Détail par catégorie</h4>
            <div className="space-y-2">
              {stats.byCategory.map((cat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.emoji || '📌'}</span>
                    <div>
                      <div className="font-medium text-sm">{cat.category}</div>
                      <div className="text-xs text-muted-foreground">
                        {cat.sessions} session{cat.sessions > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm" style={{ color: cat.color }}>
                      {formatTotalTime(cat.minutes)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cat.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
