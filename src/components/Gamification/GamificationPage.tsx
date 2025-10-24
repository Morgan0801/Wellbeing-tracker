import { Trophy, Zap, TrendingUp, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGamification } from '@/hooks/useGamification';
import { levelProgress, xpForNextLevel, AVAILABLE_BADGES } from '@/types/phase4-types';
import { formatDate } from '@/lib/utils';

export function GamificationPage() {
  const { gamification, xpHistory, loading } = useGamification();

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!gamification) {
    return (
      <div className="container mx-auto p-4">
        <p>Impossible de charger les données de gamification.</p>
      </div>
    );
  }

  const progress = levelProgress(gamification.total_xp, gamification.level);
  const nextLevelXP = xpForNextLevel(gamification.level);

  return (
    <div className="container mx-auto p-4 pb-24 md:pb-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Progression & Récompenses
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Suivez votre évolution et débloquez des badges
        </p>
      </div>

      {/* Niveau et XP */}
      <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
        <CardContent className="py-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500 text-white mb-3">
              <span className="text-3xl font-bold">{gamification.level}</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Niveau {gamification.level}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {gamification.total_xp} XP total
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progression vers niveau {gamification.level + 1}</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-gray-500 text-center mt-2">
              {nextLevelXP - gamification.total_xp} XP restant
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <Zap className="w-4 h-4" />
              XP Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{gamification.total_xp}</div>
            <p className="text-xs text-gray-500 mt-1">Points d'expérience</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <Award className="w-4 h-4" />
              Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {gamification.badges.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Badges débloqués</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              🔥 Série
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {gamification.streak_days}
            </div>
            <p className="text-xs text-gray-500 mt-1">Jours consécutifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges débloqués */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-500" />
          Mes Badges ({gamification.badges.length}/{AVAILABLE_BADGES.length})
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {AVAILABLE_BADGES.map((badge) => {
            const earned = gamification.badges.find((b:any) => b.id === badge.id);

            return (
              <Card
                key={badge.id}
                className={
                  earned
                    ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'opacity-50 grayscale'
                }
              >
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-2">{badge.emoji}</div>
                  <div className="font-semibold text-sm mb-1">{badge.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {badge.description}
                  </div>
                  {earned ? (
                    <div className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                      ✓ Débloqué le {formatDate(new Date(earned.earned_at), 'd MMM yyyy')}
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-500">
                      🔒 À débloquer
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Historique récent */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Historique XP
        </h2>

        {xpHistory.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Aucune activité récente. Continuez à utiliser l'app pour gagner de l'XP !
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {xpHistory.map((entry) => (
                  <div key={entry.id} className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {entry.action_type === 'mood_log' && '💭 Mood enregistré'}
                        {entry.action_type === 'habit_complete' && '✅ Habitude complétée'}
                        {entry.action_type === 'task_complete' && '📝 Tâche terminée'}
                        {entry.action_type === 'goal_complete' && '🎯 Objectif atteint'}
                        {entry.action_type === 'gratitude_log' && '🙏 Gratitude ajoutée'}
                        {entry.action_type === 'streak_bonus' && '🔥 Bonus série'}
                        {entry.action_type === 'milestone_complete' && '⭐ Jalon atteint'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(new Date(entry.created_at), 'd MMM yyyy à HH:mm')}
                      </div>
                      {entry.description && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {entry.description}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        +{entry.xp_gained} XP
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Guide XP */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            💡 Comment gagner de l'XP ?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-600">+10 XP</span>
              <span className="text-gray-700 dark:text-gray-300">Enregistrer un mood</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-600">+15 XP</span>
              <span className="text-gray-700 dark:text-gray-300">Compléter une habitude</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-600">+20 XP</span>
              <span className="text-gray-700 dark:text-gray-300">Terminer une tâche</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-600">+100 XP</span>
              <span className="text-gray-700 dark:text-gray-300">Atteindre un objectif</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-600">+10 XP</span>
              <span className="text-gray-700 dark:text-gray-300">Écrire sa gratitude</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-600">+50 XP</span>
              <span className="text-gray-700 dark:text-gray-300">Bonus série de 7 jours</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
