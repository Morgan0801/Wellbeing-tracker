import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { useMood } from '@/hooks/useMood';
import { format, subDays, startOfWeek, addDays, eachWeekOfInterval, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DayData {
  date: Date;
  score: number | null;
  count: number;
}

interface MoodHeatmapCalendarProps {
  period: 30 | 90;
}

export function MoodHeatmapCalendar({ period }: MoodHeatmapCalendarProps) {
  const { moods } = useMood();

  const heatmapData = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, period);

    // Créer un map de date -> scores
    const dateScores = new Map<string, { total: number; count: number }>();

    moods.forEach((mood) => {
      const moodDate = startOfDay(new Date(mood.datetime));
      if (moodDate >= startDate && moodDate <= today) {
        const dateKey = format(moodDate, 'yyyy-MM-dd');
        const existing = dateScores.get(dateKey) || { total: 0, count: 0 };
        dateScores.set(dateKey, {
          total: existing.total + mood.score_global,
          count: existing.count + 1,
        });
      }
    });

    // Créer la structure de données pour la heatmap (par semaine)
    const weeks: DayData[][] = [];
    const startWeek = startOfWeek(startDate, { weekStartsOn: 1 }); // Lundi

    const allWeeks = eachWeekOfInterval(
      { start: startWeek, end: today },
      { weekStartsOn: 1 }
    );

    allWeeks.forEach((weekStart) => {
      const week: DayData[] = [];
      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        if (day >= startDate && day <= today) {
          const dateKey = format(day, 'yyyy-MM-dd');
          const data = dateScores.get(dateKey);
          week.push({
            date: day,
            score: data ? data.total / data.count : null,
            count: data?.count || 0,
          });
        } else {
          week.push({
            date: day,
            score: null,
            count: 0,
          });
        }
      }
      weeks.push(week);
    });

    return weeks;
  }, [moods, period]);

  const getColorClass = (score: number | null) => {
    if (score === null) return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    if (score >= 9) return 'bg-green-600 border-green-700';
    if (score >= 7) return 'bg-green-400 border-green-500';
    if (score >= 5) return 'bg-yellow-400 border-yellow-500';
    if (score >= 3) return 'bg-orange-400 border-orange-500';
    return 'bg-red-500 border-red-600';
  };

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <Card className="p-2 md:p-4">
      <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
        <CardTitle className="text-sm md:text-lg flex items-center gap-1 md:gap-2">
          <Heart className="w-4 h-4 md:w-5 md:h-5 text-pink-500" />
          <span>Humeur ({period}j)</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-2 md:p-6 pt-0">
        <div className="flex gap-1 md:gap-2">
          {/* Labels des jours */}
          <div className="flex flex-col gap-1 md:gap-2 text-[8px] md:text-sm text-gray-500 justify-around pr-1 md:pr-2">
            {weekDays.map((day) => (
              <div key={day} className="h-2 md:h-6 flex items-center">
                {day}
              </div>
            ))}
          </div>

          {/* Grille de la heatmap */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-1 md:gap-2">
              {heatmapData.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1 md:gap-2">
                  {week.map((day, dayIdx) => {
                    const isPastOrToday = day.date <= new Date();
                    return (
                      <div
                        key={dayIdx}
                        className={`w-2 h-2 md:w-6 md:h-6 rounded-sm border transition-all ${
                          isPastOrToday ? getColorClass(day.score) : 'bg-transparent border-transparent'
                        } ${day.score !== null ? 'hover:scale-125 cursor-pointer' : ''}`}
                        title={
                          isPastOrToday && day.score !== null
                            ? `${format(day.date, 'dd MMM yyyy', { locale: fr })}: ${day.score.toFixed(
                                1
                              )}/10 (${day.count} entrée${day.count > 1 ? 's' : ''})`
                            : isPastOrToday
                            ? `${format(day.date, 'dd MMM yyyy', { locale: fr })}: Aucune entrée`
                            : ''
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="flex items-center gap-2 md:gap-3 mt-3 md:mt-4 text-[9px] md:text-xs text-gray-600 dark:text-gray-400">
          <span>Moins</span>
          <div className="flex gap-0.5 md:gap-1">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-gray-100 dark:bg-gray-800 rounded-sm border" />
            <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-sm" />
            <div className="w-2 h-2 md:w-3 md:h-3 bg-orange-400 rounded-sm" />
            <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-400 rounded-sm" />
            <div className="w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-sm" />
            <div className="w-2 h-2 md:w-3 md:h-3 bg-green-600 rounded-sm" />
          </div>
          <span>Plus</span>
        </div>
      </CardContent>
    </Card>
  );
}
