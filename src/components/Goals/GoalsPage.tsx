import { useState } from 'react';
import { Plus, Target, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GoalModal } from './GoalModal';
import { useGoals } from '@/hooks/useGoals';
import { GOAL_CATEGORIES } from '@/types/phase4-types';
import { formatDate } from '@/lib/utils';

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
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24 md:pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-500" />
            Mes Objectifs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeGoals.length} objectif{activeGoals.length > 1 ? 's' : ''} en cours
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel objectif
        </Button>
      </div>

      {/* Filtres par catégorie */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Tous
        </Button>
        {GOAL_CATEGORIES.map((cat) => (
          <Button
            key={cat.type}
            variant={selectedCategory === cat.type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.type)}
          >
            {cat.emoji} {cat.label}
          </Button>
        ))}
      </div>

      {/* Objectifs actifs */}
      <div>
        <h2 className="text-lg font-semibold mb-3">En cours</h2>
        {filteredGoals.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {selectedCategory
                  ? 'Aucun objectif dans cette catégorie'
                  : 'Aucun objectif. Créez-en un pour commencer !'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGoals.map((goal) => {
              const category = GOAL_CATEGORIES.find((c) => c.type === goal.category);
              return (
                <Card key={goal.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{category?.emoji}</span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${category?.color}20`, color: category?.color }}
                          >
                            {category?.label}
                          </span>
                        </div>
                        <CardTitle className="text-base">{goal.title}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGoal(goal.id)}
                      >
                        <Circle className="w-5 h-5 text-gray-400" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {goal.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {goal.description}
                      </p>
                    )}
                    {goal.target_date && (
                      <div className="text-xs text-gray-500">
                        🎯 Échéance : {formatDate(new Date(goal.target_date), 'd MMM yyyy')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Objectifs complétés */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-green-600">
            ✅ Complétés ({completedGoals.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map((goal) => {
              const category = GOAL_CATEGORIES.find((c) => c.type === goal.category);
              return (
                <Card key={goal.id} className="opacity-60 hover:opacity-100 transition-opacity">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{category?.emoji}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            {category?.label}
                          </span>
                        </div>
                        <CardTitle className="text-base line-through">{goal.title}</CardTitle>
                      </div>
                      {/* ✅ CHANGEMENT ICI : Bouton cliquable pour décocher */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGoal(goal.id)}
                        className="text-green-500 hover:text-green-700"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {goal.completed_at && (
                      <div className="text-xs text-gray-500">
                        Complété le {formatDate(new Date(goal.completed_at), 'd MMM yyyy')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      <GoalModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </div>
  );
}
