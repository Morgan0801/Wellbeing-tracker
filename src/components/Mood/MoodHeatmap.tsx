import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMood } from '@/hooks/useMood';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getMoodEmoji } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function MoodHeatmap() {
  const { moods } = useMood();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Préparer les données par jour
  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const daysInMonth = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  const moodsData = useMemo(() => {
    const dataByDay: Record<string, { avgScore: number; moods: any[]; emotions: string[]; notes: string[] }> = {};

    moods.forEach((mood) => {
      const dateKey = format(new Date(mood.datetime), 'yyyy-MM-dd');
      if (!dataByDay[dateKey]) {
        dataByDay[dateKey] = { avgScore: 0, moods: [], emotions: [], notes: [] };
      }
      dataByDay[dateKey].moods.push(mood);
      dataByDay[dateKey].emotions.push(...mood.emotions);
      if (mood.note) {
        dataByDay[dateKey].notes.push(mood.note);
      }
    });

    // Calculer la moyenne par jour
    Object.keys(dataByDay).forEach((dateKey) => {
      const dayData = dataByDay[dateKey];
      dayData.avgScore = Math.round(
        (dayData.moods.reduce((sum, m) => sum + m.score_global, 0) / dayData.moods.length) * 10
      ) / 10;
      // Dédupliquer les émotions
      dayData.emotions = [...new Set(dayData.emotions)];
    });

    return dataByDay;
  }, [moods]);

  const getDayData = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return moodsData[dateKey] || null;
  };

  const getColorClass = (score: number | null) => {
    if (score === null) return 'bg-gray-100 dark:bg-gray-800 text-gray-400';
    if (score >= 8) return 'bg-green-500 text-white';
    if (score >= 6) return 'bg-green-300 text-gray-900';
    if (score >= 4) return 'bg-yellow-300 text-gray-900';
    if (score >= 2) return 'bg-orange-400 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <Card className="max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm md:text-base flex items-center gap-2">
            <Calendar className="w-3 h-3 md:w-4 md:h-4 text-pink-500" />
            Calendrier émotionnel
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-6 w-6 p-0"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <div className="text-xs font-medium min-w-[100px] text-center">
              {format(currentMonth, 'MMM yyyy', { locale: fr })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              disabled={currentMonth >= new Date()}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-0.5 mb-1 text-center text-[10px] text-gray-500">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
            <div key={i}>{day}</div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Padding pour le premier jour du mois */}
          {Array.from({ length: (daysInMonth[0].getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Jours du mois */}
          {daysInMonth.map((day) => {
            const dayData = getDayData(day);
            const isToday = isSameDay(day, new Date());
            const colorClass = getColorClass(dayData?.avgScore || null);

            return (
              <motion.div
                key={day.toISOString()}
                whileHover={dayData ? { scale: 1.1, zIndex: 10 } : {}}
                className="relative group"
              >
                <div
                  className={`aspect-square flex flex-col items-center justify-center rounded text-[9px] transition-all cursor-pointer ${colorClass} ${
                    isToday ? 'ring-1 ring-pink-500' : ''
                  }`}
                >
                  <div className="text-[8px]">{format(day, 'd')}</div>
                  {dayData && (
                    <div className="text-xs">{getMoodEmoji(dayData.avgScore)}</div>
                  )}
                </div>

                {/* Tooltip au hover */}
                {dayData && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-72">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 max-h-96 overflow-y-auto">
                      <div className="text-sm font-semibold mb-3 pb-2 border-b">
                        {format(day, 'd MMMM yyyy', { locale: fr })}
                        <span className="text-xs text-gray-500 ml-2">
                          ({dayData.moods.length} entrée{dayData.moods.length > 1 ? 's' : ''})
                        </span>
                      </div>

                      {/* Liste des entrées séparées */}
                      <div className="space-y-3">
                        {dayData.moods.map((mood: any) => (
                          <div
                            key={mood.id}
                            className="pb-2 border-b last:border-b-0 border-gray-100 dark:border-gray-700"
                          >
                            {/* Heure et score */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500">
                                {format(new Date(mood.datetime), 'HH:mm')}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{getMoodEmoji(mood.score_global)}</span>
                                <span className="text-base font-bold text-pink-600">
                                  {mood.score_global}/10
                                </span>
                              </div>
                            </div>

                            {/* Émotions */}
                            {mood.emotions && mood.emotions.length > 0 && (
                              <div className="mb-2">
                                <div className="text-[10px] text-gray-500 mb-1">Émotions :</div>
                                <div className="flex flex-wrap gap-1">
                                  {mood.emotions.map((emotion: string, emotionIdx: number) => (
                                    <span
                                      key={emotionIdx}
                                      className="px-1.5 py-0.5 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded text-[10px]"
                                    >
                                      {emotion}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Note */}
                            {mood.note && (
                              <div>
                                <div className="text-[10px] text-gray-500 mb-1">Note :</div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                                  "{mood.note}"
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400 pt-3 mt-3 border-t">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-100 dark:bg-gray-800 rounded" />
            <span>Aucune</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded" />
            <span>0-2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-400 rounded" />
            <span>2-4</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-300 rounded" />
            <span>4-6</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-300 rounded" />
            <span>6-8</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded" />
            <span>8-10</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 border border-pink-500 rounded" />
            <span>Auj.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
