import { motion } from 'framer-motion';
import { PerformanceHeader } from './PerformanceHeader';
import { DashboardSummaryCards } from './DashboardSummaryCards';
import { AIDailyInsightCard } from './AIDailyInsightCard';
import { AIWeeklyInsightsCard } from './AIWeeklyInsightsCard';
import { AITokenStatsCard } from './AITokenStatsCard';
import { TodayHabits } from './TodayHabits';
import { XPChart } from './XPChart';
import { SleepChart } from './SleepChart';
import { ActiveGoals } from './ActiveGoals';
import { HabitStatsCalendar } from '@/components/Habits/HabitStatsCalendar';
import { CrossInsights } from './CrossInsights';
import { QuickMoodLog } from './QuickMoodLog';
import { MoodWeekComparison } from './MoodWeekComparison';
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

      {/* Quick Mood Log */}
      <motion.div variants={staggerItem}>
        <QuickMoodLog />
      </motion.div>

      {/* Comparaison semaine N vs N-1 */}
      <motion.div variants={staggerItem}>
        <MoodWeekComparison />
      </motion.div>

      {/* Insight quotidien IA */}
      <motion.div variants={staggerItem}>
        <AIDailyInsightCard />
      </motion.div>

      {/* Insights hebdomadaires IA - Corrélations */}
      <motion.div variants={staggerItem}>
        <AIWeeklyInsightsCard />
      </motion.div>

      {/* Stats d'utilisation des tokens IA */}
      <motion.div variants={staggerItem}>
        <AITokenStatsCard />
      </motion.div>

      {/* Summary Cards - Style Bento */}
      <motion.div variants={staggerItem}>
        <DashboardSummaryCards />
      </motion.div>

      {/* Insights Croisés */}
      <motion.div variants={staggerItem}>
        <CrossInsights />
      </motion.div>

      {/* Grid principal - Bento Layout amélioré */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Objectifs actifs - Large card */}
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <ActiveGoals />
        </motion.div>

        {/* Habitudes du jour - Small card qui s'étend sur 3 lignes */}
        <motion.div variants={staggerItem} className="lg:row-span-3">
          <TodayHabits />
        </motion.div>

        {/* Sommeil chart - Plus large pour meilleure lisibilité */}
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <SleepChart />
        </motion.div>

        {/* XP Chart - Même taille que Sleep Chart */}
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <XPChart />
        </motion.div>

        {/* Calendrier stats habitudes - Petite card */}
        <motion.div variants={staggerItem}>
          <HabitStatsCalendar />
        </motion.div>
      </div>
    </motion.div>
  );
}
