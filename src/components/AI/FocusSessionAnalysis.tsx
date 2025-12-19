import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import ReactMarkdown from 'react-markdown';

interface FocusSessionAnalysisProps {
  session: {
    duration: number;
    tags: string[];
    objective?: string;
    preEnergy?: number;
    postQuality?: number;
    distractions?: number;
    mood?: string;
    notes?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  autoAnalyze?: boolean;
}

export function FocusSessionAnalysis({
  session,
  isOpen,
  onClose,
  autoAnalyze = true,
}: FocusSessionAnalysisProps) {
  const ai = useAI();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    if (isOpen && autoAnalyze && !hasAnalyzed && ai.isConfigured) {
      runAnalysis();
    }
  }, [isOpen, autoAnalyze, hasAnalyzed]);

  const runAnalysis = async () => {
    if (ai.isAnalyzingFocus) return;
    try {
      const result = await ai.analyzeFocusSession(session);
      setAnalysis(result);
      setHasAnalyzed(true);
    } catch (error) {
      console.error('Erreur analyse focus:', error);
    }
  };

  if (!isOpen) return null;

  // Si l'API n'est pas configurée, ne pas afficher le composant
  if (!ai.isConfigured) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="mt-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-200 dark:border-violet-800 overflow-hidden"
      >
        {/* Header */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-violet-100/50 dark:hover:bg-violet-800/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500 rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-violet-900 dark:text-violet-100">
                Analyse IA de ta session
              </h4>
              <p className="text-sm text-violet-600 dark:text-violet-400">
                Feedback personnalisé
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-violet-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-violet-500" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 hover:bg-violet-200 dark:hover:bg-violet-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-violet-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                {ai.isAnalyzingFocus ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500 mr-2" />
                    <span className="text-violet-600 dark:text-violet-400">
                      Analyse en cours...
                    </span>
                  </div>
                ) : analysis ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-violet-900 dark:prose-headings:text-violet-100 prose-p:text-violet-800 dark:prose-p:text-violet-200">
                    <ReactMarkdown>{analysis}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-violet-600 dark:text-violet-400 mb-4">
                      Obtiens un feedback personnalisé sur ta session
                    </p>
                    <button
                      onClick={runAnalysis}
                      className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
                    >
                      Analyser ma session
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

// Composant simplifié pour affichage inline
export function FocusSessionAnalysisInline({
  session,
}: {
  session: {
    duration: number;
    tags: string[];
    objective?: string;
    preEnergy?: number;
    postQuality?: number;
    distractions?: number;
    mood?: string;
    notes?: string;
  };
}) {
  const ai = useAI();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleAnalyze = async () => {
    if (isLoading || !ai.isConfigured) return;
    setIsLoading(true);
    setShowAnalysis(true);
    try {
      const result = await ai.analyzeFocusSession(session);
      setAnalysis(result);
    } catch (error) {
      console.error('Erreur analyse focus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!ai.isConfigured) return null;

  return (
    <div className="mt-4">
      {!showAnalysis ? (
        <button
          onClick={handleAnalyze}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg hover:from-violet-600 hover:to-purple-600 transition-all shadow-lg shadow-violet-500/25"
        >
          <Sparkles className="w-4 h-4" />
          Obtenir un feedback IA
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-200 dark:border-violet-800 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="font-medium text-violet-900 dark:text-violet-100">
              Feedback IA
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-violet-500 mr-2" />
              <span className="text-violet-600 dark:text-violet-400 text-sm">
                Analyse en cours...
              </span>
            </div>
          ) : analysis ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          ) : null}
        </motion.div>
      )}
    </div>
  );
}
