// Système de cache pour les réponses IA
// Réduit les appels API Gemini en cachant les réponses selon leur TTL

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class AICache {
  private cache = new Map<string, CacheEntry<unknown>>();

  /**
   * Enregistrer une donnée dans le cache
   * @param key Clé unique (ex: "daily-insight-user123-2025-01-15")
   * @param data Données à cacher
   * @param expiresInMs Durée de validité en millisecondes
   */
  set<T>(key: string, data: T, expiresInMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: expiresInMs,
    });
  }

  /**
   * Récupérer une donnée du cache
   * @param key Clé unique
   * @returns Données cachées ou null si expiré/inexistant
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Vérifier si le cache a expiré
    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Invalider les entrées correspondant à un pattern
   * @param pattern String à matcher dans les clés (ex: "user123" invalide tous les caches de cet utilisateur)
   */
  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Vider complètement le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtenir la taille actuelle du cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Obtenir des stats sur le cache
   */
  getStats(): { totalEntries: number; oldestEntry: number | null; newestEntry: number | null } {
    const entries = Array.from(this.cache.values());
    if (entries.length === 0) {
      return { totalEntries: 0, oldestEntry: null, newestEntry: null };
    }

    const timestamps = entries.map(e => e.timestamp);
    return {
      totalEntries: entries.length,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps),
    };
  }
}

// Export singleton
export const aiCache = new AICache();

// TTL constants (durées de cache recommandées)
export const CACHE_TTL = {
  DAILY_AFFIRMATION: 1000 * 60 * 60 * 12,      // 12 heures
  DAILY_INSIGHT: 1000 * 60 * 60 * 12,          // 12 heures
  CORRELATION_ANALYSIS: 1000 * 60 * 60 * 24,   // 24 heures
  WEEKLY_SUMMARY: 1000 * 60 * 60 * 24 * 7,     // 7 jours
  MONTHLY_SUMMARY: 1000 * 60 * 60 * 24 * 30,   // 30 jours
  HABIT_SUGGESTIONS: 1000 * 60 * 60,           // 1 heure
  SLEEP_TIPS: 1000 * 60 * 60 * 24,             // 24 heures
  GOAL_ENCOURAGEMENT: 1000 * 60 * 60 * 24 * 7, // 7 jours
  // Pas de cache pour: mood support, task quadrant, focus analysis (temps réel)
} as const;
