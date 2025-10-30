import { PerformanceHeader } from '@/components/Dashboard/PerformanceHeader';
import { DashboardSummaryCards } from '@/components/Dashboard/DashboardSummaryCards';
import { TodayHabits } from '@/components/Dashboard/TodayHabits';
import { XPChart } from '@/components/Dashboard/XPChart';
import { ActiveGoals } from '@/components/Dashboard/ActiveGoals';
import { HabitStatsCalendar } from '@/components/Habits/HabitStatsCalendar';

export function Dashboard() {
  return (
    <div className="container mx-auto p-3 md:p-4 pb-20 md:pb-4 space-y-4 md:space-y-6">
      {/* Performance Header - XP, Level, Streak */}
      <PerformanceHeader />

      {/* Summary Cards - Vue d'ensemble rapide */}
      <DashboardSummaryCards />

      {/* XP Chart - Progression sur 30 jours */}
      <XPChart />

      {/* Grid avec Objectifs et Habitudes du jour */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActiveGoals />
        <TodayHabits />
      </div>

      {/* Calendrier des statistiques d'habitudes */}
      <HabitStatsCalendar />
    </div>
  );
}
