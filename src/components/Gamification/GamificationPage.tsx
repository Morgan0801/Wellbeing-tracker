import { motion } from 'framer-motion';
import { Trophy, Zap, TrendingUp, Award, Star, Sparkles, Flame } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGamification } from '@/hooks/useGamification';
import { levelProgress, xpForNextLevel, AVAILABLE_BADGES } from '@/types/phase4-types';
import { formatDate, cn } from '@/lib/utils';
import { staggerContainer, staggerItem, scaleIn } from '@/lib/animations';

export function GamificationPage() {
  const { gamification, xpHistory, loading } = useGamification();

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-2 border-productivity border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!gamification) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card variant="elevated">
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Impossible de charger les données de gamification.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = levelProgress(gamification.total_xp, gamification.level);
  const nextLevelXP = xpForNextLevel(gamification.level);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="container mx-auto p-3 md:p-4 lg:p-5 pb-20 md:pb-6 space-y-3"
    >
      {/* Header avec niveau */}
      <motion.div
        variants={staggerItem}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-productivity via-productivity to-productivity-light p-3 md:p-4 text-white shadow-soft-xl"
      >
        {/* Étoiles décoratives */}
        <div className="absolute top-4 right-8 text-white/20">
          <Star className="w-8 h-8 fill-current" />
        </div>
        <div className="absolute top-12 right-20 text-white/10">
          <Star className="w-5 h-5 fill-current" />
        </div>
        <div className="absolute bottom-6 left-1/3 text-white/10">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-white/80" />
            <span className="text-xs font-medium text-white/80">Progression & Récompenses</span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5">
            {/* Badge niveau animé */}
            <motion.div
              variants={scaleIn}
              className="relative"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-3 border-white/30 shadow-glow">
                <div className="text-center">
                  <span className="text-3xl md:text-4xl font-display font-bold">{gamification.level}</span>
                  <p className="text-[10px] text-white/70 mt-0.5">Niveau</p>
                </div>
              </div>
              {/* Cercle animé autour */}
              <div className="absolute inset-0 rounded-full border-3 border-white/20 animate-pulse" />
            </motion.div>

            {/* Progression */}
            <div className="flex-1 w-full max-w-md">
              <h2 className="text-xl md:text-2xl font-display font-bold mb-1">
                {gamification.total_xp} XP
              </h2>
              <p className="text-xs text-white/80 mb-2">
                Progression vers niveau {gamification.level + 1}
              </p>

              <div className="bg-white/20 rounded-full p-0.5">
                <Progress value={progress} variant="default" size="default" className="bg-white/30" />
              </div>
              <p className="text-[10px] text-white/70 text-center mt-1">
                {nextLevelXP - gamification.total_xp} XP restant • {progress}%
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistiques */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hover className="bg-gradient-to-br from-sleep-light to-sleep-light/30 dark:from-sleep/15 dark:to-sleep/5 border-0">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-sleep/10">
                <Zap className="w-6 h-6 text-sleep" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">XP Total</p>
                <p className="text-3xl font-display font-bold text-sleep">{gamification.total_xp}</p>
                <p className="text-xs text-muted-foreground mt-1">Points d'expérience</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover className="bg-gradient-to-br from-gratitude-light to-gratitude-light/30 dark:from-gratitude/15 dark:to-gratitude/5 border-0">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gratitude/10">
                <Award className="w-6 h-6 text-gratitude" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Badges</p>
                <p className="text-3xl font-display font-bold text-gratitude">{gamification.badges.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Badges débloqués</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover className="bg-gradient-to-br from-focus-light to-focus-light/30 dark:from-focus/15 dark:to-focus/5 border-0">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-focus/10">
                <Flame className="w-6 h-6 text-focus" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Série</p>
                <p className="text-3xl font-display font-bold text-focus">{gamification.streak_days}</p>
                <p className="text-xs text-muted-foreground mt-1">Jours consécutifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Badges débloqués */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gratitude/10">
            <Award className="w-5 h-5 text-gratitude" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">Mes Badges</h2>
            <p className="text-xs text-muted-foreground">{gamification.badges.length}/{AVAILABLE_BADGES.length} débloqués</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {AVAILABLE_BADGES.map((badge, index) => {
            const earned = gamification.badges.find((b: any) => b.id === badge.id);

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    "h-full transition-all duration-300",
                    earned
                      ? "border-productivity/30 bg-gradient-to-br from-productivity-light to-productivity-light/30 dark:from-productivity/15 dark:to-productivity/5 shadow-soft-md"
                      : "opacity-60 grayscale border-border/50"
                  )}
                >
                  <CardContent className="p-4 text-center">
                    <div className={cn(
                      "text-4xl mb-3 transition-transform duration-300",
                      earned && "animate-float"
                    )}>
                      {badge.emoji}
                    </div>
                    <div className="font-display font-semibold text-sm mb-1">{badge.name}</div>
                    <div className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {badge.description}
                    </div>
                    {earned ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-vitality/10 text-vitality text-[10px] font-medium">
                        <span>Débloqué le {formatDate(new Date(earned.earned_at), 'd MMM yyyy')}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-[10px]">
                        <span>À débloquer</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Historique récent */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-vitality/10">
            <TrendingUp className="w-5 h-5 text-vitality" />
          </div>
          <h2 className="text-lg font-display font-bold">Historique XP</h2>
        </div>

        {xpHistory.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                Aucune activité récente. Continuez à utiliser l'app pour gagner de l'XP !
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card variant="elevated" padding="none">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {xpHistory.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {entry.action_type === 'mood_log' && '💭'}
                        {entry.action_type === 'habit_complete' && '✅'}
                        {entry.action_type === 'task_complete' && '📝'}
                        {entry.action_type === 'goal_complete' && '🎯'}
                        {entry.action_type === 'gratitude_log' && '🙏'}
                        {entry.action_type === 'streak_bonus' && '🔥'}
                        {entry.action_type === 'milestone_complete' && '⭐'}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {entry.action_type === 'mood_log' && 'Mood enregistré'}
                          {entry.action_type === 'habit_complete' && 'Habitude complétée'}
                          {entry.action_type === 'task_complete' && 'Tâche terminée'}
                          {entry.action_type === 'goal_complete' && 'Objectif atteint'}
                          {entry.action_type === 'gratitude_log' && 'Gratitude ajoutée'}
                          {entry.action_type === 'streak_bonus' && 'Bonus série'}
                          {entry.action_type === 'milestone_complete' && 'Jalon atteint'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(new Date(entry.created_at), 'd MMM yyyy à HH:mm')}
                        </div>
                        {entry.description && (
                          <div className="text-xs text-muted-foreground/80 mt-0.5">
                            {entry.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-lg font-display font-bold text-vitality">
                      +{entry.xp_gained} XP
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Guide XP */}
      <motion.div variants={staggerItem}>
        <Card variant="glass" className="border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Comment gagner de l'XP ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { xp: 10, action: 'Enregistrer un mood', icon: '💭' },
                { xp: 15, action: 'Compléter une habitude', icon: '✅' },
                { xp: 20, action: 'Terminer une tâche', icon: '📝' },
                { xp: 100, action: 'Atteindre un objectif', icon: '🎯' },
                { xp: 10, action: 'Écrire sa gratitude', icon: '🙏' },
                { xp: 50, action: 'Bonus série de 7 jours', icon: '🔥' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <span className="text-xl">{item.icon}</span>
                  <span className="flex-1 text-sm text-foreground">{item.action}</span>
                  <span className="font-display font-bold text-primary">+{item.xp} XP</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
