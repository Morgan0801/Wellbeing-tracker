import { motion } from 'framer-motion';
import { Zap, TrendingUp, Flame } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { formatDate } from '@/lib/utils';

export function PerformanceHeader() {
  const { gamification } = useGamification();

  const currentXP = gamification?.total_xp || 0;
  const currentLevel = gamification?.level || 1;
  const streakDays = gamification?.streak_days || 0;

  // Calcul de l'XP dans le niveau actuel
  const xpInCurrentLevel = currentXP % 100;
  const progressPercent = (xpInCurrentLevel / 100) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-600 rounded-xl p-4 md:p-8 text-white"
    >
      {/* Titre et date */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl md:text-3xl font-bold mb-1 md:mb-2"
      >
        Dashboard 🚀
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xs md:text-base text-blue-100 mb-4 md:mb-6"
      >
        {formatDate(new Date(), 'EEEE d MMMM yyyy')}
      </motion.p>

      {/* Indicateurs de performance */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {/* Level */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4"
        >
          <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
            <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-yellow-300" />
            <span className="text-[10px] md:text-xs text-blue-100">Niveau</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold">{currentLevel}</div>
          {/* Barre de progression */}
          <div className="mt-2 md:mt-3">
            <div className="h-1.5 md:h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500"
              />
            </div>
            <p className="text-[8px] md:text-[10px] text-blue-100 mt-1">
              {xpInCurrentLevel}/{100} XP
            </p>
          </div>
        </motion.div>

        {/* Total XP */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4"
        >
          <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
            <Zap className="w-3 h-3 md:w-4 md:h-4 text-yellow-300" />
            <span className="text-[10px] md:text-xs text-blue-100">XP Total</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold">{currentXP}</div>
          <p className="text-[8px] md:text-[10px] text-blue-100 mt-1 md:mt-2">
            Points d'expérience
          </p>
        </motion.div>

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4"
        >
          <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
            <Flame className="w-3 h-3 md:w-4 md:h-4 text-orange-300" />
            <span className="text-[10px] md:text-xs text-blue-100">Série</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold">{streakDays}</div>
          <p className="text-[8px] md:text-[10px] text-blue-100 mt-1 md:mt-2">
            jour{streakDays > 1 ? 's' : ''} consécutif{streakDays > 1 ? 's' : ''}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
