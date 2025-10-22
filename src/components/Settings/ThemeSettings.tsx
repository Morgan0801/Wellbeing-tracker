import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Check } from 'lucide-react';

export default function ThemeSettings() {
  const { themeSettings, presetThemes, loading, applyPreset } = useTheme();

  if (loading || !themeSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold mb-2">🎨 Thèmes & Personnalisation</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Personnalise l'apparence de ton Wellbeing Tracker
        </p>
      </div>

      {/* Thème actuel */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Thème actuel</h2>
        <div className="flex items-center gap-4">
          <div 
            className="w-20 h-20 rounded-lg border-2"
            style={{ 
              background: `linear-gradient(135deg, ${themeSettings.colors.primary}, ${themeSettings.colors.secondary})`
            }}
          />
          <div>
            <h3 className="text-lg font-semibold">{themeSettings.theme_name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {themeSettings.is_custom ? 'Thème personnalisé' : 'Thème prédéfini'}
            </p>
          </div>
        </div>
      </Card>

      {/* Thèmes prédéfinis */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Thèmes prédéfinis</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {presetThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => applyPreset(theme)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                themeSettings.theme_name === theme.name
                  ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="relative">
                <div 
                  className="w-full h-24 rounded-lg mb-3"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                  }}
                />
                {themeSettings.theme_name === theme.name && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-blue-500" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-2xl mb-1">{theme.emoji}</p>
                <p className="font-semibold">{theme.name}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Créateur de thème custom (simplifié) */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Créer un thème personnalisé</h2>
        <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <div className="text-center">
            <Palette className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Créateur de thème</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Cette fonctionnalité arrive bientôt !
            </p>
            <Button variant="outline" disabled>
              Créer un thème
            </Button>
          </div>
        </div>
      </Card>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Astuce :</strong> Le thème est automatiquement sauvegardé et s'applique sur tous tes appareils.
        </p>
      </div>
    </div>
  );
}
