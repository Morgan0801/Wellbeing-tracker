// Service de gestion du Context Caching pour Gemini API
// Permet de réduire les coûts de 90% sur les données répétitives (input tokens)

interface CacheEntry {
  name: string; // Nom du cache retourné par l'API (ex: "cachedContents/abc123")
  timestamp: number; // Quand le cache a été créé
  expiresAt: number; // Quand le cache expire
  contextHash: string; // Hash du contexte pour vérifier si on peut réutiliser
}

interface CachedContentRequest {
  model: string;
  systemInstruction?: {
    parts: { text: string }[];
  };
  contents: {
    role: string;
    parts: { text: string }[];
  }[];
  ttl: string; // Format: "3600s" pour 1h, "86400s" pour 24h
}

interface CachedContentResponse {
  name: string; // ex: "cachedContents/abc123"
  model: string;
  createTime: string;
  updateTime: string;
  expireTime: string;
  usageMetadata?: {
    totalTokenCount: number;
  };
}

const CACHE_STORAGE_KEY = 'gemini-cache-metadata';

class GeminiContextCache {
  private apiKey: string | null = null;
  private caches: Map<string, CacheEntry> = new Map();

  constructor() {
    this.loadCachesFromStorage();
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || null;
  }

  /**
   * Charger les métadonnées des caches depuis localStorage
   */
  private loadCachesFromStorage(): void {
    try {
      const stored = localStorage.getItem(CACHE_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Record<string, CacheEntry>;
        this.caches = new Map(Object.entries(data));
        console.log(`📦 ${this.caches.size} caches contextuels chargés`);
      }
    } catch (error) {
      console.error('Erreur chargement métadonnées cache:', error);
    }
  }

  /**
   * Sauvegarder les métadonnées des caches dans localStorage
   */
  private saveCachesToStorage(): void {
    try {
      const data = Object.fromEntries(this.caches);
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erreur sauvegarde métadonnées cache:', error);
    }
  }

  /**
   * Générer un hash simple du contexte pour identifier les caches
   */
  private hashContext(context: string): string {
    let hash = 0;
    for (let i = 0; i < context.length; i++) {
      const char = context.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Créer un nouveau cache avec l'API Gemini
   */
  private async createCache(
    cacheKey: string,
    contextContent: string,
    systemPrompt: string,
    ttlSeconds: number = 86400 // 24h par défaut
  ): Promise<string | null> {
    if (!this.apiKey) {
      console.warn('⚠️ Pas de clé API Gemini, cache désactivé');
      return null;
    }

    try {
      const requestBody: CachedContentRequest = {
        model: 'models/gemini-2.0-flash-exp',
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: contextContent }],
          },
        ],
        ttl: `${ttlSeconds}s`,
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Erreur création cache:', error);
        return null;
      }

      const data: CachedContentResponse = await response.json();

      // Stocker les métadonnées
      const contextHash = this.hashContext(contextContent);
      const cacheEntry: CacheEntry = {
        name: data.name,
        timestamp: Date.now(),
        expiresAt: new Date(data.expireTime).getTime(),
        contextHash,
      };

      this.caches.set(cacheKey, cacheEntry);
      this.saveCachesToStorage();

      console.log(
        `✅ Cache créé: ${data.name}\n` +
        `   Tokens cachés: ${data.usageMetadata?.totalTokenCount || 'N/A'}\n` +
        `   Expire: ${data.expireTime}\n` +
        `   💰 Économie: 90% sur les inputs répétitifs ($0.03/M vs $0.30/M)`
      );

      return data.name;
    } catch (error) {
      console.error('❌ Erreur création cache:', error);
      return null;
    }
  }

  /**
   * Obtenir ou créer un cache pour un contexte donné
   */
  async getCacheOrCreate(
    cacheKey: string,
    contextContent: string,
    systemPrompt: string,
    ttlSeconds: number = 86400
  ): Promise<string | null> {
    const now = Date.now();
    const cached = this.caches.get(cacheKey);
    const contextHash = this.hashContext(contextContent);

    // Vérifier si on a un cache valide
    if (cached && cached.expiresAt > now && cached.contextHash === contextHash) {
      console.log(`♻️ Réutilisation du cache: ${cached.name} (économie ~90%)`);
      return cached.name;
    }

    // Nettoyer le vieux cache s'il existe
    if (cached) {
      console.log(`🗑️ Cache expiré ou contexte modifié, création d'un nouveau...`);
      await this.deleteCache(cached.name);
    }

    // Créer un nouveau cache
    return await this.createCache(cacheKey, contextContent, systemPrompt, ttlSeconds);
  }

  /**
   * Supprimer un cache via l'API
   */
  private async deleteCache(cacheName: string): Promise<void> {
    if (!this.apiKey) return;

    try {
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${cacheName}?key=${this.apiKey}`,
        {
          method: 'DELETE',
        }
      );
      console.log(`🗑️ Cache supprimé: ${cacheName}`);
    } catch (error) {
      console.error('Erreur suppression cache:', error);
    }
  }

  /**
   * Nettoyer tous les caches expirés
   */
  async cleanExpiredCaches(): Promise<void> {
    const now = Date.now();
    const expired: string[] = [];

    for (const [key, cache] of this.caches.entries()) {
      if (cache.expiresAt <= now) {
        expired.push(key);
        await this.deleteCache(cache.name);
      }
    }

    for (const key of expired) {
      this.caches.delete(key);
    }

    if (expired.length > 0) {
      this.saveCachesToStorage();
      console.log(`🧹 ${expired.length} caches expirés nettoyés`);
    }
  }

  /**
   * Obtenir les stats des caches
   */
  getStats(): {
    total: number;
    active: number;
    expired: number;
  } {
    const now = Date.now();
    let active = 0;
    let expired = 0;

    for (const cache of this.caches.values()) {
      if (cache.expiresAt > now) {
        active++;
      } else {
        expired++;
      }
    }

    return {
      total: this.caches.size,
      active,
      expired,
    };
  }

  /**
   * Réinitialiser tous les caches (pour debug)
   */
  async clearAll(): Promise<void> {
    for (const cache of this.caches.values()) {
      await this.deleteCache(cache.name);
    }
    this.caches.clear();
    localStorage.removeItem(CACHE_STORAGE_KEY);
    console.log('🗑️ Tous les caches ont été effacés');
  }
}

// Export singleton
export const geminiContextCache = new GeminiContextCache();

// Exposer dans window pour debug
if (typeof window !== 'undefined') {
  (window as any).geminiContextCache = geminiContextCache;
  console.log(
    '%c💰 Context Caching activé: 90% d\'économie sur les inputs répét itifs !',
    'color: #10B981; font-weight: bold;'
  );
}
