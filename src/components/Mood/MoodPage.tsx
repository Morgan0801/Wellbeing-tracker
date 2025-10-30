import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MoodModal } from './MoodModal';
import { MoodHistory } from './MoodHistory';
import { MoodChart } from './MoodChart';
import { MoodInsights } from './MoodInsights';
import { MoodHeatmap } from './MoodHeatmap';
import { useMood } from '@/hooks/useMood';
import { getMoodEmoji } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function MoodPage() {
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const { moods } = useMood();

  // Mood d'aujourd'hui
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayMoods = moods.filter(mood =>
    format(new Date(mood.datetime), 'yyyy-MM-dd') === today
  );
  const todayAvgMood = todayMoods.length > 0
    ? Math.round((todayMoods.reduce((sum, m) => sum + m.score_global, 0) / todayMoods.length) * 10) / 10
    : null;

  return (
    <div className="container mx-auto p-3 md:p-4 pb-20 md:pb-4 space-y-4 md:space-y-6">
      {/* Header Émotionnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 rounded-xl p-4 md:p-8 text-white"
      >
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-3xl font-bold mb-1 md:mb-2"
        >
          Mon humeur 💭
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs md:text-base text-pink-100 mb-4 md:mb-6"
        >
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </motion.p>

        {/* Stats du jour */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-4 md:mb-6">
          {todayAvgMood !== null ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex-1 w-full md:w-auto"
            >
              <p className="text-xs md:text-sm text-pink-100 mb-2">Humeur d'aujourd'hui</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl md:text-5xl">{getMoodEmoji(todayAvgMood)}</span>
                <span className="text-3xl md:text-4xl font-bold">{todayAvgMood}/10</span>
              </div>
              <p className="text-xs text-pink-100 mt-2">{todayMoods.length} entrée{todayMoods.length > 1 ? 's' : ''}</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex-1 w-full md:w-auto"
            >
              <p className="text-sm text-pink-100 mb-2">Comment te sens-tu aujourd'hui ?</p>
              <p className="text-xs text-pink-200">Aucune humeur enregistrée</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setIsMoodModalOpen(true)}
              size="lg"
              className="bg-white text-pink-600 hover:bg-pink-50 h-auto py-3 md:py-4 px-4 md:px-6"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Logger mon humeur
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Graphique évolution et Heatmap côte à côte sur desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4">
        <MoodHeatmap />
        <MoodChart />
      </div>

      {/* Insights émotionnels */}
      <MoodInsights />

      {/* Historique des humeurs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Heart className="w-4 h-4 md:w-5 md:h-5 text-pink-500" />
            Journal émotionnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MoodHistory />
        </CardContent>
      </Card>

      {/* Modal */}
      <MoodModal
        open={isMoodModalOpen}
        onOpenChange={setIsMoodModalOpen}
        weather={null}
      />
    </div>
  );
}
