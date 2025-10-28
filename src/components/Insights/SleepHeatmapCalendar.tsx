import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Moon } from 'lucide-react';
import { useSleep } from '@/hooks/useSleep';
import { format, subDays, startOfWeek, addDays, eachWeekOfInterval, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DayData {
  date: Date;
  hours: number | null;
  quality: number | null;
}

interface SleepHeatmapCalendarProps {
  period: 30 | 90;
}

export function SleepHeatmapCalendar({ period }: SleepHeatmapCalendarProps) {
  const { sleepLogs } = useSleep();

  const heatmapData = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, period);

    // Créer un map de date -> sleep data
    const dateSleep = new Map<string, { hours: number; quality: number }>();

    sleepLogs.forEach((log) => {
      const logDate = startOfDay(new Date(log.date));
      if (logDate >= startDate && logDate <= today) {
        const dateKey = format(logDate, 'yyyy-MM-dd');
        dateSleep.set(dateKey, {
          hours: log.total_hours,
          quality: log.quality_score,
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
          const data = dateSleep.get(dateKey);
          week.push({
            date: day,
            hours: data?.hours || null,
            quality: data?.quality || null,
          });
        } else {
          week.push({
            date: day,
            hours: null,
            quality: null,
          });
        }
      }
      weeks.push(week);
    });

    return weeks;
  }, [sleepLogs, period]);

  // Utiliser les mêmes couleurs que MoodHeatmap pour cohérence visuelle
  // On normalise les heures de sommeil sur une échelle de 0-10 comme le mood
  const getColorClass = (hours: number | null) => {
    if (hours === null) return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';

    // Normalisation: 8-9h = score 9-10 (optimal), <5h = score 0-3 (très mauvais)
    let normalizedScore = 0;
    if (hours >= 8 && hours <= 9) normalizedScore = 9.5; // Optimal
    else if (hours >= 7 && hours < 8) normalizedScore = 7.5; // Bon
    else if (hours >= 6 && hours < 7) normalizedScore = 5.5; // Moyen
    else if (hours >= 5 && hours < 6) normalizedScore = 3.5; // Insuffisant
    else if (hours < 5) normalizedScore = 2; // Très insuffisant
    else normalizedScore = 6; // >9h (trop, peut-être qualité faible)

    // Mêmes seuils et couleurs que MoodHeatmap
    if (normalizedScore >= 9) return 'bg-green-600 border-green-700';
    if (normalizedScore >= 7) return 'bg-green-400 border-green-500';
    if (normalizedScore >= 5) return 'bg-yellow-400 border-yellow-500';
    if (normalizedScore >= 3) return 'bg-orange-400 border-orange-500';
    return 'bg-red-500 border-red-600';
  };

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <Card className="p-2 md:p-4">
      <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
        <CardTitle className="text-sm md:text-lg flex items-center gap-1 md:gap-2">
          <Moon className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
          <span>Sommeil ({period}j)</span>
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
                          isPastOrToday ? getColorClass(day.hours) : 'bg-transparent border-transparent'
                        } ${day.hours !== null ? 'hover:scale-125 cursor-pointer' : ''}`}
                        title={
                          isPastOrToday && day.hours !== null
                            ? `${format(day.date, 'dd MMM yyyy', { locale: fr })}: ${day.hours.toFixed(
                                1
                              )}h (qualité: ${day.quality}/10)`
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

        {/* Légende - mêmes couleurs que Mood */}
        <div className="flex items-center gap-2 md:gap-3 mt-3 md:mt-4 text-[9px] md:text-xs text-gray-600 dark:text-gray-400">
          <span>Moins</span>
          <div className="flex gap-0.5 md:gap-1">
            <div className="w-2 h-2 md:w-6 md:h-6 bg-gray-100 dark:bg-gray-800 rounded-sm border" />
            <div className="w-2 h-2 md:w-6 md:h-6 bg-red-500 rounded-sm" title="<5h" />
            <div className="w-2 h-2 md:w-6 md:h-6 bg-orange-400 rounded-sm" title="5-6h" />
            <div className="w-2 h-2 md:w-6 md:h-6 bg-yellow-400 rounded-sm" title="6-7h" />
            <div className="w-2 h-2 md:w-6 md:h-6 bg-green-400 rounded-sm" title="7-8h" />
            <div className="w-2 h-2 md:w-6 md:h-6 bg-green-600 rounded-sm" title="8-9h (optimal)" />
          </div>
          <span>Plus</span>
        </div>
      </CardContent>
    </Card>
  );
}
