import { useState } from 'react';
import { useExport } from '@/hooks/useExport';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { ExportOptions, ExportSection } from '@/types/phase5-types';
import { FileText, Download, Calendar, Target, CheckCircle2 } from 'lucide-react';

export default function ExportPage() {
  const { generatePDF, isGenerating } = useExport();
  
  const [exportType, setExportType] = useState<'monthly' | 'annual' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSections, setSelectedSections] = useState<ExportSection[]>([
    'mood',
    'sleep',
    'habits',
    'tasks',
    'goals',
    'gratitude',
  ]);

  const sections: { value: ExportSection; label: string; icon: string }[] = [
    { value: 'mood', label: 'Humeur', icon: '😊' },
    { value: 'sleep', label: 'Sommeil', icon: '😴' },
    { value: 'habits', label: 'Habitudes', icon: '💪' },
    { value: 'tasks', label: 'Tâches', icon: '✅' },
    { value: 'goals', label: 'Objectifs', icon: '🎯' },
    { value: 'gratitude', label: 'Gratitude', icon: '🙏' },
    { value: 'moodboard', label: 'Moodboard', icon: '✨' },
    { value: 'gamification', label: 'Gamification', icon: '🏆' },
  ];

  const toggleSection = (section: ExportSection) => {
    setSelectedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleExport = () => {
    const options: ExportOptions = {
      type: exportType,
      startDate: exportType === 'custom' ? startDate : undefined,
      endDate: exportType === 'custom' ? endDate : undefined,
      sections: selectedSections,
      includeCharts: true,
      includeInsights: true,
    };

    generatePDF(options);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold mb-2">📄 Export PDF</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Génère des rapports professionnels de ton bien-être
        </p>
      </div>

      {/* Types de rapports */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Type de rapport</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setExportType('monthly')}
            className={`p-4 rounded-lg border-2 transition-all ${
              exportType === 'monthly'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            <Calendar className="w-8 h-8 mb-2 mx-auto text-blue-500" />
            <h3 className="font-semibold mb-1">Mensuel</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Résumé du mois en cours
            </p>
          </button>

          <button
            onClick={() => setExportType('annual')}
            className={`p-4 rounded-lg border-2 transition-all ${
              exportType === 'annual'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            <Target className="w-8 h-8 mb-2 mx-auto text-green-500" />
            <h3 className="font-semibold mb-1">Annuel</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Bilan de l'année
            </p>
          </button>

          <button
            onClick={() => setExportType('custom')}
            className={`p-4 rounded-lg border-2 transition-all ${
              exportType === 'custom'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            <FileText className="w-8 h-8 mb-2 mx-auto text-purple-500" />
            <h3 className="font-semibold mb-1">Personnalisé</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choisis tes dates
            </p>
          </button>
        </div>

        {exportType === 'custom' && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <Label>Date de début</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Sections à inclure */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Sections à inclure</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sections.map(({ value, label, icon }) => (
            <div
              key={value}
              onClick={() => toggleSection(value)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedSections.includes(value)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
                {selectedSections.includes(value) && (
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="font-semibold text-sm">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSelectedSections(sections.map(s => s.value))}
          >
            Tout sélectionner
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedSections([])}
          >
            Tout désélectionner
          </Button>
        </div>
      </Card>

      {/* Bouton d'export */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Prêt à exporter ?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedSections.length} section(s) sélectionnée(s)
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={isGenerating || selectedSections.length === 0}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Génération...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Générer le PDF
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Astuce :</strong> Le PDF inclut des graphiques et des statistiques détaillées pour chaque section sélectionnée.
        </p>
      </div>
    </div>
  );
}
