import { useState } from 'react';
import { Plus, Moon, Heart, Brain, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useSleep } from '@/hooks/useSleep';
import { SleepCard } from './SleepCard';
import { SleepModal } from './SleepModal';
import { SleepCalendar } from './SleepCalendar';
import { SleepLog } from '@/types';

export function SleepPage() {
  const { 
    sleepLogs, 
    isLoading, 
    getAverageSleep, 
    getAverageQuality,
    getAverageREM,
    getAverageDeep,
    getAverageHeartRate,
  } = useSleep();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSleep, setEditingSleep] = useState<SleepLog | undefined>(undefined);

  const handleOpenModal = () => {
    setEditingSleep(undefined);
    setIsModalOpen(true);
  };

  const handleEditSleep = (sleep: SleepLog) => {
    setEditingSleep(sleep);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSleep(undefined);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  const avgSleep = getAverageSleep();
  const avgQuality = getAverageQuality();
  const avgREM = getAverageREM();
  const avgDeep = getAverageDeep();
  const avgHeartRate = getAverageHeartRate();

  return (
    <div className="container mx-auto p-4 pb-24 md:pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mon sommeil</h1>
          <p className="text-gray-500 mt-1">
            {sleepLogs.length} nuit{sleepLogs.length > 1 ? 's' : ''} enregistrée{sleepLogs.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleOpenModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter une nuit
        </Button>
      </div>

      {/* Stats moyennes */}
      {sleepLogs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Moon className="w-5 h-5 text-blue-600" />
                Durée moyenne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {avgSleep}h
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Sur les {sleepLogs.length} dernières nuits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                ⭐ Qualité moyenne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {avgQuality}/10
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Score de qualité du sommeil
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                Fréquence cardiaque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {avgHeartRate} bpm
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Moyenne au repos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Sommeil REM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {avgREM}h
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Sommeil paradoxal moyen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Sommeil profond
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {avgDeep}h
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Sommeil profond moyen
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendrier mensuel */}
      {sleepLogs.length > 0 && (
        <SleepCalendar sleepLogs={sleepLogs} />
      )}

      {/* Empty State */}
      {sleepLogs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">😴</div>
            <h3 className="text-lg font-medium mb-2">Aucune nuit enregistrée</h3>
            <p className="text-gray-500 mb-4">
              Commence à tracker ton sommeil pour voir tes statistiques !
            </p>
            <Button onClick={handleOpenModal}>
              Ajouter une nuit
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Historique */}
      {sleepLogs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Historique</h2>
          <div className="space-y-3">
            {sleepLogs.map((sleep) => (
              <SleepCard 
                key={sleep.id} 
                sleep={sleep} 
                onEdit={handleEditSleep}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <SleepModal 
        open={isModalOpen} 
        onOpenChange={handleCloseModal}
        editSleep={editingSleep}
      />
    </div>
  );
}
