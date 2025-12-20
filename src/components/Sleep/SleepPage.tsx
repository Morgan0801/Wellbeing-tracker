import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Plus, Star, CloudMoon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SleepModal } from './SleepModal';
import { SleepCard } from './SleepCard';
import { SleepCalendar } from './SleepCalendar';
import { SleepStatsChart } from './SleepStatsChart';
import { SleepScheduleChart } from './SleepScheduleChart';
import { SleepInsights } from './SleepInsights';
import { AISleepTipsCard } from './AISleepTipsCard';
import { useSleep } from '@/hooks/useSleep';
import { SleepLog } from '@/types';
import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem, scaleIn } from '@/lib/animations';

const PERIOD_OPTIONS = [
  { label: '1 jour', days: 1 },
  { label: '7 jours', days: 7 },
  { label: '30 jours', days: 30 },
  { label: '90 jours', days: 90 },
  { label: '1 an', days: 365 },
];

export function SleepPage() {
  const { sleepLogs, loading } = useSleep();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSleep, setEditingSleep] = useState<SleepLog | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  const handleEdit = (sleep: SleepLog) => {
    setEditingSleep(sleep);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-2 border-sleep border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="container mx-auto p-3 md:p-4 lg:p-5 pb-20 md:pb-6 space-y-3"
    >
      {/* Header avec thème nocturne */}
      <motion.div
        variants={staggerItem}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sleep via-lavender-600 to-sleep-light p-3 md:p-4 text-white shadow-soft-xl"
      >
        {/* Étoiles décoratives */}
        <div className="absolute top-4 right-8 text-white/30">
          <Star className="w-4 h-4 fill-current animate-pulse" />
        </div>
        <div className="absolute top-8 right-16 text-white/20">
          <Star className="w-3 h-3 fill-current animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute top-12 right-24 text-white/25">
          <Star className="w-2 h-2 fill-current animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute bottom-6 right-1/4 text-white/15">
          <CloudMoon className="w-12 h-12" />
        </div>

        {/* Lune décorative */}
        <motion.div
          variants={scaleIn}
          className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-sm"
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="w-5 h-5 text-white/80" />
            <span className="text-sm font-medium text-white/80">Suivi du sommeil</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-1">
                Sommeil
              </h1>
              <p className="text-sm text-white/80">
                {sleepLogs.length} nuit{sleepLogs.length > 1 ? 's' : ''} enregistrée{sleepLogs.length > 1 ? 's' : ''}
              </p>
            </div>

            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-sleep hover:bg-white/90 shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle nuit
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filtres de période */}
      <motion.div variants={staggerItem}>
        <Card variant="glass" className="border-sleep/10">
          <CardContent className="p-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {PERIOD_OPTIONS.map((option) => (
                <Button
                  key={option.days}
                  variant={selectedPeriod === option.days ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedPeriod(option.days)}
                  className={cn(
                    "whitespace-nowrap transition-all",
                    selectedPeriod === option.days && "bg-sleep text-white hover:bg-sleep/90"
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Layout : Graphiques + Calendrier */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Statistiques (2/3 de la largeur) */}
        <div className="lg:col-span-2 space-y-6">
          <SleepStatsChart sleepLogs={sleepLogs} periodDays={selectedPeriod} />
        </div>

        {/* Colonne droite : Calendrier (1/3 de la largeur) */}
        <div className="lg:col-span-1">
          <SleepCalendar sleepLogs={sleepLogs} />
        </div>
      </motion.div>

      {/* Graphique des horaires en pleine largeur */}
      <motion.div variants={staggerItem} className="w-full">
        <SleepScheduleChart sleepLogs={sleepLogs} />
      </motion.div>

      {/* Insights Sommeil */}
      <motion.div variants={staggerItem}>
        <SleepInsights />
      </motion.div>

      {/* AI Sleep Tips */}
      <motion.div variants={staggerItem}>
        <AISleepTipsCard recentSleepLogs={sleepLogs} />
      </motion.div>

      {/* Liste des logs récents */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-sleep/10">
            <Moon className="w-5 h-5 text-sleep" />
          </div>
          <h2 className="text-lg font-display font-bold">Nuits récentes</h2>
        </div>

        {sleepLogs.length === 0 ? (
          <Card variant="elevated" className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-sleep/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-sleep" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Aucune nuit enregistrée</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Commence par ajouter ta première nuit pour suivre la qualité de ton sommeil !
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="glow"
                size="lg"
                className="bg-gradient-to-r from-sleep to-lavender-500"
              >
                Ajouter ma première nuit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sleepLogs.slice(0, 7).map((sleep, index) => (
              <motion.div
                key={sleep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SleepCard sleep={sleep} onEdit={handleEdit} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <SleepModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingSleep(null);
        }}
        editSleep={editingSleep ?? undefined}
      />
    </motion.div>
  );
}
