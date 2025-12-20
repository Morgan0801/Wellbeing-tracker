import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GoalModal } from './GoalModal';
import { AIGoalEncouragementCard } from './AIGoalEncouragementCard';
import { useGoals } from '@/hooks/useGoals';
import { GOAL_CATEGORIES } from '@/types/phase4-types';
import { formatDate, cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/lib/animations';

export function GoalsPage() {
  const { goals, loading, toggleGoal } = useGoals();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  const filteredGoals = selectedCategory
    ? activeGoals.filter((g) => g.category === selectedCategory)
    : activeGoals;

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-2 border-vitality border-t-transparent animate-spin mx-auto mb-4" />
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
      {/* Header */}
      <motion.div variants={staggerItem} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-vitality/10">
              <Target className="w-6 h-6 text-vitality" />
            </div>
            Mes Objectifs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeGoals.length} objectif{activeGoals.length > 1 ? 's' : ''} en cours
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} variant="glow" className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvel objectif
        </Button>
      </motion.div>

      {/* Filtres par catégorie */}
      <motion.div variants={staggerItem}>
        <Card variant="glass" className="border-vitality/10">
          <CardContent className="p-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <Button
                variant={selectedCategory === null ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={cn(selectedCategory === null && "bg-vitality text-white hover:bg-vitality/90")}
              >
                Tous
              </Button>
              {GOAL_CATEGORIES.map((cat) => (
                <Button
                  key={cat.type}
                  variant={selectedCategory === cat.type ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.type)}
                  className={cn(
                    "whitespace-nowrap",
                    selectedCategory === cat.type && "bg-vitality text-white hover:bg-vitality/90"
                  )}
                >
                  {cat.emoji} {cat.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Goal Encouragement */}
      <motion.div variants={staggerItem}>
        <AIGoalEncouragementCard activeGoals={activeGoals} />
      </motion.div>

      {/* Objectifs actifs */}
      <motion.div variants={staggerItem}>
        <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-vitality" />
          En cours
        </h2>
        {filteredGoals.length === 0 ? (
          <Card variant="elevated" className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-vitality/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-vitality" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">
                {selectedCategory ? 'Aucun objectif dans cette catégorie' : 'Aucun objectif'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Créez votre premier objectif pour commencer à suivre vos ambitions !
              </p>
              <Button onClick={() => setIsAddModalOpen(true)} variant="glow" size="lg">
                Créer un objectif
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGoals.map((goal, index) => {
              const category = GOAL_CATEGORIES.find((c) => c.type === goal.category);
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card hover variant="elevated" className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{category?.emoji}</span>
                            <span
                              className="text-xs px-2.5 py-1 rounded-full font-medium"
                              style={{ backgroundColor: `${category?.color}15`, color: category?.color }}
                            >
                              {category?.label}
                            </span>
                          </div>
                          <CardTitle className="text-base font-display">{goal.title}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGoal(goal.id)}
                          className="hover:bg-vitality/10"
                        >
                          <Circle className="w-5 h-5 text-muted-foreground hover:text-vitality transition-colors" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {goal.description}
                        </p>
                      )}
                      {goal.target_date && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                          <Target className="w-3 h-3" />
                          Échéance : {formatDate(new Date(goal.target_date), 'd MMM yyyy')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Objectifs complétés */}
      {completedGoals.length > 0 && (
        <motion.div variants={staggerItem}>
          <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2 text-vitality">
            <CheckCircle2 className="w-5 h-5" />
            Complétés ({completedGoals.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map((goal, index) => {
              const category = GOAL_CATEGORIES.find((c) => c.type === goal.category);
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full opacity-70 hover:opacity-100 transition-opacity bg-vitality/5 border-vitality/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{category?.emoji}</span>
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-vitality/10 text-vitality">
                              {category?.label}
                            </span>
                          </div>
                          <CardTitle className="text-base font-display line-through text-muted-foreground">
                            {goal.title}
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGoal(goal.id)}
                          className="text-vitality hover:text-vitality hover:bg-vitality/10"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {goal.completed_at && (
                        <div className="text-xs text-muted-foreground">
                          Complété le {formatDate(new Date(goal.completed_at), 'd MMM yyyy')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Modal */}
      <GoalModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </motion.div>
  );
}
