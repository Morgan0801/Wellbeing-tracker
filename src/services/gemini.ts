// Service pour l'API Gemini Flash
// Utilise Gemini 2.5 Flash (version stable la plus récente)
import { aiTokenLogger } from './aiTokenLogger';
import { geminiContextCache } from './geminiContextCache';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
  systemInstruction?: {
    parts: { text: string }[];
  };
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiService {
  private apiKey: string;
  private conversationHistory: GeminiMessage[] = [];

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('VITE_GEMINI_API_KEY non configurée');
    }
  }

  private getSystemPrompt(): string {
    return `Tu es un coach bien-être IA bienveillant et expert intégré dans une application de suivi de bien-être.
Tu as accès aux données de l'utilisateur : humeur, sommeil, habitudes, sessions de focus, tâches, gratitudes, etc.

Ton rôle :
- Analyser les données pour découvrir des patterns et corrélations
- Donner des conseils personnalisés basés sur les données réelles
- Être empathique, encourageant mais honnête
- Répondre en français
- Être concis mais complet
- Utiliser des emojis avec modération pour rendre les réponses plus visuelles

Important :
- Ne jamais inventer de données
- Baser tes analyses uniquement sur les données fournies
- Proposer des actions concrètes et réalisables`;
  }

  /**
   * Envoyer un message avec Context Caching (économise 90% sur inputs répétitifs)
   * Utiliser pour les méthodes avec beaucoup de contexte historique
   */
  async sendMessageWithCache(
    cacheKey: string,
    contextContent: string,
    userQuestion: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      featureName?: string;
      ttlSeconds?: number;
    }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Clé API Gemini non configurée');
    }

    // Obtenir ou créer le cache
    const cacheName = await geminiContextCache.getCacheOrCreate(
      cacheKey,
      contextContent,
      this.getSystemPrompt(),
      options?.ttlSeconds || 86400 // 24h par défaut
    );

    // Si le cache a échoué, utiliser la méthode normale
    if (!cacheName) {
      console.warn('⚠️ Cache non disponible, utilisation méthode standard');
      return this.sendMessage(userQuestion, contextContent, options);
    }

    // Faire la requête avec le cache
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cachedContent: cacheName,
            contents: [
              {
                role: 'user',
                parts: [{ text: userQuestion }],
              },
            ],
            generationConfig: {
              temperature: options?.temperature ?? 0.7,
              maxOutputTokens: options?.maxTokens ?? 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      const assistantMessage = data.candidates[0].content.parts[0].text;

      // Logger les tokens (avec cache, les inputs coûtent 10x moins cher!)
      if (data.usageMetadata) {
        aiTokenLogger.log(
          `${options?.featureName || 'Unknown'} (avec cache)`,
          data.usageMetadata.promptTokenCount,
          data.usageMetadata.candidatesTokenCount
        );
      }

      return assistantMessage;
    } catch (error) {
      console.error('❌ Erreur avec cache, fallback méthode standard:', error);
      return this.sendMessage(userQuestion, contextContent, options);
    }
  }

  async sendMessage(
    userMessage: string,
    context?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      resetHistory?: boolean;
      featureName?: string; // Pour le logging des tokens
      _retryCount?: number; // Interne pour le retry
    }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Clé API Gemini non configurée. Ajoutez VITE_GEMINI_API_KEY dans votre fichier .env');
    }

    const retryCount = options?._retryCount ?? 0;
    const maxRetries = 2;

    if (options?.resetHistory) {
      this.conversationHistory = [];
    }

    // Ajouter le contexte au message si fourni
    const fullMessage = context
      ? `[CONTEXTE DONNÉES UTILISATEUR]\n${context}\n\n[QUESTION/DEMANDE]\n${userMessage}`
      : userMessage;

    // Ne pas ajouter le message en double lors des retries
    if (retryCount === 0) {
      this.conversationHistory.push({
        role: 'user',
        parts: [{ text: fullMessage }],
      });
    }

    const request: GeminiRequest = {
      contents: this.conversationHistory,
      systemInstruction: {
        parts: [{ text: this.getSystemPrompt() }],
      },
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Erreur API Gemini: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data: GeminiResponse = await response.json();

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Réponse invalide de l\'API Gemini');
      }

      const assistantMessage = data.candidates[0].content.parts[0].text;
      const featureName = options?.featureName || 'Unknown';
      const finishReason = data.candidates[0].finishReason;

      // LOGGING DÉTAILLÉ pour debug
      console.group(`🤖 Gemini Response - ${featureName}${retryCount > 0 ? ` (Retry ${retryCount})` : ''}`);
      console.log('📊 Usage Metadata:', data.usageMetadata);
      console.log('🏁 Finish Reason:', finishReason);
      console.log('⚙️ Config maxOutputTokens:', options?.maxTokens);
      console.log('📝 Response Length:', assistantMessage.length, 'chars');
      console.log('📄 Raw Response (first 500 chars):', assistantMessage.substring(0, 500));

      // Vérifier si la réponse a été tronquée
      if (finishReason === 'MAX_TOKENS') {
        console.warn(
          `⚠️ RÉPONSE TRONQUÉE - ${featureName}\n` +
          `  Tokens reçus: ${data.usageMetadata?.candidatesTokenCount || 'N/A'}\n` +
          `  Max configuré: ${options?.maxTokens || 'N/A'}\n` +
          `  Longueur texte: ${assistantMessage.length} chars`
        );
        console.groupEnd();

        // RETRY avec limite doublée si pas encore atteint le max de retries
        if (retryCount < maxRetries) {
          const newMaxTokens = (options?.maxTokens ?? 2048) * 2;
          console.warn(`🔄 Retry avec maxTokens augmenté: ${newMaxTokens}`);

          // Retirer le message user ajouté plus tôt (sera ajouté dans le retry)
          if (retryCount === 0) {
            this.conversationHistory.pop();
          }

          return this.sendMessage(userMessage, context, {
            ...options,
            maxTokens: newMaxTokens,
            _retryCount: retryCount + 1,
          });
        } else {
          console.error(`❌ Max retries atteint (${maxRetries}), utilisation de la réponse tronquée`);
        }
      }
      console.groupEnd();

      // Ajouter la réponse à l'historique (seulement si pas de retry à venir)
      this.conversationHistory.push({
        role: 'model',
        parts: [{ text: assistantMessage }],
      });

      // Logger l'utilisation des tokens
      if (data.usageMetadata) {
        aiTokenLogger.log(
          featureName,
          data.usageMetadata.promptTokenCount,
          data.usageMetadata.candidatesTokenCount
        );
      }

      return assistantMessage;
    } catch (error) {
      // Retirer le dernier message en cas d'erreur (seulement au premier essai)
      if (retryCount === 0) {
        this.conversationHistory.pop();
      }
      throw error;
    }
  }

  // Méthodes helper privées pour analyser les données
  private groupByWeekday(moods: unknown[]): { jour: string; moyenne: string; count: number }[] {
    const byDay: Record<string, number[]> = {};
    const moodsTyped = moods as { score_global: number; datetime: string }[];

    moodsTyped.forEach(m => {
      try {
        const date = new Date(m.datetime);
        const day = date.toLocaleDateString('fr-FR', { weekday: 'long' });
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(m.score_global);
      } catch {
        // Ignorer les dates invalides
      }
    });

    return Object.entries(byDay).map(([jour, scores]) => ({
      jour,
      moyenne: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      count: scores.length
    }));
  }

  private calculateHabitStats(habitLogs: unknown[]): { habitude: string; taux: string; completions: string }[] {
    const stats: Record<string, { completed: number; total: number }> = {};
    const logsTyped = habitLogs as { completed: boolean; habits?: { name: string } }[];

    logsTyped.forEach(log => {
      const name = log.habits?.name || 'Habitude inconnue';
      if (!stats[name]) stats[name] = { completed: 0, total: 0 };
      stats[name].total++;
      if (log.completed) stats[name].completed++;
    });

    return Object.entries(stats)
      .map(([habitude, s]) => ({
        habitude,
        taux: `${Math.round((s.completed / s.total) * 100)}%`,
        completions: `${s.completed}/${s.total}`
      }))
      .sort((a, b) => parseInt(b.taux) - parseInt(a.taux)); // Trier par taux décroissant
  }

  private groupFocusByTag(focus: unknown[]): { tag: string; sessions: number; moyenne_min: number }[] {
    const byTag: Record<string, number[]> = {};
    const focusTyped = focus as { duration: number; tags?: string[] }[];

    focusTyped.forEach(f => {
      if (f.tags && Array.isArray(f.tags)) {
        f.tags.forEach((tag: string) => {
          if (!byTag[tag]) byTag[tag] = [];
          byTag[tag].push(f.duration || 0);
        });
      }
    });

    return Object.entries(byTag)
      .map(([tag, durations]) => ({
        tag,
        sessions: durations.length,
        moyenne_min: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      }))
      .sort((a, b) => b.sessions - a.sessions); // Trier par nombre de sessions
  }

  private pairSleepWithNextDayMood(sleep: unknown[], moods: unknown[]): { date: string; sommeil_h: number; qualite: number; humeur_lendemain: string }[] {
    const sleepTyped = sleep as { date: string; total_hours: number; quality_score: number }[];
    const moodsTyped = moods as { score_global: number; datetime: string }[];
    const pairs = [];

    for (const s of sleepTyped) {
      try {
        const sleepDate = new Date(s.date);
        const nextDay = new Date(sleepDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];

        const nextDayMoods = moodsTyped.filter(m => m.datetime.startsWith(nextDayStr));
        if (nextDayMoods.length > 0) {
          const avgMood = nextDayMoods.reduce((sum, m) => sum + m.score_global, 0) / nextDayMoods.length;
          pairs.push({
            date: s.date,
            sommeil_h: s.total_hours,
            qualite: s.quality_score,
            humeur_lendemain: avgMood.toFixed(1)
          });
        }
      } catch {
        // Ignorer les dates invalides
      }
    }

    return pairs.slice(0, 15); // Retourner max 15 paires récentes
  }

  async analyzeCorrelations(data: {
    moods: unknown[];
    sleep: unknown[];
    habits: unknown[];
    focus: unknown[];
    moodActivities?: unknown[];
    moodDomains?: unknown[];
    activityTypes?: unknown[];
    gamification?: unknown;
  }): Promise<{ correlations: { impact: string; observation: string; explication: string; action: string }[] }> {
    // PRE-TRAITEMENT: Calculer des statistiques agrégées
    const moodsTyped = data.moods as { score_global: number; datetime: string; note?: string; emotions?: string[] }[];
    const sleepTyped = data.sleep as { total_hours: number; quality_score: number }[];
    const focusTyped = data.focus as { duration: number }[];

    // Statistiques d'humeur
    const avgMood = moodsTyped.length > 0
      ? (moodsTyped.reduce((sum, m) => sum + m.score_global, 0) / moodsTyped.length).toFixed(1)
      : 'N/A';
    const moodsByWeekday = this.groupByWeekday(data.moods);

    // Extraire les notes significatives (humeur basse avec notes)
    const notesWithLowMood = moodsTyped
      .filter(m => m.score_global < 5 && m.note && m.note.length > 10)
      .slice(0, 5)
      .map(m => ({
        date: m.datetime.split('T')[0],
        score: m.score_global,
        note: m.note!.substring(0, 100) // Limiter à 100 caractères
      }));

    // Extraire émotions récurrentes
    const allEmotions = moodsTyped.flatMap(m => m.emotions || []);
    const emotionCounts: Record<string, number> = {};
    allEmotions.forEach(e => {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    });
    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, count]) => `${emotion} (${count}x)`);

    // Statistiques de sommeil
    const avgSleep = sleepTyped.length > 0
      ? (sleepTyped.reduce((sum, s) => sum + s.total_hours, 0) / sleepTyped.length).toFixed(1)
      : 'N/A';
    const avgQuality = sleepTyped.length > 0
      ? (sleepTyped.reduce((sum, s) => sum + s.quality_score, 0) / sleepTyped.length).toFixed(1)
      : 'N/A';

    // Statistiques habitudes
    const habitStats = this.calculateHabitStats(data.habits);

    // Statistiques focus
    const avgFocusDuration = focusTyped.length > 0
      ? Math.round(focusTyped.reduce((sum, f) => sum + f.duration, 0) / focusTyped.length)
      : 0;
    const focusByTag = this.groupFocusByTag(data.focus);

    // Corrélations sommeil-humeur
    const sleepMoodPairs = this.pairSleepWithNextDayMood(data.sleep, data.moods);

    // ✅ NOUVELLES STATS: Activités → Humeur
    const moodActivitiesTyped = (data.moodActivities || []) as { mood_id: string; activity_type_id: string; done: boolean }[];
    const activityTypesTyped = (data.activityTypes || []) as { id: string; name: string; emoji: string }[];
    const activityImpacts: { name: string; emoji: string; avgMoodWith: string; avgMoodWithout: string; occurrences: number }[] = [];

    if (moodActivitiesTyped.length > 0 && activityTypesTyped.length > 0) {
      activityTypesTyped.forEach(activityType => {
        const moodsWithActivity = new Set<string>();
        moodActivitiesTyped
          .filter(ma => ma.activity_type_id === activityType.id && ma.done)
          .forEach(ma => moodsWithActivity.add(ma.mood_id));

        const moodsWithScores: number[] = [];
        const moodsWithoutScores: number[] = [];

        moodsTyped.forEach(m => {
          if (moodsWithActivity.has(m.datetime)) {
            moodsWithScores.push(m.score_global);
          } else {
            moodsWithoutScores.push(m.score_global);
          }
        });

        if (moodsWithScores.length >= 2 && moodsWithoutScores.length >= 2) {
          const avgWith = (moodsWithScores.reduce((a, b) => a + b, 0) / moodsWithScores.length).toFixed(1);
          const avgWithout = (moodsWithoutScores.reduce((a, b) => a + b, 0) / moodsWithoutScores.length).toFixed(1);
          activityImpacts.push({
            name: activityType.name,
            emoji: activityType.emoji,
            avgMoodWith: avgWith,
            avgMoodWithout: avgWithout,
            occurrences: moodsWithScores.length
          });
        }
      });
    }

    // ✅ NOUVELLES STATS: Domaines → Humeur
    const moodDomainsTyped = (data.moodDomains || []) as { mood_id: string; domain: string; impact: number }[];
    const domainStats: { domain: string; avgImpact: string; count: number; correlationWithMood: string }[] = [];

    if (moodDomainsTyped.length > 0) {
      const domainGroups: Record<string, { impacts: number[]; moodScores: number[] }> = {};

      moodDomainsTyped.forEach(md => {
        if (!domainGroups[md.domain]) {
          domainGroups[md.domain] = { impacts: [], moodScores: [] };
        }
        domainGroups[md.domain].impacts.push(md.impact);

        // Trouver le mood correspondant
        const mood = moodsTyped.find(m => m.datetime === md.mood_id);
        if (mood) {
          domainGroups[md.domain].moodScores.push(mood.score_global);
        }
      });

      Object.entries(domainGroups).forEach(([domain, data]) => {
        if (data.impacts.length >= 3) {
          const avgImpact = (data.impacts.reduce((a, b) => a + b, 0) / data.impacts.length).toFixed(1);
          const avgMood = data.moodScores.length > 0
            ? (data.moodScores.reduce((a, b) => a + b, 0) / data.moodScores.length).toFixed(1)
            : 'N/A';
          domainStats.push({
            domain,
            avgImpact,
            count: data.impacts.length,
            correlationWithMood: avgMood
          });
        }
      });
    }

    // ✅ NOUVELLES STATS: Gamification
    const gamificationTyped = data.gamification as { total_xp: number; level: number; current_streak: number; badges: string[] } | undefined;
    const gamificationSummary = gamificationTyped
      ? `Level ${gamificationTyped.level} | ${gamificationTyped.total_xp} XP | Streak: ${gamificationTyped.current_streak}j | ${gamificationTyped.badges?.length || 0} badges`
      : 'Aucune donnée';

    const context = `
STATISTIQUES AGRÉGÉES DES 30 DERNIERS JOURS:

📊 HUMEUR:
- Moyenne globale: ${avgMood}/10
- Nombre d'entrées: ${moodsTyped.length}
- Par jour de semaine:
${moodsByWeekday.map(d => `  ${d.jour}: ${d.moyenne}/10 (${d.count} entrées)`).join('\n')}
- Émotions les plus fréquentes: ${topEmotions.length > 0 ? topEmotions.join(', ') : 'Aucune'}

📝 NOTES SIGNIFICATIVES (humeur basse):
${notesWithLowMood.length > 0 ? notesWithLowMood.map(n => `  ${n.date} (${n.score}/10): "${n.note}"`).join('\n') : '  Aucune note'}

😴 SOMMEIL:
- Durée moyenne: ${avgSleep}h
- Qualité moyenne: ${avgQuality}/5
- Nombre d'entrées: ${sleepTyped.length}
- Corrélation sommeil → humeur lendemain (15 derniers jours):
${sleepMoodPairs.map(p => `  ${p.date}: ${p.sommeil_h}h (qualité ${p.qualite}/5) → humeur ${p.humeur_lendemain}/10`).join('\n')}

✅ HABITUDES (taux de complétion):
${habitStats.length > 0 ? habitStats.map(h => `  ${h.habitude}: ${h.taux} (${h.completions})`).join('\n') : '  Aucune donnée'}

🎯 FOCUS:
- Durée moyenne: ${avgFocusDuration} minutes
- Nombre de sessions: ${focusTyped.length}
- Par tag (top 5):
${focusByTag.slice(0, 5).map(t => `  ${t.tag}: ${t.sessions} sessions, ${t.moyenne_min} min/session`).join('\n')}

🎨 ACTIVITÉS → HUMEUR (impact mesuré):
${activityImpacts.length > 0 ? activityImpacts.map(a => `  ${a.emoji} ${a.name}: Humeur AVEC = ${a.avgMoodWith}/10, SANS = ${a.avgMoodWithout}/10 (${a.occurrences}x)`).join('\n') : '  Pas assez de données'}

🏠 DOMAINES DE VIE → HUMEUR:
${domainStats.length > 0 ? domainStats.map(d => `  ${d.domain}: Impact moyen ${d.avgImpact}/5, Humeur associée ${d.correlationWithMood}/10 (${d.count} entrées)`).join('\n') : '  Pas assez de données'}

🎮 GAMIFICATION:
${gamificationSummary}
`;

    // Utiliser le cache pour économiser 90% sur les tokens d'input
    const userId = (data.moods[0] as any)?.user_id || 'unknown';
    const cacheKey = `correlations-${userId}`;

    const response = await this.sendMessageWithCache(
      cacheKey,
      context,
      `Analyse ces statistiques et identifie les 3 corrélations LES PLUS significatives.

Réponds UNIQUEMENT en JSON avec cette structure EXACTE:

{
  "correlations": [
    {
      "type": "good_news|average|concern",
      "impact": "Fort|Moyen|Faible",
      "observation": "Pattern avec chiffres PRÉCIS (MAX 60 caractères)",
      "explication": "Raison probable (MAX 80 caractères)",
      "action": "1 action concrète immédiate (MAX 50 caractères)"
    }
  ]
}

RÈGLES CRITIQUES:
- ULTRA-CONCIS: observation ≤60 chars, explication ≤80 chars, action ≤50 chars
- TOUJOURS citer des CHIFFRES PRÉCIS (ex: "5.0/10 vendredi vs 7.2/10 lundi")
- MAX 3 corrélations, OBLIGATOIREMENT AU MOINS UNE "good_news" (progrès, amélioration, streak)
- Type "good_news": amélioration, progression, maintien positif
- Type "average": neutre, stable, patterns sans impact fort
- Type "concern": baisse, détérioration, problème à adresser
- Trier: good_news en premier, puis par impact décroissant
- Si pas assez de données, retourne []
- JSON valide UNIQUEMENT, aucun texte avant/après

Exemples PARFAITS:
{
  "correlations": [
    {
      "type": "good_news",
      "impact": "Fort",
      "observation": "Sommeil amélioré: 7.8h moyenne vs 6.5h mois dernier",
      "explication": "Nouvelle routine coucher + régularité weekend",
      "action": "Maintenir horaires actuels toute la semaine"
    },
    {
      "type": "average",
      "impact": "Moyen",
      "observation": "Humeur stable 7.0/10 lundi-jeudi",
      "explication": "Routine établie mais potentiel d'amélioration",
      "action": "Tester nouvelle activité matinale"
    },
    {
      "type": "concern",
      "impact": "Fort",
      "observation": "Humeur chute vendredi: 5.0/10 vs 7.0/10 lundi",
      "explication": "Fatigue accumulée + stress fin de semaine",
      "action": "Planifier activité relaxante vendredi soir"
    }
  ]
}`,
      { temperature: 0.3, maxTokens: 8000, featureName: 'Corrélations Hebdo', ttlSeconds: 86400 }
    );

    // Parser le JSON de la réponse
    try {
      // Extraire le JSON (gérer les code blocks markdown ```json...```)
      let jsonStr = response;
      const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }

      const parsed = JSON.parse(jsonStr);
      if (parsed.correlations && Array.isArray(parsed.correlations)) {
        return {
          correlations: parsed.correlations.slice(0, 5) // Max 5
        };
      }
    } catch (error) {
      console.error('❌ Erreur parsing JSON correlations:', error);
      console.log('📄 Raw response:', response);
    }

    // Fallback
    return {
      correlations: []
    };
  }

  async generateDailyInsight(data: {
    recentMoods: unknown[];
    recentSleep: unknown[];
    recentHabits: unknown[];
    todayProgress: { habitsCompleted: number; moodLogged: boolean; focusMinutes: number };
  }): Promise<{ insight: string; tip: string; emoji: string; metric: string | null; trend: 'up' | 'down' | 'stable' }> {
    const moodsTyped = data.recentMoods as { score_global: number; score_energie: number; datetime: string }[];
    const sleepTyped = data.recentSleep as { total_hours: number; quality_score: number; date: string }[];
    const habitsTyped = data.recentHabits as { completed: boolean; habits?: { name: string } }[];

    // Calculer moyennes récentes
    const avgMood = moodsTyped.length > 0
      ? (moodsTyped.reduce((sum, m) => sum + m.score_global, 0) / moodsTyped.length).toFixed(1)
      : 'N/A';
    const avgEnergy = moodsTyped.length > 0
      ? (moodsTyped.reduce((sum, m) => sum + (m.score_energie || 0), 0) / moodsTyped.length).toFixed(1)
      : 'N/A';
    const avgSleep = sleepTyped.length > 0
      ? (sleepTyped.reduce((sum, s) => sum + s.total_hours, 0) / sleepTyped.length).toFixed(1)
      : 'N/A';

    const habitCompletionRate = habitsTyped.length > 0
      ? Math.round((habitsTyped.filter(h => h.completed).length / habitsTyped.length) * 100)
      : 0;

    const context = `
DONNÉES RÉCENTES (3 derniers jours):
📊 Humeur moyenne: ${avgMood}/10
⚡ Énergie moyenne: ${avgEnergy}/10
😴 Sommeil moyen: ${avgSleep}h
✅ Taux complétion habitudes: ${habitCompletionRate}%

PROGRÈS AUJOURD'HUI:
- Habitudes complétées: ${data.todayProgress.habitsCompleted}
- Humeur enregistrée: ${data.todayProgress.moodLogged ? 'Oui' : 'Non'}
- Minutes de focus: ${data.todayProgress.focusMinutes}
`;

    // Utiliser le cache pour économiser 90% sur les tokens d'input
    const userId = (data.recentMoods[0] as any)?.user_id || 'unknown';
    const cacheKey = `daily-insight-${userId}`;

    const response = await this.sendMessageWithCache(
      cacheKey,
      context,
      `Génère un insight quotidien HYPER-PERTINENT avec le chiffre le + important.

Réponds UNIQUEMENT en JSON (PAS de code block markdown):
{
  "insight": "LA DONNÉE CLÉ la plus significative avec CHIFFRE PRÉCIS",
  "tip": "1 action micro-concrète pour aujourd'hui",
  "emoji": "😊|💪|🌟|⚡|🎯|😌|🔥|✨|📈|🎉",
  "metric": "Métrique principale ex: '7.2/10', '85%', '+1.5pts', '8.1h'",
  "trend": "up|down|stable"
}

Exemples PARFAITS:
{"insight":"Sommeil optimal 8.1h (vs 7.2h hier)","tip":"Couche-toi à la même heure ce soir","emoji":"😴","metric":"8.1h","trend":"up"}
{"insight":"Humeur record 7.5/10 (meilleur depuis 15j)","tip":"Note ce qui a marché dans ton journal","emoji":"🎉","metric":"7.5/10","trend":"up"}
{"insight":"Streak habitudes: 12 jours consécutifs","tip":"Ne casse pas la chaîne aujourd'hui !","emoji":"🔥","metric":"12j","trend":"stable"}
{"insight":"Productivité focus +45% cette semaine","tip":"Refais ta routine gagnante demain","emoji":"⚡","metric":"+45%","trend":"up"}

RÈGLES CRITIQUES:
- Insight: TOUJOURS inclure CHIFFRE PRÉCIS comparé (vs hier, vs moyenne, vs record)
- Tip: Action MICRO-CONCRÈTE, ACTIONNABLE AUJOURD'HUI
- Metric: La métrique clé visible (ex: "8.1h", "7.5/10", "85%")
- Trend: Direction de l'évolution
- FOCUS sur LA donnée la + significative (pas généralités)
- JSON brut UNIQUEMENT (pas de \`\`\`json)
- Ton enthousiaste mais factuel`,
      { temperature: 0.5, maxTokens: 1200, featureName: 'Insight Quotidien', ttlSeconds: 43200 } // 12h TTL
    );

    try {
      // Extraire le JSON (gérer les code blocks markdown)
      let jsonStr = response;
      const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }

      const parsed = JSON.parse(jsonStr);
      // Valider la structure
      if (parsed.insight && parsed.tip && parsed.emoji) {
        return {
          insight: parsed.insight,
          tip: parsed.tip,
          emoji: parsed.emoji,
          metric: parsed.metric || null,
          trend: parsed.trend || 'stable'
        };
      }
    } catch (error) {
      console.error('❌ Erreur parsing JSON daily insight:', error);
      console.log('📄 Raw response:', response);
    }

    // Fallback si parsing échoue
    return {
      insight: "Continue ton excellent travail !",
      tip: "Concentre-toi sur une petite victoire aujourd'hui",
      emoji: "🌟",
      metric: null,
      trend: 'stable'
    };
  }

  async generateMoodSupport(currentMood: {
    score: number;
    emotions: string[];
    recentPattern: { score: number; datetime: string }[];
    timeOfDay: 'morning' | 'afternoon' | 'evening';
  }): Promise<{ strategies: string[]; reflection: string }> {
    // Analyser la tendance
    const trendText = currentMood.recentPattern.length >= 2
      ? currentMood.recentPattern[0].score > currentMood.recentPattern[currentMood.recentPattern.length - 1].score
        ? "en baisse"
        : "en amélioration"
      : "stable";

    const timeLabels = {
      morning: "matin",
      afternoon: "après-midi",
      evening: "soir"
    };

    const context = `
HUMEUR ACTUELLE:
- Score: ${currentMood.score}/10
- Émotions: ${currentMood.emotions.join(', ') || 'Non spécifiées'}
- Moment: ${timeLabels[currentMood.timeOfDay]}
- Tendance récente: ${trendText}

Historique récent (3 derniers jours):
${currentMood.recentPattern.map(p => `  ${p.datetime}: ${p.score}/10`).join('\n')}
`;

    const response = await this.sendMessage(
      `L'utilisateur traverse un moment difficile (score ${currentMood.score}/10). Génère un soutien bienveillant et actionnable.

Réponds en JSON EXACT:
{
  "strategies": [
    "Stratégie immédiate 1 (courte, actionable dans les 5-15 minutes)",
    "Stratégie 2 (courte, actionable dans les 5-15 minutes)"
  ],
  "reflection": "Une question douce pour aider à identifier la cause (1 phrase, max 12 mots)"
}

Exemples:
{"strategies": ["Prends 5 respirations profondes maintenant", "Sors 10 minutes prendre l'air"], "reflection": "Y a-t-il un événement précis qui a déclenché cela ?"}
{"strategies": ["Écoute ta musique préférée pendant 10 min", "Écris 3 choses qui vont bien malgré tout"], "reflection": "As-tu suffisamment dormi cette nuit ?"}
{"strategies": ["Bois un verre d'eau et étire-toi", "Appelle ou écris à un proche de confiance"], "reflection": "Que ferais-tu pour réconforter un ami dans ta situation ?"}

IMPORTANT:
- Stratégies concrètes, rapides (< 15 minutes) et faciles
- Adaptées au moment de la journée (${timeLabels[currentMood.timeOfDay]})
- Ton empathique et non-jugeant
- Aucun conseil médical
- JSON valide uniquement`,
      context,
      { temperature: 0.7, maxTokens: 2500, resetHistory: true, featureName: 'Soutien Mood Bas' }
    );

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.strategies && Array.isArray(parsed.strategies) && parsed.reflection) {
          return {
            strategies: parsed.strategies.slice(0, 3), // Max 3 stratégies
            reflection: parsed.reflection
          };
        }
      }
    } catch (error) {
      console.error('Erreur parsing JSON mood support:', error);
    }

    // Fallback
    return {
      strategies: [
        "Prends quelques respirations profondes",
        "Note ce que tu ressens dans un journal"
      ],
      reflection: "Qu'est-ce qui pourrait t'aider à te sentir mieux maintenant ?"
    };
  }

  async generateWeeklySummary(data: {
    moods: unknown[];
    sleep: unknown[];
    habits: unknown[];
    focus: unknown[];
    tasks: unknown[];
    gratitudes: unknown[];
  }): Promise<string> {
    const context = `
DONNÉES DE LA SEMAINE:

HUMEURS: ${JSON.stringify(data.moods)}
SOMMEIL: ${JSON.stringify(data.sleep)}
HABITUDES: ${JSON.stringify(data.habits)}
FOCUS: ${JSON.stringify(data.focus)}
TÂCHES: ${JSON.stringify(data.tasks)}
GRATITUDES: ${JSON.stringify(data.gratitudes)}
`;

    // Utiliser le cache pour économiser 90% sur les tokens d'input
    const userId = (data.moods[0] as any)?.user_id || 'unknown';
    const cacheKey = `weekly-summary-${userId}`;

    return this.sendMessageWithCache(
      cacheKey,
      context,
      `Génère un résumé hebdomadaire ULTRA-CONCIS avec des bullet points courts.

Format OBLIGATOIRE:

## 📊 Vue d'ensemble
• [Métrique 1 avec chiffre]
• [Métrique 2 avec chiffre]
• [Métrique 3 avec chiffre]

## 🌟 Points forts
• [Réussite 1 - MAX 60 caractères]
• [Réussite 2 - MAX 60 caractères]

## 🎯 À améliorer
• [Point 1 + action - MAX 60 caractères]
• [Point 2 + action - MAX 60 caractères]

## 💡 Insight clé
[1 phrase percutante avec chiffres - MAX 100 caractères]

## 🚀 Défi semaine prochaine
[1 objectif SMART concret - MAX 80 caractères]

RÈGLES:
- ULTRA-BREF: bullet points ≤60 chars
- TOUJOURS citer des CHIFFRES PRÉCIS
- MAX 3 bullets par section
- Ton motivant mais factuel`,
      { temperature: 0.6, maxTokens: 12000, featureName: 'Résumé Hebdo', ttlSeconds: 86400 } // 24h TTL
    );
  }

  async generateMonthlySummary(data: {
    moods: unknown[];
    sleep: unknown[];
    habits: unknown[];
    focus: unknown[];
    tasks: unknown[];
    gratitudes: unknown[];
  }): Promise<string> {
    const context = `
DONNÉES DU MOIS:

HUMEURS: ${JSON.stringify(data.moods)}
SOMMEIL: ${JSON.stringify(data.sleep)}
HABITUDES: ${JSON.stringify(data.habits)}
FOCUS: ${JSON.stringify(data.focus)}
TÂCHES: ${JSON.stringify(data.tasks)}
GRATITUDES: ${JSON.stringify(data.gratitudes)}
`;

    // Utiliser le cache pour économiser 90% sur les tokens d'input
    const userId = (data.moods[0] as any)?.user_id || 'unknown';
    const cacheKey = `monthly-summary-${userId}`;

    return this.sendMessageWithCache(
      cacheKey,
      context,
      `Génère un bilan mensuel CONCIS avec bullet points courts.

Format OBLIGATOIRE:

## 📈 Évolution globale
• [Tendance 1 avec % - MAX 60 chars]
• [Tendance 2 avec % - MAX 60 chars]

## 🏆 Top 3 accomplissements
• [Réussite 1 - MAX 60 chars]
• [Réussite 2 - MAX 60 chars]
• [Réussite 3 - MAX 60 chars]

## 📊 Chiffres clés
• [Stat 1 avec comparaison - MAX 60 chars]
• [Stat 2 avec comparaison - MAX 60 chars]

## 🔍 Pattern détecté
[1 corrélation importante avec chiffres - MAX 100 chars]

## 🎯 Plan mois prochain
• [Action 1 - MAX 60 chars]
• [Action 2 - MAX 60 chars]

RÈGLES:
- ULTRA-CONCIS: bullets ≤60 chars
- CHIFFRES + COMPARAISONS obligatoires
- MAX 3 bullets par section
- Ton inspirant mais factuel`,
      { temperature: 0.6, maxTokens: 15000, featureName: "Résumé Mensuel", ttlSeconds: 86400 } // 24h TTL
    );
  }

  async analyzeNotes(notes: { date: string; text: string; type: 'mood' | 'gratitude' | 'sleep' | 'focus' }[]): Promise<string> {
    const context = `
NOTES ET TEXTES DE L'UTILISATEUR:
${JSON.stringify(notes, null, 2)}
`;

    return this.sendMessage(
      `Analyse NLP de ces notes - Format ULTRA-CONCIS.

Format OBLIGATOIRE:

## 🎭 Thèmes récurrents
• [Thème 1 - fréquence - MAX 50 chars]
• [Thème 2 - fréquence - MAX 50 chars]
• [Thème 3 - fréquence - MAX 50 chars]

## 😊 Tonalité émotionnelle
[1 phrase sur l'évolution émotionnelle - MAX 80 chars]

## 🔑 Mots-clés
[5 mots max, séparés par • ]

## 💡 Insight principal
[1 découverte clé sur le bien-être - MAX 100 chars]

## 🎯 Suggestion
[1 action concrète basée sur l'analyse - MAX 60 chars]

RÈGLES:
- ULTRA-BREF: respect strict des limites
- Citations directes si pertinentes
- Ton empathique et constructif`,
      context,
      { temperature: 0.5, maxTokens: 10000, resetHistory: true, featureName: "Analyse Notes" }
    );
  }

  async semanticSearch(query: string, data: {
    moods: unknown[];
    gratitudes: unknown[];
    notes: unknown[];
  }): Promise<string> {
    const context = `
DONNÉES DISPONIBLES:

HUMEURS AVEC NOTES: ${JSON.stringify(data.moods)}
GRATITUDES: ${JSON.stringify(data.gratitudes)}
AUTRES NOTES: ${JSON.stringify(data.notes)}
`;

    return this.sendMessage(
      `Recherche sémantique: "${query}"

Format OBLIGATOIRE par résultat:

📅 **[Date]** | Score [X/10]
💭 [Citation pertinente - MAX 80 chars]
🔗 [Raison du match - MAX 50 chars]

---

RÈGLES:
- MAX 5 résultats, du plus au moins pertinent
- Si aucun match: "Aucune entrée trouvée pour '${query}'"
- Citations directes entre guillemets
- ULTRA-CONCIS`,
      context,
      { temperature: 0.3, maxTokens: 10000, resetHistory: true, featureName: "Recherche Sémantique" }
    );
  }

  async generateAffirmation(currentState: {
    mood?: number;
    energy?: number;
    recentEmotions?: string[];
    recentChallenges?: string[];
  }): Promise<string> {
    const context = `
ÉTAT ACTUEL DE L'UTILISATEUR:
- Humeur récente: ${currentState.mood ?? 'non renseignée'}/10
- Énergie: ${currentState.energy ?? 'non renseignée'}/10
- Émotions récentes: ${currentState.recentEmotions?.join(', ') ?? 'non renseignées'}
- Défis récents: ${currentState.recentChallenges?.join(', ') ?? 'non renseignés'}
`;

    return this.sendMessage(
      `Génère UNE affirmation positive personnalisée pour aujourd'hui.
L'affirmation doit :
- Être en français, à la première personne (Je...)
- Être pertinente par rapport à l'état actuel
- Être puissante mais réaliste
- Être concise (1-2 phrases max)

Réponds UNIQUEMENT avec l'affirmation, sans explication.`,
      context,
      { temperature: 0.8, maxTokens: 3000, resetHistory: true, featureName: "Reco Habitudes" }
    );
  }

  async suggestSimilarHabits(input: {
    partialName: string;
    existingHabits: { name: string; category: string; frequency: string }[];
    recentCompletions: { name: string; rate: number }[];
    goals?: string[];
  }): Promise<Array<{
    name: string;
    category: string;
    frequency: string;
    reason: string;
  }>> {
    const context = `
NOUVELLE HABITUDE EN COURS: "${input.partialName}"

HABITUDES EXISTANTES:
${input.existingHabits.map(h => `- ${h.name} (${h.category}, ${h.frequency})`).join('\n')}

TAUX DE COMPLÉTION RÉCENT:
${input.recentCompletions.map(c => `- ${c.name}: ${c.rate}%`).join('\n')}

OBJECTIFS:
${input.goals && input.goals.length > 0 ? input.goals.join(', ') : 'Aucun objectif défini'}
`;

    const response = await this.sendMessage(
      `Suggère 3-5 habitudes pertinentes qui complètent "${input.partialName}".

Réponds en JSON array EXACT:
[
  {
    "name": "Nom court de l'habitude (max 25 caractères)",
    "category": "sante_sport|productivite|mindfulness|social|nutrition|autre",
    "frequency": "daily|weekdays|weekly",
    "reason": "Raison courte (pourquoi cette habitude est pertinente, max 60 caractères)"
  }
]

Critères:
- Habitudes réalistes et actionnables
- Complémentaires aux habitudes existantes (PAS de doublons)
- Adaptées aux taux de complétion actuels (si faible, suggérer plus facile)
- Alignées avec les objectifs si fournis
- Variété dans les suggestions

Exemple si input est "cour":
[
  {"name": "Courir 20 min", "category": "sante_sport", "frequency": "weekdays", "reason": "Routine cardio régulière"},
  {"name": "Étirements post-course", "category": "sante_sport", "frequency": "daily", "reason": "Prévention blessures"},
  {"name": "Tracker distance", "category": "sante_sport", "frequency": "daily", "reason": "Suivi progression"}
]

IMPORTANT: JSON array valide uniquement, 3-5 suggestions max.`,
      context,
      { temperature: 0.6, maxTokens: 4000, resetHistory: true, featureName: "Recherche Sémantique" }
    );

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 5).filter(h => h.name && h.category && h.frequency && h.reason);
        }
      }
    } catch (error) {
      console.error('Erreur parsing JSON habit suggestions:', error);
    }

    return [];
  }

  async suggestTaskQuadrant(taskData: {
    title: string;
    currentMood?: number;
    currentEnergy?: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening';
  }): Promise<{
    quadrant: 1 | 2 | 3 | 4;
    reason: string;
  }> {
    const timeLabels = {
      morning: "matin",
      afternoon: "après-midi",
      evening: "soir"
    };

    const context = `
TÂCHE: "${taskData.title}"
MOMENT: ${timeLabels[taskData.timeOfDay]}
HUMEUR ACTUELLE: ${taskData.currentMood ? `${taskData.currentMood}/10` : 'Non renseignée'}
ÉNERGIE ACTUELLE: ${taskData.currentEnergy ? `${taskData.currentEnergy}/10` : 'Non renseignée'}

MATRICE EISENHOWER:
- Quadrant 1: Urgent ET Important (crises, deadlines)
- Quadrant 2: Important MAIS PAS Urgent (planification, développement personnel)
- Quadrant 3: Urgent MAIS PAS Important (interruptions, certains emails)
- Quadrant 4: NI Urgent NI Important (distractions, temps perdu)
`;

    const response = await this.sendMessage(
      `Analyse cette tâche et suggère le meilleur quadrant Eisenhower.

Réponds en JSON EXACT:
{
  "quadrant": 1 | 2 | 3 | 4,
  "reason": "Raison courte et claire (max 60 caractères)"
}

Exemples:
{"quadrant": 1, "reason": "Deadline aujourd'hui - action immédiate requise"}
{"quadrant": 2, "reason": "Important pour tes objectifs - planifie-le"}
{"quadrant": 3, "reason": "Peut être délégué ou reporté"}

IMPORTANT:
- Base-toi sur le titre de la tâche
- Considère le moment de la journée et l'énergie
- JSON valide uniquement`,
      context,
      { temperature: 0.5, maxTokens: 2500, resetHistory: true, featureName: "Suggestion Habitude" }
    );

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.quadrant && [1, 2, 3, 4].includes(parsed.quadrant) && parsed.reason) {
          return {
            quadrant: parsed.quadrant,
            reason: parsed.reason
          };
        }
      }
    } catch (error) {
      console.error('Erreur parsing JSON task quadrant:', error);
    }

    // Fallback - quadrant 2 par défaut (important mais pas urgent)
    return {
      quadrant: 2,
      reason: "À planifier selon tes priorités"
    };
  }

  async generateSleepTips(sleepData: {
    last7Days: { date: string; hours: number; quality: number }[];
    avgMood?: number;
    avgEnergy?: number;
  }): Promise<{
    tips: string[];
    mainIssue: string;
  }> {
    const avgHours = sleepData.last7Days.length > 0
      ? (sleepData.last7Days.reduce((sum, s) => sum + s.hours, 0) / sleepData.last7Days.length).toFixed(1)
      : 'N/A';
    const avgQuality = sleepData.last7Days.length > 0
      ? (sleepData.last7Days.reduce((sum, s) => sum + s.quality, 0) / sleepData.last7Days.length).toFixed(1)
      : 'N/A';

    const context = `
SOMMEIL DES 7 DERNIERS JOURS:
${sleepData.last7Days.map(s => `- ${s.date}: ${s.hours}h (qualité ${s.quality}/5)`).join('\n')}

MOYENNES:
- Durée: ${avgHours}h
- Qualité: ${avgQuality}/5

CORRÉLATIONS:
- Humeur moyenne: ${sleepData.avgMood ? `${sleepData.avgMood}/10` : 'N/A'}
- Énergie moyenne: ${sleepData.avgEnergy ? `${sleepData.avgEnergy}/10` : 'N/A'}
`;

    const response = await this.sendMessage(
      `Analyse ces données de sommeil et génère des conseils personnalisés d'hygiène du sommeil.

Réponds en JSON EXACT:
{
  "tips": [
    "Conseil spécifique 1 (actionnable, max 80 caractères)",
    "Conseil spécifique 2 (actionnable, max 80 caractères)",
    "Conseil spécifique 3 (actionnable, max 80 caractères)"
  ],
  "mainIssue": "Problème principal identifié (max 60 caractères)"
}

Exemples:
{"tips": ["Couche-toi 30 min plus tôt pour atteindre 7-8h", "Évite les écrans 1h avant le coucher", "Essaie une routine relaxante le soir"], "mainIssue": "Durée de sommeil insuffisante"}
{"tips": ["Garde des horaires réguliers même le weekend", "Crée une chambre fraîche (18-19°C)", "Limite la caféine après 14h"], "mainIssue": "Qualité de sommeil à améliorer"}

IMPORTANT:
- Base-toi sur les données réelles
- Conseils concrets et faciles à appliquer
- Évite les généralités
- JSON valide uniquement`,
      context,
      { temperature: 0.6, maxTokens: 3000, resetHistory: true, featureName: "Suggestion Quadrant Tâche" }
    );

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.tips && Array.isArray(parsed.tips) && parsed.mainIssue) {
          return {
            tips: parsed.tips.slice(0, 3),
            mainIssue: parsed.mainIssue
          };
        }
      }
    } catch (error) {
      console.error('Erreur parsing JSON sleep tips:', error);
    }

    // Fallback
    return {
      tips: [
        "Vise 7-8h de sommeil par nuit",
        "Maintiens des horaires réguliers",
        "Crée une routine relaxante avant le coucher"
      ],
      mainIssue: "Amélioration de l'hygiène du sommeil recommandée"
    };
  }

  async generateGoalEncouragement(goalData: {
    title: string;
    progress: number;
    milestones: { title: string; completed: boolean }[];
    relatedHabits?: string[];
    relatedTasks?: string[];
  }): Promise<{
    message: string;
    nextStep: string;
    motivation: string;
  }> {
    const completedMilestones = goalData.milestones.filter(m => m.completed).length;
    const totalMilestones = goalData.milestones.length;

    const context = `
OBJECTIF: "${goalData.title}"
PROGRÈS: ${goalData.progress}%
MILESTONES: ${completedMilestones}/${totalMilestones} complétés

MILESTONES DÉTAILLÉS:
${goalData.milestones.map(m => `- ${m.completed ? '✅' : '⬜'} ${m.title}`).join('\n')}

HABITUDES LIÉES: ${goalData.relatedHabits?.join(', ') || 'Aucune'}
TÂCHES LIÉES: ${goalData.relatedTasks?.join(', ') || 'Aucune'}
`;

    const response = await this.sendMessage(
      `Génère un message d'encouragement hebdomadaire personnalisé pour cet objectif.

Réponds en JSON EXACT:
{
  "message": "Message encourageant et personnalisé (max 100 caractères)",
  "nextStep": "Suggestion de prochaine étape concrète (max 80 caractères)",
  "motivation": "Citation ou pensée motivante (max 100 caractères)"
}

Exemples:
{"message": "Bravo ! Tu as complété 3/5 milestones, tu es bien lancé", "nextStep": "Concentre-toi sur: [nom du prochain milestone]", "motivation": "Chaque petit pas compte vers ton objectif"}
{"message": "${goalData.progress}% accompli ! Continue sur cette lancée", "nextStep": "Cette semaine: [action spécifique]", "motivation": "Tu es plus proche qu'hier, plus loin que demain ne sera"}

IMPORTANT:
- Ton positif et encourageant
- Spécifique à CET objectif
- Suggestions actionnables
- JSON valide uniquement`,
      context,
      { temperature: 0.7, maxTokens: 3000, resetHistory: true, featureName: "Conseils Sommeil" }
    );

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.message && parsed.nextStep && parsed.motivation) {
          return {
            message: parsed.message,
            nextStep: parsed.nextStep,
            motivation: parsed.motivation
          };
        }
      }
    } catch (error) {
      console.error('Erreur parsing JSON goal encouragement:', error);
    }

    // Fallback
    return {
      message: `Continue comme ça ! Tu es à ${goalData.progress}% de ton objectif`,
      nextStep: "Concentre-toi sur le prochain milestone",
      motivation: "Chaque pas compte, tu avances bien !"
    };
  }

  async recommendHabits(data: {
    currentHabits: unknown[];
    habitLogs: unknown[];
    moods: unknown[];
    goals?: unknown[];
  }): Promise<string> {
    const context = `
HABITUDES ACTUELLES: ${JSON.stringify(data.currentHabits)}
LOGS DES HABITUDES (30 jours): ${JSON.stringify(data.habitLogs)}
HUMEURS (30 jours): ${JSON.stringify(data.moods)}
OBJECTIFS: ${JSON.stringify(data.goals ?? [])}
`;

    return this.sendMessage(
      `Analyse habitudes - Format ULTRA-CONCIS.

Format OBLIGATOIRE:

## 🗑️ À retirer/modifier
• [Habitude - Raison - Taux - MAX 60 chars]
• [Habitude - Raison - Taux - MAX 60 chars]

## ➕ À ajouter (TOP 3)
• [Nouvelle habitude + bénéfice - MAX 60 chars]
• [Nouvelle habitude + bénéfice - MAX 60 chars]
• [Nouvelle habitude + bénéfice - MAX 60 chars]

## 🔄 Optimisations
• [Ajustement 1 - MAX 60 chars]
• [Ajustement 2 - MAX 60 chars]

RÈGLES:
- ULTRA-BREF: bullets ≤60 chars
- Basé sur DONNÉES RÉELLES (taux complétion, impact humeur)
- Suggestions ACTIONNABLES immédiatement
- MAX 3 bullets par section`,
      context,
      { temperature: 0.6, maxTokens: 10000, resetHistory: true, featureName: "Reco Habitudes" }
    );
  }

  async analyzeFocusSession(session: {
    duration: number;
    tags: string[];
    objective?: string;
    preEnergy?: number;
    postQuality?: number;
    distractions?: number;
    mood?: string;
    notes?: string;
  }, historicalData?: unknown[]): Promise<string> {
    // Analyser l'historique pour des statistiques
    const histData = (historicalData || []) as { duration: number; tags?: string[]; postQuality?: number }[];
    const sameTags = histData.filter(h =>
      h.tags && session.tags.some(tag => h.tags?.includes(tag))
    );

    const avgDurationSameTags = sameTags.length > 0
      ? Math.round(sameTags.reduce((sum, s) => sum + s.duration, 0) / sameTags.length)
      : 0;

    const avgQualitySameTags = sameTags.length > 0
      ? (sameTags.filter(s => s.postQuality).reduce((sum, s) => sum + (s.postQuality || 0), 0) / sameTags.filter(s => s.postQuality).length).toFixed(1)
      : 'N/A';

    const context = `
SESSION TERMINÉE:
- Durée: ${session.duration} minutes
- Tags: ${session.tags.join(', ')}
- Objectif: ${session.objective ?? 'Non défini'}
- Énergie avant: ${session.preEnergy ?? 'N/A'}/5
- Qualité focus après: ${session.postQuality ?? 'N/A'}/5
- Distractions: ${session.distractions ?? 0}
- Mood: ${session.mood ?? 'N/A'}
- Notes: ${session.notes ?? 'Aucune'}

COMPARAISON AVEC HISTORIQUE (sessions similaires):
- Nombre de sessions similaires: ${sameTags.length}
- Durée moyenne: ${avgDurationSameTags} min
- Qualité moyenne: ${avgQualitySameTags}/5
- Ta session est ${session.duration > avgDurationSameTags ? 'plus longue' : 'plus courte'} que la moyenne
`;

    return this.sendMessage(
      `Analyse cette session de focus et donne un feedback constructif et personnalisé:

1. 📊 ÉVALUATION GLOBALE
   - Comment s'est passée cette session ? Note sur 5 et commentaire bref

2. 💪 POINTS POSITIFS
   - Ce qui a bien fonctionné (2-3 points concrets)

3. 🎯 AXES D'AMÉLIORATION
   - Ce qui pourrait être optimisé (1-2 suggestions)

4. 💡 CONSEIL PERSONNALISÉ
   - Une astuce actionnable pour la prochaine session (basée sur les données)

5. 📈 COMPARAISON HISTORIQUE
   - Comment cette session se compare à tes sessions similaires (${sameTags.length} sessions avec tags similaires)
   - Est-ce une progression, une régression, ou stable ?

6. 🎯 DURÉE OPTIMALE SUGGÉRÉE
   - Basée sur ton historique, quelle durée serait idéale pour ce type de tâche ?

IMPORTANT:
- Sois spécifique et base-toi sur les DONNÉES fournies
- Ton encourageant mais honnête
- Conseils actionnables pour la prochaine fois
- Utilise des emojis pour structurer (mais avec modération)`,
      context,
      { temperature: 0.6, maxTokens: 4000, resetHistory: true }
    );
  }

  async askQuestion(question: string, data: {
    moods?: unknown[];
    sleep?: unknown[];
    habits?: unknown[];
    focus?: unknown[];
    tasks?: unknown[];
    gratitudes?: unknown[];
    moodActivities?: unknown[];
    moodDomains?: unknown[];
    activityTypes?: unknown[];
    goals?: unknown[];
    gamification?: unknown;
    xpHistory?: unknown[];
  }): Promise<string> {
    const context = `
DONNÉES UTILISATEUR DISPONIBLES:

${data.moods ? `HUMEURS (30 derniers jours): ${JSON.stringify(data.moods)}` : ''}
${data.sleep ? `SOMMEIL (30 derniers jours): ${JSON.stringify(data.sleep)}` : ''}
${data.habits ? `HABITUDES: ${JSON.stringify(data.habits)}` : ''}
${data.focus ? `SESSIONS FOCUS: ${JSON.stringify(data.focus)}` : ''}
${data.tasks ? `TÂCHES: ${JSON.stringify(data.tasks)}` : ''}
${data.gratitudes ? `GRATITUDES: ${JSON.stringify(data.gratitudes)}` : ''}
${data.moodActivities ? `ACTIVITÉS LIÉES AUX MOODS: ${JSON.stringify(data.moodActivities)}` : ''}
${data.moodDomains ? `DOMAINES D'IMPACT (travail, famille, etc.): ${JSON.stringify(data.moodDomains)}` : ''}
${data.activityTypes ? `TYPES D'ACTIVITÉS: ${JSON.stringify(data.activityTypes)}` : ''}
${data.goals ? `OBJECTIFS: ${JSON.stringify(data.goals)}` : ''}
${data.gamification ? `GAMIFICATION (XP, level, badges): ${JSON.stringify(data.gamification)}` : ''}
${data.xpHistory ? `HISTORIQUE XP: ${JSON.stringify(data.xpHistory)}` : ''}
`;

    return this.sendMessage(question, context, { temperature: 0.5, maxTokens: 10000, featureName: 'Q&A Chatbot' });
  }

  async generateNarrativeExport(data: {
    period: 'week' | 'month' | '3months';
    moods: unknown[];
    sleep: unknown[];
    habits: unknown[];
    focus: unknown[];
    tasks: unknown[];
    gratitudes: unknown[];
    goals: unknown[];
  }): Promise<string> {
    const periodLabel = data.period === 'week' ? 'la semaine' : data.period === 'month' ? 'le mois' : 'les 3 derniers mois';

    const context = `
DONNÉES POUR ${periodLabel.toUpperCase()}:

HUMEURS: ${JSON.stringify(data.moods)}
SOMMEIL: ${JSON.stringify(data.sleep)}
HABITUDES: ${JSON.stringify(data.habits)}
SESSIONS FOCUS: ${JSON.stringify(data.focus)}
TÂCHES COMPLÉTÉES: ${JSON.stringify(data.tasks)}
GRATITUDES: ${JSON.stringify(data.gratitudes)}
OBJECTIFS: ${JSON.stringify(data.goals)}
`;

    return this.sendMessage(
      `Génère un rapport narratif complet pour ${periodLabel} au format Markdown.
Le rapport doit être rédigé comme un journal personnel, de manière engageante et inspirante.

Structure :
# 📖 Mon Journal de Bien-être - [Période]

## 🌅 Vue d'ensemble
[Paragraphe narratif sur la période]

## 📊 Mes Chiffres Clés
[Statistiques importantes présentées de manière visuelle]

## 🌟 Mes Moments Forts
[Les réussites et moments positifs]

## 💪 Mes Défis Surmontés
[Les difficultés et comment elles ont été gérées]

## 🧠 Ce que j'ai Appris sur Moi
[Insights et découvertes personnelles]

## 🙏 Mes Gratitudes Favorites
[Compilation des meilleures gratitudes]

## 🎯 Mes Objectifs et Progrès
[État des objectifs]

## 🚀 Pour la Suite
[Recommandations et objectifs suggérés]

---
*Rapport généré par WellBeing AI Coach*

Utilise les données réelles, sois spécifique et personnel.`,
      context,
      { temperature: 0.7, maxTokens: 20000, resetHistory: true, featureName: "Export Narratif" }
    );
  }

  async processVoiceInput(transcript: string, context?: string): Promise<{
    type: 'mood' | 'habit' | 'gratitude' | 'focus' | 'question' | 'unknown';
    extractedData: Record<string, unknown>;
    response: string;
  }> {
    const systemContext = context ? `\nCONTEXTE ACTUEL: ${context}` : '';

    const response = await this.sendMessage(
      `L'utilisateur a dit par commande vocale : "${transcript}"
${systemContext}

Analyse cette entrée vocale et détermine :
1. Le TYPE d'action (mood/habit/gratitude/focus/question/unknown)
2. Les DONNÉES EXTRAITES (score, émotions, nom d'habitude, texte de gratitude, etc.)
3. Une RÉPONSE confirmant ce que tu as compris

Réponds en JSON valide avec cette structure exacte :
{
  "type": "mood|habit|gratitude|focus|question|unknown",
  "extractedData": {
    // données spécifiques selon le type
  },
  "response": "Ta réponse à l'utilisateur"
}`,
      undefined,
      { temperature: 0.3, maxTokens: 5000, resetHistory: true, featureName: "Traitement Voix" }
    );

    try {
      // Extraire le JSON de la réponse
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback si le parsing échoue
    }

    return {
      type: 'unknown',
      extractedData: { rawText: transcript },
      response: "Je n'ai pas bien compris. Peux-tu reformuler ?",
    };
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}

// Singleton
export const geminiService = new GeminiService();
