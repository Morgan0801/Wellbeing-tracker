import { useState } from 'react';
import { useInsights } from '@/hooks/useInsights';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Lightbulb, Activity, Brain, Heart } from 'lucide-react';

export default function InsightsPage() {
  const [period, setPeriod] = useState<7 | 30 | 90 | 365>(30);
  const { insights, loading } = useInsights(period);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Analyse de tes données...</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Pas encore de données</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Commence à enregistrer tes moods, sommeil et habitudes pour voir des insights !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">📊 Insights & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyse approfondie de ton bien-être
          </p>
        </div>

        {/* Sélecteur de période */}
        <div className="flex gap-2">
          {[
            { value: 7, label: '7 jours' },
            { value: 30, label: '30 jours' },
            { value: 90, label: '90 jours' },
            { value: 365, label: '1 an' },
          ].map(({ value, label }) => (
            <Button
              key={value}
              variant={period === value ? 'default' : 'outline'}
              onClick={() => setPeriod(value as any)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Graphique Humeur */}
      {insights.moodTrend.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Évolution de l'humeur
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={insights.moodTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              />
              <YAxis domain={[0, 10]} />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                formatter={(value: number) => [`${value}/10`, 'Score']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#EC4899" 
                strokeWidth={2}
                dot={{ fill: '#EC4899' }}
                name="Humeur"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Graphique Sommeil */}
      {insights.sleepTrend.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Qualité du sommeil
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={insights.sleepTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              />
              <YAxis yAxisId="left" domain={[0, 12]} label={{ value: 'Heures', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 10]} label={{ value: 'Qualité', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="totalHours" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Heures de sommeil"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="quality" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                name="Qualité"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Succès des habitudes */}
      {insights.habitSuccess.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Taux de réussite des habitudes
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={insights.habitSuccess.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="habitName" />
              <YAxis domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taux de réussite']} />
              <Bar dataKey="successRate" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Corrélations */}
      {insights.correlations.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Corrélations découvertes
          </h2>
          <div className="space-y-4">
            {insights.correlations.map((correlation) => (
              <div
                key={correlation.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  correlation.type === 'positive' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' :
                  correlation.type === 'negative' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {correlation.type === 'positive' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{correlation.description}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{correlation.insight}</p>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          correlation.type === 'positive' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${correlation.strength}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Force: {correlation.strength}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommandations */}
      {insights.recommendations.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Recommandations personnalisées
          </h2>
          <div className="space-y-3">
            {insights.recommendations.map((rec) => (
              <div
                key={rec.id}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                  'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <h3 className="font-semibold mb-1">{rec.title}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{rec.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
