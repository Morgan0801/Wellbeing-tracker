import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Target, Calendar, ArrowRight } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigation } from '@/contexts/NavigationContext';

export function ActiveGoals() {
  const { goals } = useGoals();
  const { setActiveTab } = useNavigation();

  // Filtrer les objectifs non complétés et avec une date cible
  const activeGoals = goals
    .filter(goal => !goal.completed && goal.target_date)
    .sort((a, b) => {
      if (!a.target_date || !b.target_date) return 0;
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
    })
    .slice(0, 3); // Prendre les 3 prochains

  if (activeGoals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Target className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
            Objectifs en cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 mb-4">
              Aucun objectif avec date cible définie
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('goals')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Créer un objectif →
            </motion.button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <Target className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
          Objectifs en cours
        </CardTitle>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('goals')}
          className="text-xs md:text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          Voir tout
          <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
        </motion.button>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeGoals.map((goal, index) => {
          const targetDate = goal.target_date ? new Date(goal.target_date) : null;
          const daysLeft = targetDate ? differenceInDays(targetDate, new Date()) : null;

          let urgencyColor = 'text-gray-600';
          let urgencyBg = 'bg-gray-100 dark:bg-gray-800';

          if (daysLeft !== null) {
            if (daysLeft < 0) {
              urgencyColor = 'text-red-600';
              urgencyBg = 'bg-red-100 dark:bg-red-900/20';
            } else if (daysLeft <= 7) {
              urgencyColor = 'text-orange-600';
              urgencyBg = 'bg-orange-100 dark:bg-orange-900/20';
            } else if (daysLeft <= 30) {
              urgencyColor = 'text-yellow-600';
              urgencyBg = 'bg-yellow-100 dark:bg-yellow-900/20';
            } else {
              urgencyColor = 'text-green-600';
              urgencyBg = 'bg-green-100 dark:bg-green-900/20';
            }
          }

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`p-3 rounded-lg ${urgencyBg} cursor-pointer`}
              onClick={() => setActiveTab('goals')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm md:text-base text-gray-900 dark:text-white truncate">
                    {goal.title}
                  </h4>
                  {goal.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {goal.description}
                    </p>
                  )}
                  {targetDate && (
                    <div className="flex items-center gap-1 mt-2">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {format(targetDate, 'd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  )}
                </div>

                {daysLeft !== null && (
                  <div className={`text-xs md:text-sm font-bold ${urgencyColor} shrink-0`}>
                    {daysLeft < 0 ? (
                      <span>Dépassé</span>
                    ) : daysLeft === 0 ? (
                      <span>Aujourd'hui !</span>
                    ) : (
                      <span>J-{daysLeft}</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
