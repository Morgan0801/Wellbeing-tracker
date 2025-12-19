import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MoodModal } from './MoodModal';
import { MoodHistory } from './MoodHistory';
import { MoodChart } from './MoodChart';
import { MoodInsights } from './MoodInsights';
import { MoodHeatmap } from './MoodHeatmap';
import { ActivityInsights } from './ActivityInsights';
import { EnergyInsights } from './EnergyInsights';
import { AdvancedMoodInsights } from './AdvancedMoodInsights';
import { useMood } from '@/hooks/useMood';
import { getMoodEmoji } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { staggerContainer, staggerItem, scaleIn } from '@/lib/animations';
import { fetchWeather } from '@/services/weather';
import type { WeatherData } from '@/types';

export function MoodPage() {
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const { moods } = useMood();

  // Récupérer la météo au chargement
  useEffect(() => {
    fetchWeather().then(data => setWeather(data));
  }, []);

  // Mood d'aujourd'hui
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayMoods = moods.filter(mood =>
    format(new Date(mood.datetime), 'yyyy-MM-dd') === today
  );
  const todayAvgMood = todayMoods.length > 0
    ? Math.round((todayMoods.reduce((sum, m) => sum + m.score_global, 0) / todayMoods.length) * 10) / 10
    : null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="container mx-auto p-3 md:p-4 lg:p-5 pb-20 md:pb-6 space-y-3"
    >
      {/* Header Émotionnel avec gradient rose/blush */}
      <motion.div
        variants={staggerItem}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-mood via-blush-400 to-mood-light p-3 md:p-4 text-white shadow-soft-xl"
      >
        {/* Cercles décoratifs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-white/80" />
            <span className="text-sm font-medium text-white/80">Suivi émotionnel</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-display font-bold mb-1">
            Comment te sens-tu ?
          </h2>
          <p className="text-sm md:text-base text-white/80 mb-6">
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>

          {/* Stats du jour */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
            {todayAvgMood !== null ? (
              <motion.div
                variants={scaleIn}
                className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex-1 w-full md:w-auto border border-white/10"
              >
                <p className="text-xs md:text-sm text-white/80 mb-2">Humeur d'aujourd'hui</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl md:text-5xl">{getMoodEmoji(todayAvgMood)}</span>
                  <div>
                    <span className="text-3xl md:text-4xl font-display font-bold">{todayAvgMood}/10</span>
                    <p className="text-xs text-white/70 mt-1">{todayMoods.length} entrée{todayMoods.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={scaleIn}
                className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex-1 w-full md:w-auto border border-white/10"
              >
                <p className="text-sm text-white/80 mb-2">Comment te sens-tu aujourd'hui ?</p>
                <p className="text-xs text-white/60">Aucune humeur enregistrée</p>
              </motion.div>
            )}

            <motion.div variants={scaleIn}>
              <Button
                onClick={() => setIsMoodModalOpen(true)}
                size="lg"
                className="bg-white text-mood hover:bg-white/90 shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-0.5 transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Logger mon humeur
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Graphique évolution et Heatmap côte à côte sur desktop */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 lg:gap-6">
        <MoodHeatmap />
        <MoodChart />
      </motion.div>

      {/* Insights émotionnels */}
      <motion.div variants={staggerItem}>
        <MoodInsights />
      </motion.div>

      {/* Corrélations Activités-Humeur */}
      <motion.div variants={staggerItem}>
        <ActivityInsights />
      </motion.div>

      {/* Analyse d'Énergie */}
      <motion.div variants={staggerItem}>
        <EnergyInsights />
      </motion.div>

      {/* Insights Avancés (Patterns temporels, social, combinaisons) */}
      <motion.div variants={staggerItem}>
        <AdvancedMoodInsights />
      </motion.div>

      {/* Historique des humeurs */}
      <motion.div variants={staggerItem}>
        <Card variant="elevated" className="border-mood/10">
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <div className="p-2 rounded-lg bg-mood/10">
                <Heart className="w-4 h-4 md:w-5 md:h-5 text-mood" />
              </div>
              Journal émotionnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MoodHistory />
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal */}
      <MoodModal
        open={isMoodModalOpen}
        onOpenChange={setIsMoodModalOpen}
        weather={weather}
      />
    </motion.div>
  );
}
