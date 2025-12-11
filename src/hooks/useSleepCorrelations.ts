import { useMemo } from 'react';
import { useSleep } from './useSleep';
import { useMood } from './useMood';
import { parseISO, isSameDay } from 'date-fns';

interface SleepStats {
  avgQuality: number;
  avgDuration: number;
  avgDeep: number;
  avgRem: number;
  count: number;
}

interface SleepQualityMoodCorrelation {
  goodSleepMood: number;
  poorSleepMood: number;
  correlation: number;
  sampleSize: number;
}

interface SleepDurationEnergyCorrelation {
  longSleepEnergy: number;
  shortSleepEnergy: number;
  difference: number;
  sampleSize: number;
}

export function useSleepCorrelations() {
  const { sleepLogs } = useSleep();
  const { moods } = useMood();

  // Stats sommeil seul vs en couple
  const { sleepAloneStats, sleepCoupleStats } = useMemo(() => {
    const alone = sleepLogs.filter(log => log.slept_alone === true);
    const couple = sleepLogs.filter(log => log.slept_alone === false);

    const calculateStats = (logs: typeof sleepLogs): SleepStats | null => {
      if (logs.length === 0) return null;

      return {
        avgQuality: Math.round((logs.reduce((sum, log) => sum + log.quality_score, 0) / logs.length) * 10) / 10,
        avgDuration: Math.round((logs.reduce((sum, log) => sum + log.total_hours, 0) / logs.length) * 10) / 10,
        avgDeep: Math.round((logs.reduce((sum, log) => sum + log.deep_hours, 0) / logs.length) * 10) / 10,
        avgRem: Math.round((logs.reduce((sum, log) => sum + log.rem_hours, 0) / logs.length) * 10) / 10,
        count: logs.length,
      };
    };

    return {
      sleepAloneStats: calculateStats(alone),
      sleepCoupleStats: calculateStats(couple),
    };
  }, [sleepLogs]);

  // Corrélation Qualité du sommeil vs Humeur du lendemain
  const sleepQualityVsMood = useMemo((): SleepQualityMoodCorrelation | null => {
    if (sleepLogs.length < 5 || moods.length < 5) return null;

    const correlations: { sleepQuality: number; nextDayMood: number }[] = [];

    sleepLogs.forEach(sleep => {
      const sleepDate = parseISO(sleep.date);
      const nextDay = new Date(sleepDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Trouver les moods du lendemain
      const nextDayMoods = moods.filter(mood => {
        const moodDate = parseISO(mood.datetime);
        return isSameDay(moodDate, nextDay);
      });

      if (nextDayMoods.length > 0) {
        const avgMood = nextDayMoods.reduce((sum, m) => sum + m.score_global, 0) / nextDayMoods.length;
        correlations.push({
          sleepQuality: sleep.quality_score,
          nextDayMood: avgMood,
        });
      }
    });

    if (correlations.length < 3) return null;

    // Séparer bon sommeil (8+) vs mauvais sommeil (<8)
    const goodSleep = correlations.filter(c => c.sleepQuality >= 8);
    const poorSleep = correlations.filter(c => c.sleepQuality < 8);

    if (goodSleep.length === 0 || poorSleep.length === 0) return null;

    const goodSleepMood = goodSleep.reduce((sum, c) => sum + c.nextDayMood, 0) / goodSleep.length;
    const poorSleepMood = poorSleep.reduce((sum, c) => sum + c.nextDayMood, 0) / poorSleep.length;

    // Calculer corrélation simple (différence normalisée)
    const correlation = (goodSleepMood - poorSleepMood) / 10;

    return {
      goodSleepMood: Math.round(goodSleepMood * 10) / 10,
      poorSleepMood: Math.round(poorSleepMood * 10) / 10,
      correlation: Math.round(correlation * 100) / 100,
      sampleSize: correlations.length,
    };
  }, [sleepLogs, moods]);

  // Corrélation Durée du sommeil vs Niveau d'énergie
  const sleepDurationVsEnergy = useMemo((): SleepDurationEnergyCorrelation | null => {
    if (sleepLogs.length < 5 || moods.length < 5) return null;

    const correlations: { sleepDuration: number; energy: number }[] = [];

    sleepLogs.forEach(sleep => {
      const sleepDate = parseISO(sleep.date);
      const nextDay = new Date(sleepDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Trouver les moods du lendemain avec niveau d'énergie
      const nextDayMoods = moods.filter(mood => {
        const moodDate = parseISO(mood.datetime);
        return isSameDay(moodDate, nextDay) && mood.energy_level !== undefined;
      });

      if (nextDayMoods.length > 0) {
        const avgEnergy = nextDayMoods.reduce((sum, m) => sum + (m.energy_level || 0), 0) / nextDayMoods.length;
        correlations.push({
          sleepDuration: sleep.total_hours,
          energy: avgEnergy,
        });
      }
    });

    if (correlations.length < 3) return null;

    // Séparer long sommeil (7h+) vs court sommeil (<7h)
    const longSleep = correlations.filter(c => c.sleepDuration >= 7);
    const shortSleep = correlations.filter(c => c.sleepDuration < 7);

    if (longSleep.length === 0 || shortSleep.length === 0) return null;

    const longSleepEnergy = longSleep.reduce((sum, c) => sum + c.energy, 0) / longSleep.length;
    const shortSleepEnergy = shortSleep.reduce((sum, c) => sum + c.energy, 0) / shortSleep.length;

    return {
      longSleepEnergy: Math.round(longSleepEnergy * 10) / 10,
      shortSleepEnergy: Math.round(shortSleepEnergy * 10) / 10,
      difference: Math.round((longSleepEnergy - shortSleepEnergy) * 10) / 10,
      sampleSize: correlations.length,
    };
  }, [sleepLogs, moods]);

  // Corrélation entre activités et qualité du sommeil
  const activitySleepCorrelations = useMemo(() => {
    // TODO: Implémenter si besoin
    return null;
  }, [sleepLogs, moods]);

  const hasSufficientData = sleepLogs.length >= 5;

  return {
    sleepAloneStats,
    sleepCoupleStats,
    sleepQualityVsMood,
    sleepDurationVsEnergy,
    activitySleepCorrelations,
    hasSufficientData,
  };
}
