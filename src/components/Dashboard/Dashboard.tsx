import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MoodModal } from '@/components/Mood/MoodModal';
import { MoodTimeline } from '@/components/Dashboard/MoodTimeline';
import { TodayHabits } from '@/components/Dashboard/TodayHabits';
import { useMood } from '@/hooks/useMood';
import { useTasks } from '@/hooks/useTasks';
import { formatDate, getMoodEmoji } from '@/lib/utils';
import { TASK_QUADRANTS } from '@/types';
import { startOfDay } from 'date-fns';

export function Dashboard() {
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const { moods } = useMood();
  const { tasks } = useTasks();

  const lastMood = moods[0];
  const averageScore = moods.length > 0
    ? Math.round(moods.reduce((sum, m) => sum + m.score_global, 0) / moods.length * 10) / 10
    : 0;

  // Tâches à faire aujourd'hui (même logique que TasksPage)
  const today = startOfDay(new Date());
  const activeTasks = tasks.filter((t) => !t.completed);
  const todayTasks = activeTasks.filter((task) => {
    const hasDeadlineToday = task.deadline && 
      startOfDay(new Date(task.deadline)).getTime() === today.getTime();
    const isQuadrant1 = task.quadrant === 1;
    const isOverdue = task.deadline && new Date(task.deadline) < today;
    return hasDeadlineToday || isQuadrant1 || isOverdue;
  });

  return (
    <div className="container mx-auto p-3 md:p-4 pb-20 md:pb-4 space-y-4 md:space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 md:p-8 text-white"
      >
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-3xl font-bold mb-1 md:mb-2"
        >
          Bonjour ! 👋
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs md:text-base text-blue-100 mb-3 md:mb-6"
        >
          {formatDate(new Date(), 'EEEE d MMMM yyyy')}
        </motion.p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => setIsMoodModalOpen(true)}
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 h-9 md:h-11 text-sm md:text-base"
          >
            💭 Comment je me sens ?
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Tâches aujourd'hui */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
        <Card
          className={todayTasks.length > 0
            ? "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-2 md:p-4"
            : "p-2 md:p-4"
          }
        >
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-sm md:text-base flex items-center gap-1 md:gap-2">
              {todayTasks.length > 0 ? (
                <>
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                  <span className="hidden sm:inline">Tâches à faire aujourd'hui</span>
                  <span className="sm:hidden">Tâches du jour</span>
                </>
              ) : (
                <>
                  ✅ <span className="hidden sm:inline">Tâches aujourd'hui</span>
                  <span className="sm:hidden">Tâches du jour</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            {todayTasks.length > 0 ? (
              <div className="space-y-2">
                <p className="text-lg md:text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {todayTasks.length} tâche{todayTasks.length > 1 ? 's' : ''}
                </p>
                <div className="space-y-1">
                  {todayTasks.slice(0, 3).map((task) => {
                    const isOverdue = task.deadline && new Date(task.deadline) < today;
                    const quadrant = TASK_QUADRANTS.find(q => q.id === task.quadrant);

                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-sm md:text-base">{quadrant?.emoji}</span>
                        <span className="truncate flex-1">{task.title}</span>
                        {isOverdue && (
                          <span className="text-[9px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded bg-red-600 text-white">
                            !
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {todayTasks.length > 3 && (
                    <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">
                      +{todayTasks.length - 3} autre{todayTasks.length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <p className="text-[10px] md:text-xs text-gray-500 mt-2 md:mt-3">
                  💡 <span className="hidden sm:inline">Va sur l'onglet "Tâches" pour les gérer</span>
                  <span className="sm:hidden">Onglet "Tâches"</span>
                </p>
              </div>
            ) : (
              <div className="text-center py-3 md:py-4">
                <p className="text-3xl md:text-4xl mb-1 md:mb-2">🎉</p>
                <p className="text-xs md:text-sm text-gray-500">
                  <span className="hidden sm:inline">Aucune tâche urgente aujourd'hui !</span>
                  <span className="sm:hidden">Aucune tâche urgente</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>

        {/* Mood moyen */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
        <Card className="p-2 md:p-4">
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-sm md:text-base">Mood moyen</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            {moods.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="text-3xl md:text-4xl">{getMoodEmoji(averageScore)}</span>
                  <span className="text-2xl md:text-3xl font-bold">{averageScore}/10</span>
                </div>
                <p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">
                  <span className="hidden sm:inline">Basé sur {moods.length} entrée{moods.length > 1 ? 's' : ''}</span>
                  <span className="sm:hidden">{moods.length} entrée{moods.length > 1 ? 's' : ''}</span>
                </p>
              </div>
            ) : (
              <p className="text-xs md:text-sm text-gray-500">
                <span className="hidden sm:inline">Aucune donnée pour le moment</span>
                <span className="sm:hidden">Pas de données</span>
              </p>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </div>

      {/* Today's Habits */}
      <TodayHabits />

      {/* Mood Timeline */}
      <MoodTimeline />

      {/* Dernier mood */}
      <Card className="p-2 md:p-4">
        <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
          <CardTitle className="text-sm md:text-base">Dernier mood</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          {lastMood ? (
            <div>
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-3xl md:text-4xl">{getMoodEmoji(lastMood.score_global)}</span>
                <span className="text-2xl md:text-3xl font-bold">{lastMood.score_global}/10</span>
              </div>
              <p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">
                {formatDate(lastMood.datetime, 'PPp')}
              </p>
              {lastMood.note && (
                <p className="text-xs md:text-sm mt-2 md:mt-3 p-2 md:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  "{lastMood.note}"
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs md:text-sm text-gray-500">
              <span className="hidden sm:inline">Commencez par ajouter votre premier mood !</span>
              <span className="sm:hidden">Ajoutez votre premier mood</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <MoodModal open={isMoodModalOpen} onOpenChange={setIsMoodModalOpen}
       weather={null}	  />
    </div>
  );
}
