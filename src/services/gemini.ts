// Service pour l'API Gemini Flash
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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

  async sendMessage(
    userMessage: string,
    context?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      resetHistory?: boolean;
    }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Clé API Gemini non configurée. Ajoutez VITE_GEMINI_API_KEY dans votre fichier .env');
    }

    if (options?.resetHistory) {
      this.conversationHistory = [];
    }

    // Ajouter le contexte au message si fourni
    const fullMessage = context
      ? `[CONTEXTE DONNÉES UTILISATEUR]\n${context}\n\n[QUESTION/DEMANDE]\n${userMessage}`
      : userMessage;

    this.conversationHistory.push({
      role: 'user',
      parts: [{ text: fullMessage }],
    });

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

      // Ajouter la réponse à l'historique
      this.conversationHistory.push({
        role: 'model',
        parts: [{ text: assistantMessage }],
      });

      return assistantMessage;
    } catch (error) {
      // Retirer le dernier message en cas d'erreur
      this.conversationHistory.pop();
      throw error;
    }
  }

  async analyzeCorrelations(data: {
    moods: unknown[];
    sleep: unknown[];
    habits: unknown[];
    focus: unknown[];
  }): Promise<string> {
    const context = `
DONNÉES DES 30 DERNIERS JOURS:

HUMEURS (${(data.moods as unknown[]).length} entrées):
${JSON.stringify(data.moods, null, 2)}

SOMMEIL (${(data.sleep as unknown[]).length} entrées):
${JSON.stringify(data.sleep, null, 2)}

HABITUDES (${(data.habits as unknown[]).length} entrées):
${JSON.stringify(data.habits, null, 2)}

SESSIONS FOCUS (${(data.focus as unknown[]).length} entrées):
${JSON.stringify(data.focus, null, 2)}
`;

    return this.sendMessage(
      `Analyse ces données en profondeur et découvre des corrélations subtiles que je n'aurais pas remarquées.
Cherche des patterns cachés entre :
- Sommeil et productivité du lendemain
- Habitudes et variations d'humeur
- Météo et énergie
- Jours de la semaine et performance
- Combinaisons d'activités et bien-être

Format ta réponse avec des sections claires et des insights actionnables.`,
      context,
      { temperature: 0.5, maxTokens: 3000, resetHistory: true }
    );
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

    return this.sendMessage(
      `Génère un résumé hebdomadaire complet et engageant. Inclus :
1. 📊 VUE D'ENSEMBLE - Résumé des métriques clés
2. 🌟 POINTS FORTS - Ce qui a bien fonctionné
3. 🎯 AXES D'AMÉLIORATION - Points à travailler
4. 💡 INSIGHT DE LA SEMAINE - Une découverte intéressante
5. 🚀 OBJECTIF SUGGÉRÉ - Un défi pour la semaine prochaine

Sois spécifique avec les données réelles, pas de généralités.`,
      context,
      { temperature: 0.6, maxTokens: 2000, resetHistory: true }
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

    return this.sendMessage(
      `Génère un bilan mensuel approfondi. Inclus :
1. 📈 ÉVOLUTION GLOBALE - Tendances du mois
2. 🏆 ACCOMPLISSEMENTS - Réussites notables
3. 📊 STATISTIQUES CLÉS - Chiffres importants
4. 🔍 PATTERNS DÉTECTÉS - Récurrences observées
5. 💪 FORCES CONFIRMÉES - Points forts consolidés
6. 🎯 RECOMMANDATIONS - Plan d'action pour le mois prochain

Compare avec les semaines précédentes si possible.`,
      context,
      { temperature: 0.6, maxTokens: 3000, resetHistory: true }
    );
  }

  async analyzeNotes(notes: { date: string; text: string; type: 'mood' | 'gratitude' | 'sleep' | 'focus' }[]): Promise<string> {
    const context = `
NOTES ET TEXTES DE L'UTILISATEUR:
${JSON.stringify(notes, null, 2)}
`;

    return this.sendMessage(
      `Analyse ces notes et textes pour en extraire :
1. 🎭 THÈMES RÉCURRENTS - Sujets qui reviennent souvent
2. 😊 ANALYSE ÉMOTIONNELLE - Tonalité générale et évolution
3. 🔑 MOTS-CLÉS IMPORTANTS - Termes significatifs
4. 📈 ÉVOLUTION TEMPORELLE - Comment le ton change dans le temps
5. 💡 INSIGHTS CACHÉS - Ce que ces notes révèlent sur le bien-être
6. 🎯 SUGGESTIONS - Basées sur ce que tu as détecté`,
      context,
      { temperature: 0.5, maxTokens: 2000, resetHistory: true }
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
      `L'utilisateur recherche : "${query}"

Trouve toutes les entrées pertinentes dans les données ci-dessus.
Pour chaque résultat trouvé, indique :
- La date
- Le contenu pertinent
- Pourquoi c'est lié à la recherche
- Le contexte émotionnel si disponible

Si rien n'est trouvé, indique-le clairement.`,
      context,
      { temperature: 0.3, maxTokens: 2000, resetHistory: true }
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
      { temperature: 0.8, maxTokens: 200, resetHistory: true }
    );
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
      `Analyse les habitudes de l'utilisateur et recommande :

1. 🗑️ HABITUDES À RETIRER OU MODIFIER
- Lesquelles ont un faible taux de complétion ?
- Lesquelles semblent ne pas contribuer au bien-être ?
- Pourquoi les retirer/modifier ?

2. ➕ HABITUDES À AJOUTER
- Basé sur les patterns observés, quelles nouvelles habitudes seraient bénéfiques ?
- Comment elles complémentent les habitudes existantes ?
- Niveau de difficulté et fréquence suggérée

3. 🔄 OPTIMISATIONS
- Quelles habitudes gagneraient à changer de fréquence ?
- Quels regroupements d'habitudes seraient efficaces ?

Sois spécifique et base-toi sur les données réelles.`,
      context,
      { temperature: 0.6, maxTokens: 2000, resetHistory: true }
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

HISTORIQUE RÉCENT: ${JSON.stringify(historicalData ?? [])}
`;

    return this.sendMessage(
      `Analyse cette session de focus et donne un feedback constructif :

1. 📊 ÉVALUATION - Comment s'est passée cette session ?
2. 💪 POINTS POSITIFS - Ce qui a bien fonctionné
3. 🎯 AXES D'AMÉLIORATION - Ce qui pourrait être mieux
4. 💡 CONSEIL PERSONNALISÉ - Une astuce pour la prochaine session
5. 📈 COMPARAISON - Comment ça se compare à tes sessions précédentes ?

Sois encourageant mais honnête. Réponds de manière concise.`,
      context,
      { temperature: 0.6, maxTokens: 1000, resetHistory: true }
    );
  }

  async askQuestion(question: string, data: {
    moods?: unknown[];
    sleep?: unknown[];
    habits?: unknown[];
    focus?: unknown[];
    tasks?: unknown[];
    gratitudes?: unknown[];
  }): Promise<string> {
    const context = `
DONNÉES UTILISATEUR DISPONIBLES:

${data.moods ? `HUMEURS (30 derniers jours): ${JSON.stringify(data.moods)}` : ''}
${data.sleep ? `SOMMEIL (30 derniers jours): ${JSON.stringify(data.sleep)}` : ''}
${data.habits ? `HABITUDES: ${JSON.stringify(data.habits)}` : ''}
${data.focus ? `SESSIONS FOCUS: ${JSON.stringify(data.focus)}` : ''}
${data.tasks ? `TÂCHES: ${JSON.stringify(data.tasks)}` : ''}
${data.gratitudes ? `GRATITUDES: ${JSON.stringify(data.gratitudes)}` : ''}
`;

    return this.sendMessage(question, context, { temperature: 0.5, maxTokens: 2000 });
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
      { temperature: 0.7, maxTokens: 4000, resetHistory: true }
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
      { temperature: 0.3, maxTokens: 1000, resetHistory: true }
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
