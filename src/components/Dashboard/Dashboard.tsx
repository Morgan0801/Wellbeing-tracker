import { PerformanceHeader } from '@/components/Dashboard/PerformanceHeader';
import { DashboardSummaryCards } from '@/components/Dashboard/DashboardSummaryCards';
import { TodayHabits } from '@/components/Dashboard/TodayHabits';
import { XPChart } from '@/components/Dashboard/XPChart';
import { SleepChart } from '@/components/Dashboard/SleepChart';
import { ActiveGoals } from '@/components/Dashboard/ActiveGoals';
import { HabitStatsCalendar } from '@/components/Habits/HabitStatsCalendar';

export function Dashboard() {
  return (
    <div className="container mx-auto p-3 md:p-4 pb-20 md:pb-4 space-y-4 md:space-y-6">
      {/* Performance Header - Tâches et Habitudes du jour */}
      <PerformanceHeader />

      {/* Summary Cards - Vue d'ensemble rapide */}
      <DashboardSummaryCards />

      {/* Grid avec Objectifs et Habitudes du jour - PRIORITÉ HAUTE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActiveGoals />
        <TodayHabits />
      </div>

      {/* Statistiques Habitudes et Charts côte à côte */}
      <div className="grid grid-cols-1 lg:grid-cols-[30%_1fr] gap-4">
        <HabitStatsCalendar />
        <div className="space-y-4">
          <SleepChart />
          <XPChart />
        </div>
      </div>
    </div>
  );
}
