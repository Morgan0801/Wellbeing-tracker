import { useEffect, useState, useRef } from 'react';
import { useAI } from '@/hooks/useAI';
import { Sparkles, X, Lightbulb, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIMoodSupportCardProps {
  score: number;
  emotions: string[];
  show: boolean;
}

export function AIMoodSupportCard({ score, emotions, show }: AIMoodSupportCardProps) {
  const ai = useAI();
  const [dismissed, setDismissed] = useState(false);
  const [support, setSupport] = useState<{ strategies: string[]; reflection: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Déclencher automatiquement si score < 5 et pas encore dismissé (UNE SEULE FOIS)
    if (show && score < 5 && !dismissed && ai.isConfigured && !support && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      setIsLoading(true);
      ai.generateMoodSupport({ score, emotions })
        .then((result) => {
          setSupport(result);
        })
        .catch((error) => {
          console.error('Erreur génération support mood:', error);
          hasLoadedRef.current = false; // Permettre réessai
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [show, score, dismissed, support]); // Retirer emotions, ai.isConfigured pour éviter boucles

  // Ne pas afficher si:
  // - score >= 5
  // - dismissé
  // - IA non configurée
  // - pas encore montré
  if (!show || score >= 5 || dismissed || !ai.isConfigured) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, marginTop: 0 }}
        animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
        exit={{ opacity: 0, height: 0, marginTop: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />

            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Soutien personnalisé
                </span>
                <button
                  onClick={() => setDismissed(true)}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
                  title="Fermer"
                >
                  <X className="w-4 h-4 text-blue-500" />
                </button>
              </div>

              {/* Chargement */}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Génération de suggestions personnalisées...</span>
                </div>
              )}

              {/* Contenu */}
              {!isLoading && support && (
                <>
                  {/* Stratégies */}
                  <div className="space-y-2">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Essaie ça maintenant:
                    </p>
                    {support.strategies.map((strategy, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300"
                      >
                        <span className="text-blue-500 font-medium flex-shrink-0 mt-0.5">
                          {idx + 1}.
                        </span>
                        <span className="leading-relaxed">{strategy}</span>
                      </div>
                    ))}
                  </div>

                  {/* Question de réflexion */}
                  <div className="pt-2 border-t border-blue-200 dark:border-blue-700 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-600 dark:text-blue-400 italic leading-relaxed">
                      {support.reflection}
                    </p>
                  </div>
                </>
              )}

              {/* Message si erreur */}
              {!isLoading && !support && (
                <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                  Impossible de générer des suggestions pour le moment. Prends quelques respirations profondes et n'hésite pas à parler à quelqu'un de confiance. 💙
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
