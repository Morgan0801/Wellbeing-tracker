// Service de logging et tracking des tokens consommés par l'IA

export interface TokenUsageLog {
  id: string;
  timestamp: number;
  feature: string; // Nom de la fonctionnalité
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number; // En USD
}

export interface TokenStats {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  byFeature: Record<string, {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  }>;
  logs: TokenUsageLog[];
}

// Prix Gemini 2.5 Flash (décembre 2024)
// Source: https://ai.google.dev/pricing
const PRICING = {
  input: 0.30 / 1_000_000,   // $0.30 per 1M input tokens
  output: 2.50 / 1_000_000,  // $2.50 per 1M output tokens
  cachedInput: 0.03 / 1_000_000, // $0.03 per 1M cached input tokens (90% moins cher!)
};

const STORAGE_KEY = 'ai-token-usage-logs';
const MAX_LOGS = 1000; // Garder max 1000 logs

class AITokenLogger {
  private logs: TokenUsageLog[] = [];

  constructor() {
    this.loadLogs();
  }

  /**
   * Charger les logs depuis localStorage
   */
  private loadLogs(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
        console.log(`📊 Logs de tokens chargés: ${this.logs.length} entrées`);
      }
    } catch (error) {
      console.error('Erreur chargement logs tokens:', error);
      this.logs = [];
    }
  }

  /**
   * Sauvegarder les logs dans localStorage
   */
  private saveLogs(): void {
    try {
      // Garder seulement les MAX_LOGS plus récents
      const recentLogs = this.logs.slice(-MAX_LOGS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentLogs));
      this.logs = recentLogs;
    } catch (error) {
      console.error('Erreur sauvegarde logs tokens:', error);
    }
  }

  /**
   * Logger une utilisation de tokens
   */
  log(feature: string, inputTokens: number, outputTokens: number): void {
    const totalTokens = inputTokens + outputTokens;
    const estimatedCost = (inputTokens * PRICING.input) + (outputTokens * PRICING.output);

    const logEntry: TokenUsageLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      feature,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
    };

    this.logs.push(logEntry);
    this.saveLogs();

    // Console log avec couleurs
    console.log(
      `%c🤖 AI Token Usage - ${feature}`,
      'color: #8B5CF6; font-weight: bold;',
      `\n📥 Input: ${inputTokens.toLocaleString()} tokens` +
      `\n📤 Output: ${outputTokens.toLocaleString()} tokens` +
      `\n💰 Cost: $${estimatedCost.toFixed(6)}`
    );
  }

  /**
   * Obtenir les statistiques globales
   */
  getStats(daysBack: number = 30): TokenStats {
    const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
    const recentLogs = this.logs.filter(log => log.timestamp >= cutoffTime);

    const stats: TokenStats = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      byFeature: {},
      logs: recentLogs,
    };

    for (const log of recentLogs) {
      stats.totalInputTokens += log.inputTokens;
      stats.totalOutputTokens += log.outputTokens;
      stats.totalTokens += log.totalTokens;
      stats.totalCost += log.estimatedCost;

      if (!stats.byFeature[log.feature]) {
        stats.byFeature[log.feature] = {
          calls: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          cost: 0,
        };
      }

      stats.byFeature[log.feature].calls += 1;
      stats.byFeature[log.feature].inputTokens += log.inputTokens;
      stats.byFeature[log.feature].outputTokens += log.outputTokens;
      stats.byFeature[log.feature].totalTokens += log.totalTokens;
      stats.byFeature[log.feature].cost += log.estimatedCost;
    }

    return stats;
  }

  /**
   * Afficher les stats dans la console
   */
  printStats(daysBack: number = 30): void {
    const stats = this.getStats(daysBack);

    console.log(
      `%c📊 AI Token Usage Stats (${daysBack} derniers jours)`,
      'color: #10B981; font-weight: bold; font-size: 14px;'
    );
    console.log(`\n📈 Totaux:`);
    console.log(`  Input:  ${stats.totalInputTokens.toLocaleString()} tokens`);
    console.log(`  Output: ${stats.totalOutputTokens.toLocaleString()} tokens`);
    console.log(`  Total:  ${stats.totalTokens.toLocaleString()} tokens`);
    console.log(`  Cost:   $${stats.totalCost.toFixed(4)}`);

    console.log(`\n🎯 Par fonctionnalité:`);
    const sorted = Object.entries(stats.byFeature).sort((a, b) => b[1].totalTokens - a[1].totalTokens);

    for (const [feature, data] of sorted) {
      console.log(
        `  ${feature}:\n` +
        `    Appels: ${data.calls}\n` +
        `    Tokens: ${data.totalTokens.toLocaleString()} (${((data.totalTokens / stats.totalTokens) * 100).toFixed(1)}%)\n` +
        `    Cost:   $${data.cost.toFixed(6)}`
      );
    }
  }

  /**
   * Réinitialiser les logs
   */
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Logs de tokens effacés');
  }

  /**
   * Exporter les logs en CSV
   */
  exportToCSV(): string {
    const headers = ['Timestamp', 'Date', 'Feature', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost (USD)'];
    const rows = this.logs.map(log => [
      log.timestamp,
      new Date(log.timestamp).toISOString(),
      log.feature,
      log.inputTokens,
      log.outputTokens,
      log.totalTokens,
      log.estimatedCost.toFixed(6),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Télécharger les logs en CSV
   */
  downloadCSV(): void {
    const csv = this.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-token-usage-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export singleton
export const aiTokenLogger = new AITokenLogger();

// Exposer dans window pour debug console
if (typeof window !== 'undefined') {
  (window as any).aiTokenLogger = aiTokenLogger;
  console.log(
    '%c💡 Debug Tip: Use aiTokenLogger.printStats() to see AI token usage',
    'color: #3B82F6; font-style: italic;'
  );
}
