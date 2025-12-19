import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useMood } from '@/hooks/useMood';
import { Cloud, Sun, Thermometer, TrendingUp, TrendingDown } from 'lucide-react';

interface WeatherMoodCorrelation {
  condition: string;
  emoji: string;
  avgMood: number;
  avgEnergy: number;
  count: number;
}

interface TempRangeCorrelation {
  range: string;
  avgMood: number;
  avgEnergy: number;
  count: number;
}

const WEATHER_EMOJIS: Record<string, string> = {
  clear: '☀️',
  sunny: '☀️',
  clouds: '☁️',
  cloudy: '☁️',
  rain: '🌧️',
  drizzle: '🌦️',
  thunderstorm: '⛈️',
  snow: '❄️',
  mist: '🌫️',
  fog: '🌫️',
  haze: '🌫️',
};

const getWeatherEmoji = (condition: string): string => {
  const lowerCondition = condition.toLowerCase();
  for (const [key, emoji] of Object.entries(WEATHER_EMOJIS)) {
    if (lowerCondition.includes(key)) return emoji;
  }
  return '🌤️';
};

const formatCondition = (condition: string): string => {
  const translations: Record<string, string> = {
    clear: 'Dégagé',
    sunny: 'Ensoleillé',
    clouds: 'Nuageux',
    cloudy: 'Nuageux',
    rain: 'Pluvieux',
    drizzle: 'Bruine',
    thunderstorm: 'Orageux',
    snow: 'Neige',
    mist: 'Brume',
    fog: 'Brouillard',
    haze: 'Brume',
    'overcast clouds': 'Couvert',
    'scattered clouds': 'Partiellement nuageux',
    'broken clouds': 'Nuageux',
    'few clouds': 'Peu nuageux',
    'light rain': 'Pluie légère',
    'moderate rain': 'Pluie modérée',
    'heavy rain': 'Forte pluie',
  };

  const lowerCondition = condition.toLowerCase();
  return translations[lowerCondition] || condition;
};

