import { motion } from 'framer-motion';
import { PerformanceHeader } from './PerformanceHeader';
import { DashboardSummaryCards } from './DashboardSummaryCards';
import { TodayHabits } from './TodayHabits';
import { XPChart } from './XPChart';
import { SleepChart } from './SleepChart';
import { ActiveGoals } from './ActiveGoals';
import { HabitStatsCalendar } from '@/components/Habits/HabitStatsCalendar';
import { CrossInsights } from './CrossInsights';
import { staggerContainer, staggerItem } from '@/lib/animations';

export function Dashboard() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="container mx-auto p-3 md:p-4 lg:p-5 pb-20 md:pb-6 space-y-3"
    >
      {/* Header avec salutation personnalisée */}
      <motion.div variants={staggerItem}>
        <PerformanceHeader />
      </motion.div>

      {/* Summary Cards - Style Bento */}
      <motion.div variants={staggerItem}>
        <DashboardSummaryCards />
      </motion.div>

      {/* Insights Croisés */}
      <motion.div variants={staggerItem}>
        <CrossInsights />
      </motion.div>

      {/* Grid principal - Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Objectifs actifs - Large card */}
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <ActiveGoals />
        </motion.div>

        {/* Habitudes du jour - Tall card */}
        <motion.div variants={staggerItem} className="lg:row-span-2">
          <TodayHabits />
        </motion.div>

        {/* Calendrier stats habitudes */}
        <motion.div variants={staggerItem}>
          <HabitStatsCalendar />
        </motion.div>

        {/* Sommeil chart */}
        <motion.div variants={staggerItem}>
          <SleepChart />
        </motion.div>
      </div>

      {/* XP Chart en pleine largeur */}
      <motion.div variants={staggerItem}>
        <XPChart />
      </motion.div>
    </motion.div>
  );
}
