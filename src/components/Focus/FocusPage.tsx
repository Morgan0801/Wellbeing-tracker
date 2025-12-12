import { useState } from 'react';
import { motion } from 'framer-motion';
import { Timer, Plus, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PomodoroTimer } from './PomodoroTimer';
import { FocusStatistics } from './FocusStatistics';
import { ManualEntryModal } from './ManualEntryModal';
import { FocusHistory } from './FocusHistory';
import { useFocusEnhanced } from '@/hooks/useFocusEnhanced';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { staggerContainer, staggerItem } from '@/lib/animations';

export function FocusPage() {
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const { todayStats, weekStats, isLoading } = useFocusEnhanced();

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="container mx-auto p-3 md:p-4 lg:p-5 pb-20 md:pb-6 max-w-7xl space-y-4"
    >
      {/* Header */}
      <motion.div
        variants={staggerItem}
        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-soft-xl bg-gradient-to-br from-focus to-focus-light"
      >
        <div className="absolute top-4 right-8 text-white/20">
          <Timer className="w-12 h-12" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-5 h-5 text-white/80" />
            <span className="text-sm font-medium text-white/80">Mode Focus</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold mb-1">
                Timer Pomodoro
              </h2>
              <p className="text-sm text-white/80">
                {format(new Date(), 'EEEE d MMMM', { locale: fr })}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManualEntry(true)}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter manuellement
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {showStats ? 'Masquer' : 'Afficher'} stats
                {showStats ? (
                  <ChevronUp className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Timer (avec tag selector intégré) */}
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <PomodoroTimer
            onSessionComplete={() => {
              // Session complétée avec succès
            }}
          />
        </motion.div>

        {/* Right Column: Today's Stats */}
        <motion.div variants={staggerItem} className="space-y-4">
          {/* Stats Cards */}
          <Card variant="elevated">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
                Aujourd'hui
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sessions</span>
                  <span className="text-2xl font-display font-bold text-focus">
                    {isLoading ? '...' : todayStats.totalSessions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Minutes</span>
                  <span className="text-2xl font-display font-bold text-vitality">
                    {isLoading ? '...' : todayStats.totalMinutes}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Week Stats */}
          <Card variant="elevated">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
                Cette semaine
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sessions</span>
                  <span className="text-2xl font-display font-bold text-sleep">
                    {isLoading ? '...' : weekStats.totalSessions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Heures</span>
                  <span className="text-2xl font-display font-bold text-gratitude">
                    {isLoading
                      ? '...'
                      : `${Math.round(weekStats.totalMinutes / 60)}h`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tip Card */}
          <Card variant="glass" className="border-productivity/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-productivity/10 shrink-0">
                  <Timer className="w-5 h-5 text-productivity" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Astuce Pomodoro
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Après 4 sessions, prends une pause de 20 min. Ton cerveau
                    assimile l'information pendant le repos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Statistics Section (Collapsible) */}
      {showStats && (
        <motion.div
          variants={staggerItem}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FocusStatistics />
        </motion.div>
      )}

      {/* History Section */}
      <motion.div variants={staggerItem}>
        <FocusHistory limit={10} />
      </motion.div>

      {/* Manual Entry Modal */}
      <ManualEntryModal
        open={showManualEntry}
        onClose={() => setShowManualEntry(false)}
      />
    </motion.div>
  );
}