export function WeatherInsights() {
  const { moods } = useMood();

  // Filtrer les moods avec données météo
  const moodsWithWeather = useMemo(() => {
    return moods.filter(mood => mood.weather && mood.weather.condition);
  }, [moods]);

  // Analyser les corrélations météo
  const weatherCorrelations = useMemo((): WeatherMoodCorrelation[] => {
    if (moodsWithWeather.length < 5) return [];

    const grouped: Record<string, { moods: number[]; energies: number[] }> = {};

    moodsWithWeather.forEach(mood => {
      const condition = mood.weather!.condition.toLowerCase();

      // Normaliser les conditions similaires
      let normalizedCondition = condition;
      if (condition.includes('clear') || condition.includes('sunny')) normalizedCondition = 'clear';
      else if (condition.includes('cloud')) normalizedCondition = 'clouds';
      else if (condition.includes('rain') || condition.includes('drizzle')) normalizedCondition = 'rain';
      else if (condition.includes('thunder')) normalizedCondition = 'thunderstorm';
      else if (condition.includes('snow')) normalizedCondition = 'snow';
      else if (condition.includes('mist') || condition.includes('fog') || condition.includes('haze')) normalizedCondition = 'mist';

      if (!grouped[normalizedCondition]) {
        grouped[normalizedCondition] = { moods: [], energies: [] };
      }

      grouped[normalizedCondition].moods.push(mood.score_global);
      if (mood.energy_level) {
        grouped[normalizedCondition].energies.push(mood.energy_level);
      }
    });

    return Object.entries(grouped)
      .filter(([, data]) => data.moods.length >= 2)
      .map(([condition, data]) => ({
        condition: formatCondition(condition),
        emoji: getWeatherEmoji(condition),
        avgMood: Math.round((data.moods.reduce((a, b) => a + b, 0) / data.moods.length) * 10) / 10,
        avgEnergy: data.energies.length > 0
          ? Math.round((data.energies.reduce((a, b) => a + b, 0) / data.energies.length) * 10) / 10
          : 0,
        count: data.moods.length,
      }))
      .sort((a, b) => b.avgMood - a.avgMood);
  }, [moodsWithWeather]);

  // Analyser les corrélations température
  const tempCorrelations = useMemo((): TempRangeCorrelation[] => {
    if (moodsWithWeather.length < 5) return [];

    const tempRanges = [
      { min: -20, max: 5, label: 'Froid (<5°C)' },
      { min: 5, max: 15, label: 'Frais (5-15°C)' },
      { min: 15, max: 22, label: 'Doux (15-22°C)' },
      { min: 22, max: 28, label: 'Chaud (22-28°C)' },
      { min: 28, max: 50, label: 'Très chaud (>28°C)' },
    ];

    return tempRanges.map(range => {
      const moodsInRange = moodsWithWeather.filter(
        mood => mood.weather!.temp >= range.min && mood.weather!.temp < range.max
      );

      if (moodsInRange.length === 0) return null;

      const avgMood = moodsInRange.reduce((sum, m) => sum + m.score_global, 0) / moodsInRange.length;
      const energies = moodsInRange.filter(m => m.energy_level).map(m => m.energy_level!);
      const avgEnergy = energies.length > 0
        ? energies.reduce((a, b) => a + b, 0) / energies.length
        : 0;

      return {
        range: range.label,
        avgMood: Math.round(avgMood * 10) / 10,
        avgEnergy: Math.round(avgEnergy * 10) / 10,
        count: moodsInRange.length,
      };
    }).filter(Boolean) as TempRangeCorrelation[];
  }, [moodsWithWeather]);

  // Trouver la meilleure et pire météo
  const bestWeather = weatherCorrelations[0];
  const worstWeather = weatherCorrelations[weatherCorrelations.length - 1];

  if (moodsWithWeather.length < 5) {
    return (
      <Card className="border-cyan-200 dark:border-cyan-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="w-4 h-4 text-cyan-500" />
            Météo & Humeur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Sun className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Pas assez de données météo pour analyser les corrélations.
            </p>
            <p className="text-xs mt-2">
              Continue à logger tes moods pour voir l'impact de la météo !
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-cyan-200 dark:border-cyan-800">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Cloud className="w-4 h-4 text-cyan-500" />
          Météo & Humeur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Résumé */}
        {bestWeather && worstWeather && bestWeather.condition !== worstWeather.condition && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">Meilleur temps</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{bestWeather.emoji}</span>
                <div>
                  <div className="text-sm font-semibold">{bestWeather.condition}</div>
                  <div className="text-lg font-bold text-green-600">{bestWeather.avgMood}/10</div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Temps difficile</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{worstWeather.emoji}</span>
                <div>
                  <div className="text-sm font-semibold">{worstWeather.condition}</div>
                  <div className="text-lg font-bold text-orange-600">{worstWeather.avgMood}/10</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Détail par condition météo */}
        {weatherCorrelations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Par condition météo
            </h4>
            <div className="space-y-2">
              {weatherCorrelations.map((corr, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{corr.emoji}</span>
                    <div>
                      <span className="text-sm font-medium">{corr.condition}</span>
                      <span className="text-xs text-muted-foreground ml-2">({corr.count}x)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Humeur</div>
                      <div className="text-sm font-bold text-cyan-600">{corr.avgMood}/10</div>
                    </div>
                    {corr.avgEnergy > 0 && (
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Énergie</div>
                        <div className="text-sm font-bold text-yellow-600">{corr.avgEnergy}/10</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Détail par température */}
        {tempCorrelations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              Par température
            </h4>
            <div className="space-y-2">
              {tempCorrelations.map((corr, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <span className="text-sm font-medium">{corr.range}</span>
                    <span className="text-xs text-muted-foreground ml-2">({corr.count}x)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Humeur</div>
                      <div className="text-sm font-bold text-cyan-600">{corr.avgMood}/10</div>
                    </div>
                    {corr.avgEnergy > 0 && (
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Énergie</div>
                        <div className="text-sm font-bold text-yellow-600">{corr.avgEnergy}/10</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conseil */}
        {bestWeather && (
          <div className="pt-3 border-t text-center">
            <p className="text-xs text-muted-foreground">
              {bestWeather.emoji} Tu es généralement de meilleure humeur par temps <strong>{bestWeather.condition.toLowerCase()}</strong> !
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
