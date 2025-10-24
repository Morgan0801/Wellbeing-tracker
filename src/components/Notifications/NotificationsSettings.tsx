import { useNotifications } from '@/hooks/useNotifications';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bell, Volume2, VolumeX } from 'lucide-react';

export default function NotificationsSettings() {
  const { settings, loading, updateSettings, sendTestNotification, requestPermission } = useNotifications();

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  const notificationGroups = [
    {
      id: 'habits',
      title: 'Habitudes',
      emoji: '💪',
      description: 'Rappel quotidien pour tes habitudes',
      enabled: settings.habits_enabled,
      time: settings.habits_time,
    },
    {
      id: 'sleep',
      title: 'Sommeil',
      emoji: '😴',
      description: 'Rappel d\'aller dormir',
      enabled: settings.sleep_enabled,
      time: settings.sleep_time,
    },
    {
      id: 'mood',
      title: 'Humeur',
      emoji: '😊',
      description: 'Enregistre ton humeur quotidienne',
      enabled: settings.mood_enabled,
      time: settings.mood_time,
    },
    {
      id: 'gratitude',
      title: 'Gratitude',
      emoji: '🙏',
      description: 'Journal de gratitude quotidien',
      enabled: settings.gratitude_enabled,
      time: settings.gratitude_time,
    },
    {
      id: 'tasks',
      title: 'Tâches',
      emoji: '✅',
      description: 'Rappels pour tes tâches',
      enabled: settings.tasks_enabled,
      time: undefined,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold mb-2">🔔 Notifications & Rappels</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure tes rappels pour rester motivé
        </p>
      </div>

      {/* Permission */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Activer les notifications</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Autorise les notifications pour recevoir des rappels
            </p>
          </div>
          <Button onClick={requestPermission} variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Autoriser
          </Button>
        </div>
      </Card>

      {/* Paramètres par catégorie */}
      {notificationGroups.map((group) => (
        <Card key={group.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{group.emoji}</span>
              <div>
                <h3 className="font-semibold text-lg">{group.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {group.description}
                </p>
              </div>
            </div>
            <Switch
              checked={group.enabled}
              onCheckedChange={(checked) => {
                updateSettings({
                  [`${group.id}_enabled`]: checked,
                });
              }}
            />
          </div>

          {group.enabled && group.time !== undefined && (
            <div className="mt-4 flex items-center gap-4">
              <Label htmlFor={`${group.id}-time`} className="min-w-[100px]">
                Heure du rappel
              </Label>
              <Input
                id={`${group.id}-time`}
                type="time"
                value={group.time || ''}
                onChange={(e) => {
                  updateSettings({
                    [`${group.id}_time`]: e.target.value,
                  });
                }}
                className="max-w-[150px]"
              />
            </div>
          )}
        </Card>
      ))}

      {/* Options générales */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Options générales</h2>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.sound_enabled ? (
              <Volume2 className="w-5 h-5 text-blue-500" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium">Son des notifications</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Jouer un son lors des rappels
              </p>
            </div>
          </div>
          <Switch
            checked={settings.sound_enabled}
            onCheckedChange={(checked) => {
              updateSettings({ sound_enabled: checked });
            }}
          />
        </div>
      </Card>

      {/* Test */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Tester les notifications</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Envoie une notification de test
            </p>
          </div>
          <Button onClick={sendTestNotification} variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Envoyer un test
          </Button>
        </div>
      </Card>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Astuce :</strong> Les notifications fonctionnent mieux quand l'application est installée comme PWA.
        </p>
      </div>
    </div>
  );
}
