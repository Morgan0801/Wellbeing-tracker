import { useState } from 'react';
import { Moon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SleepModal } from './SleepModal';
import { SleepCard } from './SleepCard';
import { SleepCalendar } from './SleepCalendar';
import { SleepStatsChart } from './SleepStatsChart';
import { useSleep } from '@/hooks/useSleep';
import { SleepLog } from '@/types';

const PERIOD_OPTIONS = [
  { label: '1 jour', days: 1 },
  { label: '7 jours', days: 7 },
  { label: '30 jours', days: 30 },
  { label: '90 jours', days: 90 },
  { label: '1 an', days: 365 },
];

export function SleepPage() {
  const { sleepLogs, loading } = useSleep();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSleep, setEditingSleep] = useState<SleepLog | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30); // ✅ Filtre de période par défaut : 30 jours

  const handleEdit = (sleep: SleepLog) => {
    setEditingSleep(sleep);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
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
            <Moon className="w-6 h-6 text-purple-500" />
            Sommeil
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {sleepLogs.length} nuit{sleepLogs.length > 1 ? 's' : ''} enregistrée
            {sleepLogs.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle nuit
        </Button>
      </div>

      {/* ✅ FILTRES DE PÉRIODE */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {PERIOD_OPTIONS.map((option) => (
          <Button
            key={option.days}
            variant={selectedPeriod === option.days ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(option.days)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* ✅ NOUVEAU LAYOUT : GRAPHIQUES À GAUCHE + CALENDRIER À DROITE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Statistiques et graphiques (2/3 de la largeur) */}
        <div className="lg:col-span-2 space-y-6">
          <SleepStatsChart sleepLogs={sleepLogs} periodDays={selectedPeriod} />
        </div>

        {/* Colonne droite : Calendrier (1/3 de la largeur) */}
        <div className="lg:col-span-1">
          <SleepCalendar sleepLogs={sleepLogs} />
        </div>
      </div>

      {/* Liste des logs récents */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Nuits récentes</h2>
        {sleepLogs.length === 0 ? (
          <div className="text-center py-12">
            <Moon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Aucune nuit enregistrée. Commence par ajouter ta première nuit !
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sleepLogs.slice(0, 10).map((sleep) => (
              <SleepCard key={sleep.id} sleep={sleep} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <SleepModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingSleep(null);
        }}
        editSleep={editingSleep ?? undefined}
      />
    </div>
  );
}
