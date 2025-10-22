import { useState } from 'react';
import { Plus, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useGratitude } from '@/hooks/useGratitude';
import { formatDate } from '@/lib/utils';
import { GratitudeModal } from './GratitudeModal';

export function GratitudePage() {
  const { entries, loading } = useGratitude();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Calculer la série actuelle
  const currentStreak = () => {
    if (entries.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const entry of entries) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = currentStreak();

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
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
            <Heart className="w-6 h-6 text-pink-500" />
            Journal de Gratitude
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cultivez la gratitude au quotidien
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle entrée
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600 font-normal">
              Total d'entrées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600">{entries.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              Moments de gratitude
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600 font-normal">
              Série actuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">🔥 {streak}</div>
            <p className="text-xs text-gray-500 mt-1">
              Jour{streak > 1 ? 's' : ''} consécutif{streak > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600 font-normal">
              Cette semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {entries.filter((e) => {
                const entryDate = new Date(e.date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return entryDate >= weekAgo;
              }).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              7 derniers jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Citation inspirante */}
      <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardContent className="py-6">
          <Sparkles className="w-6 h-6 text-blue-500 mb-3 mx-auto" />
          <p className="text-center text-sm italic text-gray-700 dark:text-gray-300">
            "La gratitude transforme ce que nous avons en assez, et plus encore."
          </p>
          <p className="text-center text-xs text-gray-500 mt-2">— Melody Beattie</p>
        </CardContent>
      </Card>

      {/* Liste des entrées */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Mes moments de gratitude</h2>
        {entries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">
                Aucune entrée pour le moment.
              </p>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Commencer mon journal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {formatDate(new Date(entry.date), 'EEEE d MMMM yyyy')}
                    </CardTitle>
                    {entry.mood_emoji && (
                      <span className="text-2xl">{entry.mood_emoji}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">1.</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                        {entry.entry_1}
                      </p>
                    </div>
                    {entry.entry_2 && (
                      <div className="flex items-start gap-2">
                        <span className="text-pink-500 mt-0.5">2.</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          {entry.entry_2}
                        </p>
                      </div>
                    )}
                    {entry.entry_3 && (
                      <div className="flex items-start gap-2">
                        <span className="text-pink-500 mt-0.5">3.</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          {entry.entry_3}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Conseils */}
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            💡 Conseils pour cultiver la gratitude
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>Écrivez chaque jour, de préférence le matin ou le soir</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>Soyez spécifique : détaillez pourquoi vous êtes reconnaissant</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>Variez vos gratitudes : grandes et petites choses comptent</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>Relisez vos anciennes entrées lors de moments difficiles</span>
            </li>
          </ul>
        </CardContent>
      </Card>
	        <GratitudeModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </div>
  );
}
