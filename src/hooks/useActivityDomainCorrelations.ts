// src/hooks/useActivityDomainCorrelations.ts
// Hook pour l'analyse croisée Activités x Domaines

import { useMemo } from 'react';
import { parseISO, subDays, isWithinInterval } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useMood } from './useMood';
import { useActivities } from './useActivities';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import {
  DomainType,
  DOMAINS,
  ACTIVITY_DOMAIN_MAPPING,
  CATEGORY_DOMAIN_FALLBACK,
  CombinedCorrelation,
  ScenarioStats,
  ActivityType,
} from '@/types';

// Minimum de data points pour une corrélation fiable
const MIN_DATA_POINTS = 3;

export function useActivityDomainCorrelations(days: number = 30) {
  const { user } = useAuthStore();
  const moodHook: any = useMood();
  const activitiesHook: any = useActivities();

  const moods = moodHook?.moods ?? [];
  const activityTypes: ActivityType[] = activitiesHook?.activityTypes ?? [];

  // Charger les mood_activities
  const { data: moodActivities = [], isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['mood-activities-correlations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_activities')
        .select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Charger les mood_domains
  const { data: moodDomains = [], isLoading: isDomainsLoading } = useQuery({
    queryKey: ['mood-domains-correlations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_domains')
        .select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const isMoodsLoading = moodHook?.isLoading ?? moodHook?.loading ?? false;
  const isLoading = Boolean(isMoodsLoading || isActivitiesLoading || isDomainsLoading);

  // Fenêtre temporelle
  const endDate = new Date();
  const startDate = subDays(endDate, Math.max(0, days - 1));
  const inRange = (d: Date) =>
    isWithinInterval(d, { start: startDate, end: endDate });

  // Filtrer les moods dans la période
  const filteredMoods = useMemo(() => {
    return Array.isArray(moods)
      ? moods.filter((m: any) => {
          const dateStr = m.datetime ?? m.date ?? m.created_at;
          if (!dateStr) return false;
          const d = parseISO(dateStr);
          return d instanceof Date && !isNaN(+d) && inRange(d);
        })
      : [];
  }, [moods, days]);

  // Obtenir les domaines mappés pour une activité
  const getMappedDomains = (activity: ActivityType): DomainType[] => {
    // Priorité 1: mapping direct par nom
    const directMapping = ACTIVITY_DOMAIN_MAPPING[activity.name];
    if (directMapping && directMapping.length > 0) {
      return directMapping;
    }
    // Priorité 2: fallback par catégorie
    const categoryFallback = CATEGORY_DOMAIN_FALLBACK[activity.category];
    if (categoryFallback && categoryFallback.length > 0) {
      return categoryFallback;
    }
    return [];
  };

  // Calculer les corrélations croisées
  const correlations = useMemo(() => {
    if (filteredMoods.length < MIN_DATA_POINTS || activityTypes.length === 0) {
      return [];
    }

    const results: CombinedCorrelation[] = [];

    // Créer des maps pour accès rapide
    const moodActivitiesMap = new Map<string, Map<string, boolean>>();
    moodActivities.forEach((ma: any) => {
      if (!moodActivitiesMap.has(ma.mood_id)) {
        moodActivitiesMap.set(ma.mood_id, new Map());
      }
      moodActivitiesMap.get(ma.mood_id)!.set(ma.activity_type_id, ma.done);
    });

    const moodDomainsMap = new Map<string, Map<string, number>>();
    moodDomains.forEach((md: any) => {
      if (!moodDomainsMap.has(md.mood_id)) {
        moodDomainsMap.set(md.mood_id, new Map());
      }
      moodDomainsMap.get(md.mood_id)!.set(md.domain, md.impact);
    });

    // Pour chaque activité
    activityTypes.forEach((activity) => {
      const mappedDomains = getMappedDomains(activity);

      // Pour chaque domaine mappé
      mappedDomains.forEach((domainType) => {
        const domainDef = DOMAINS.find((d) => d.type === domainType);
        if (!domainDef) return;

        // Collecter les données par scénario
        const scenarioData: {
          A: { moods: number[]; impacts: number[] };
          B: { moods: number[]; impacts: number[] };
          C: { moods: number[]; impacts: number[] };
          D: { moods: number[]; impacts: number[] };
        } = {
          A: { moods: [], impacts: [] },
          B: { moods: [], impacts: [] },
          C: { moods: [], impacts: [] },
          D: { moods: [], impacts: [] },
        };

        filteredMoods.forEach((mood: any) => {
          const moodId = mood.id;
          const moodScore = Number(mood.score_global ?? mood.score ?? 0);

          // Obtenir le statut de l'activité pour ce mood
          const activityMap = moodActivitiesMap.get(moodId);
          const done = activityMap?.get(activity.id) ?? false;

          // Obtenir l'impact du domaine pour ce mood
          const domainMap = moodDomainsMap.get(moodId);
          const impact = domainMap?.get(domainType) ?? 0;

          // Ignorer les impacts neutres (=0)
          if (impact === 0) return;

          // Classifier dans le bon scénario
          if (done && impact > 0) {
            scenarioData.A.moods.push(moodScore);
            scenarioData.A.impacts.push(impact);
          } else if (!done && impact < 0) {
            scenarioData.B.moods.push(moodScore);
            scenarioData.B.impacts.push(impact);
          } else if (done && impact < 0) {
            scenarioData.C.moods.push(moodScore);
            scenarioData.C.impacts.push(impact);
          } else if (!done && impact > 0) {
            scenarioData.D.moods.push(moodScore);
            scenarioData.D.impacts.push(impact);
          }
        });

        // Calculer le total de data points
        const totalPoints =
          scenarioData.A.moods.length +
          scenarioData.B.moods.length +
          scenarioData.C.moods.length +
          scenarioData.D.moods.length;

        // Minimum de données requis
        if (totalPoints < MIN_DATA_POINTS) return;

        // Calculer les stats par scénario
        const calculateScenarioStats = (
          data: { moods: number[]; impacts: number[] },
          total: number
        ): ScenarioStats => ({
          count: data.moods.length,
          avgMood: data.moods.length > 0 ? avg(data.moods) : 0,
          avgImpact: data.impacts.length > 0 ? avg(data.impacts) : 0,
          percentage: total > 0 ? (data.moods.length / total) * 100 : 0,
        });

        const scenarios = {
          A: calculateScenarioStats(scenarioData.A, totalPoints),
          B: calculateScenarioStats(scenarioData.B, totalPoints),
          C: calculateScenarioStats(scenarioData.C, totalPoints),
          D: calculateScenarioStats(scenarioData.D, totalPoints),
        };

        // Calculer les stats globales
        const allDoneMoods = [...scenarioData.A.moods, ...scenarioData.C.moods];
        const allNotDoneMoods = [...scenarioData.B.moods, ...scenarioData.D.moods];
        const allDoneImpacts = [...scenarioData.A.impacts, ...scenarioData.C.impacts];
        const allNotDoneImpacts = [...scenarioData.B.impacts, ...scenarioData.D.impacts];

        const overallStats = {
          avgMoodWhenDone: allDoneMoods.length > 0 ? avg(allDoneMoods) : 0,
          avgMoodWhenNotDone: allNotDoneMoods.length > 0 ? avg(allNotDoneMoods) : 0,
          avgImpactWhenDone: allDoneImpacts.length > 0 ? avg(allDoneImpacts) : 0,
          avgImpactWhenNotDone: allNotDoneImpacts.length > 0 ? avg(allNotDoneImpacts) : 0,
          totalDataPoints: totalPoints,
        };

        // Générer les insights
        const { primaryInsight, secondaryInsight, confidence, insightType } =
          generateInsights(scenarios, activity, domainDef, totalPoints);

        results.push({
          activityId: activity.id,
          activityName: activity.name,
          activityEmoji: activity.emoji,
          domainType,
          domainLabel: domainDef.label,
          domainEmoji: domainDef.emoji,
          scenarios,
          overallStats,
          primaryInsight,
          secondaryInsight,
          confidence,
          insightType,
        });
      });
    });

    // Trier par nombre de data points (plus fiable en premier)
    return results.sort(
      (a, b) => b.overallStats.totalDataPoints - a.overallStats.totalDataPoints
    );
  }, [filteredMoods, moodActivities, moodDomains, activityTypes]);

  // Grouper les corrélations par type d'insight
  const groupedCorrelations = useMemo(() => {
    return {
      positive: correlations.filter((c) => c.insightType === 'positive'),
      warning: correlations.filter((c) => c.insightType === 'warning'),
      informational: correlations.filter((c) => c.insightType === 'informational'),
    };
  }, [correlations]);

  return {
    correlations,
    groupedCorrelations,
    hasEnoughData: correlations.length > 0,
    isLoading,
  };
}

// ===== Helpers =====

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function generateInsights(
  scenarios: CombinedCorrelation['scenarios'],
  activity: ActivityType,
  domainDef: { type: DomainType; label: string; emoji: string },
  totalPoints: number
): {
  primaryInsight: string;
  secondaryInsight?: string;
  confidence: 'high' | 'medium' | 'low';
  insightType: 'positive' | 'warning' | 'informational';
} {
  // Déterminer le scénario dominant
  const scenarioRanking = [
    { type: 'A' as const, ...scenarios.A },
    { type: 'B' as const, ...scenarios.B },
    { type: 'C' as const, ...scenarios.C },
    { type: 'D' as const, ...scenarios.D },
  ].sort((a, b) => b.count - a.count);

  const dominant = scenarioRanking[0];
  const secondary = scenarioRanking[1];

  // Niveau de confiance basé sur le nombre de données
  const confidence: 'high' | 'medium' | 'low' =
    totalPoints >= 10 ? 'high' : totalPoints >= 5 ? 'medium' : 'low';

  let primaryInsight: string;
  let secondaryInsight: string | undefined;
  let insightType: 'positive' | 'warning' | 'informational';

  const activityName = activity.name;
  const domainLabel = domainDef.label.toLowerCase();

  // Générer l'insight principal basé sur le scénario dominant
  switch (dominant.type) {
    case 'A':
      // Activité faite + impact positif
      primaryInsight = `Quand tu fais ${activityName}, ton ${domainLabel} s'améliore de +${Math.abs(dominant.avgImpact).toFixed(1)} en moyenne`;
      insightType = 'positive';
      break;
    case 'B':
      // Activité pas faite + impact négatif
      primaryInsight = `Quand tu ne fais PAS ${activityName}, ton ${domainLabel} baisse de ${dominant.avgImpact.toFixed(1)} en moyenne`;
      insightType = 'warning';
      break;
    case 'C':
      // Activité faite + impact négatif
      primaryInsight = `${activityName} a eu un impact négatif ${dominant.count} fois malgré l'avoir fait`;
      insightType = 'warning';
      break;
    case 'D':
      // Activité pas faite + impact positif
      primaryInsight = `Ne pas faire ${activityName} a parfois été positif (${dominant.count} occurrences)`;
      insightType = 'informational';
      break;
  }

  // Générer un insight secondaire si pattern significatif
  if (secondary.count >= 2 && secondary.percentage >= 25) {
    switch (secondary.type) {
      case 'A':
        secondaryInsight = `Mais ${secondary.count} fois, ${activityName} a été positif (+${Math.abs(secondary.avgImpact).toFixed(1)})`;
        break;
      case 'B':
        secondaryInsight = `L'absence de ${activityName} a aussi été négative ${secondary.count} fois`;
        break;
      case 'C':
        secondaryInsight = `Attention: ${secondary.count} fois, ${activityName} s'est mal passé`;
        break;
      case 'D':
        secondaryInsight = `Parfois, ne pas faire ${activityName} était le bon choix (${secondary.count}x)`;
        break;
    }
  }

  return { primaryInsight, secondaryInsight, confidence, insightType };
}
