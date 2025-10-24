import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MoodModal } from '@/components/Mood/MoodModal';
import { MoodHistory } from '@/components/Mood/MoodHistory';
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
    <div className="container mx-auto p-4 pb-24 md:pb-4 space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Bonjour ! 👋</h2>
        <p className="text-blue-100 mb-6">
          {formatDate(new Date(), 'EEEE d MMMM yyyy')}
        </p>
        <Button
          onClick={() => setIsMoodModalOpen(true)}
          size="lg"
          className="bg-white text-blue-600 hover:bg-blue-50"
        >
          💭 Comment je me sens ?
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tâches aujourd'hui */}
        <Card 
          className={todayTasks.length > 0 
            ? "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20"
            : ""
          }
        >
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {todayTasks.length > 0 ? (
                <>
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Tâches à faire aujourd'hui
                </>
              ) : (
                <>
                  ✅ Tâches aujourd'hui
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTasks.length > 0 ? (
              <div className="space-y-2">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {todayTasks.length} tâche{todayTasks.length > 1 ? 's' : ''}
                </p>
                <div className="space-y-1">
                  {todayTasks.slice(0, 3).map((task) => {
                    const isOverdue = task.deadline && new Date(task.deadline) < today;
                    const quadrant = TASK_QUADRANTS.find(q => q.id === task.quadrant);
                    
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span>{quadrant?.emoji}</span>
                        <span className="truncate flex-1">{task.title}</span>
                        {isOverdue && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white">
                            !
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {todayTasks.length > 3 && (
                    <p className="text-xs text-gray-500 mt-2">
                      +{todayTasks.length - 3} autre{todayTasks.length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  💡 Va sur l'onglet "Tâches" pour les gérer
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-4xl mb-2">🎉</p>
                <p className="text-sm text-gray-500">
                  Aucune tâche urgente aujourd'hui !
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood moyen */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mood moyen</CardTitle>
          </CardHeader>
          <CardContent>
            {moods.length > 0 ? (
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getMoodEmoji(averageScore)}</span>
                  <span className="text-3xl font-bold">{averageScore}/10</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Basé sur {moods.length} entrée{moods.length > 1 ? 's' : ''}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Aucune donnée pour le moment
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dernier mood */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dernier mood</CardTitle>
        </CardHeader>
        <CardContent>
          {lastMood ? (
            <div>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{getMoodEmoji(lastMood.score_global)}</span>
                <span className="text-3xl font-bold">{lastMood.score_global}/10</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formatDate(lastMood.datetime, 'PPp')}
              </p>
              {lastMood.note && (
                <p className="text-sm mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  "{lastMood.note}"
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Commencez par ajouter votre premier mood !
            </p>
          )}
        </CardContent>
      </Card>

      {/* Historique */}
      <MoodHistory />

      {/* Modal */}
      <MoodModal open={isMoodModalOpen} onOpenChange={setIsMoodModalOpen}
       weather={null}	  />
    </div>
  );
}
