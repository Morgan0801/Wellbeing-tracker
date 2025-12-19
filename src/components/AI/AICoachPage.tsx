import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Brain,
  MessageCircle,
  Calendar,
  Search,
  Target,
  FileText,
  Mic,
  MicOff,
  Send,
  RefreshCw,
  Download,
  AlertCircle,
  Loader2,
  TrendingUp,
  Heart,
  Zap,
} from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

type TabType = 'chat' | 'correlations' | 'summaries' | 'notes' | 'search' | 'affirmation' | 'habits' | 'export';

export function AICoachPage() {
  const ai = useAI();
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryPeriod, setSummaryPeriod] = useState<'week' | 'month'>('week');
  const [exportPeriod, setExportPeriod] = useState<'week' | 'month' | '3months'>('week');

  // Vérifier si l'API est configurée
  if (!ai.isConfigured) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                Configuration requise
              </h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm mb-4">
                Pour utiliser le Coach IA, tu dois configurer ta clé API Gemini.
              </p>
              <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-2 list-decimal list-inside">
                <li>Va sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google AI Studio</a></li>
                <li>Crée une clé API gratuite</li>
                <li>Ajoute-la dans le fichier <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">.env</code></li>
                <li>Remplace <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">YOUR_GEMINI_API_KEY_HERE</code> par ta clé</li>
                <li>Redémarre l'application</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || ai.isAskingQuestion) return;
    const question = chatInput;
    setChatInput('');
    await ai.askQuestion(question);
  };

  const handleVoiceInput = async () => {
    if (ai.isListening) {
      ai.stopListening();
      if (ai.transcript) {
        const result = await ai.processVoiceInput(ai.transcript);
        if (result.type === 'question') {
          await ai.askQuestion(ai.transcript);
        }
      }
    } else {
      ai.startListening();
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || ai.isSearching) return;
    await ai.semanticSearch(searchQuery);
  };

  const handleExport = async () => {
    const content = await ai.generateNarrativeExport(exportPeriod);
    if (content) {
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wellbeing-report-${exportPeriod}-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'Chat', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'correlations', label: 'Corrélations', icon: <Brain className="w-4 h-4" /> },
    { id: 'summaries', label: 'Résumés', icon: <Calendar className="w-4 h-4" /> },
    { id: 'notes', label: 'Analyse Notes', icon: <FileText className="w-4 h-4" /> },
    { id: 'search', label: 'Recherche', icon: <Search className="w-4 h-4" /> },
    { id: 'affirmation', label: 'Affirmation', icon: <Heart className="w-4 h-4" /> },
    { id: 'habits', label: 'Habitudes', icon: <Target className="w-4 h-4" /> },
    { id: 'export', label: 'Export', icon: <Download className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Coach IA
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ton assistant personnel propulsé par Gemini
            </p>
          </div>
        </div>
      </div>

      {/* Affirmation du jour - toujours visible */}
      {ai.dailyAffirmation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-200 dark:border-violet-800"
        >
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-violet-700 dark:text-violet-300 mb-1">
                Affirmation du jour
              </p>
              <p className="text-violet-900 dark:text-violet-100 italic">
                "{ai.dailyAffirmation}"
              </p>
            </div>
            <button
              onClick={() => ai.refreshAffirmation()}
              className="ml-auto p-1.5 hover:bg-violet-100 dark:hover:bg-violet-800 rounded-lg transition-colors"
              title="Nouvelle affirmation"
            >
              <RefreshCw className="w-4 h-4 text-violet-500" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2 scrollbar-thin">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              activeTab === tab.id
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {ai.error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 dark:text-red-300 text-sm">{ai.error}</p>
              <button
                onClick={ai.clearError}
                className="ml-auto text-red-500 hover:text-red-700 text-sm"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[500px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {ai.conversationHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-center">
                    Pose-moi une question sur tes données !
                  </p>
                  <p className="text-sm text-center mt-2 max-w-md">
                    Par exemple : "Quel jour de la semaine suis-je le plus productif ?"
                    ou "Comment mon sommeil affecte mon humeur ?"
                  </p>
                </div>
              ) : (
                ai.conversationHistory.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3',
                        msg.role === 'user'
                          ? 'bg-violet-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      )}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              {ai.isAskingQuestion && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Voice Transcript */}
            {ai.isListening && (
              <div className="px-4 py-2 bg-violet-50 dark:bg-violet-900/20 border-t border-violet-200 dark:border-violet-800">
                <p className="text-sm text-violet-600 dark:text-violet-400">
                  {ai.transcript || 'Écoute en cours...'}
                </p>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex gap-2">
                {ai.isVoiceSupported && (
                  <button
                    onClick={handleVoiceInput}
                    disabled={ai.isProcessingVoice}
                    className={cn(
                      'p-3 rounded-xl transition-all',
                      ai.isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    {ai.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Pose une question sur tes données..."
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || ai.isAskingQuestion}
                  className="p-3 bg-violet-500 text-white rounded-xl hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              {ai.conversationHistory.length > 0 && (
                <button
                  onClick={ai.clearConversation}
                  className="mt-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Effacer la conversation
                </button>
              )}
            </div>
          </div>
        )}

        {/* Correlations Tab */}
        {activeTab === 'correlations' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Découverte de Corrélations
                </h3>
                <p className="text-sm text-gray-500">
                  Analyse des 30 derniers jours pour trouver des patterns cachés
                </p>
              </div>
              <button
                onClick={() => ai.analyzeCorrelations()}
                disabled={ai.isAnalyzingCorrelations}
                className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 transition-colors"
              >
                {ai.isAnalyzingCorrelations ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                Analyser
              </button>
            </div>

            {ai.correlationsResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4"
              >
                <ReactMarkdown>{ai.correlationsResult}</ReactMarkdown>
              </motion.div>
            )}

            {!ai.correlationsResult && !ai.isAnalyzingCorrelations && (
              <div className="text-center py-12 text-gray-400">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Clique sur "Analyser" pour découvrir des corrélations dans tes données</p>
              </div>
            )}
          </div>
        )}

        {/* Summaries Tab */}
        {activeTab === 'summaries' && (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setSummaryPeriod('week')}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    summaryPeriod === 'week'
                      ? 'bg-white dark:bg-gray-700 shadow text-violet-600 dark:text-violet-400'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  Hebdomadaire
                </button>
                <button
                  onClick={() => setSummaryPeriod('month')}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    summaryPeriod === 'month'
                      ? 'bg-white dark:bg-gray-700 shadow text-violet-600 dark:text-violet-400'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  Mensuel
                </button>
              </div>
              <button
                onClick={() => summaryPeriod === 'week' ? ai.generateWeeklySummary() : ai.generateMonthlySummary()}
                disabled={ai.isGeneratingWeeklySummary || ai.isGeneratingMonthlySummary}
                className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 transition-colors"
              >
                {(ai.isGeneratingWeeklySummary || ai.isGeneratingMonthlySummary) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                Générer
              </button>
            </div>

            {(summaryPeriod === 'week' ? ai.weeklySummary : ai.monthlySummary) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4"
              >
                <ReactMarkdown>
                  {summaryPeriod === 'week' ? ai.weeklySummary! : ai.monthlySummary!}
                </ReactMarkdown>
              </motion.div>
            )}

            {!(summaryPeriod === 'week' ? ai.weeklySummary : ai.monthlySummary) &&
             !(ai.isGeneratingWeeklySummary || ai.isGeneratingMonthlySummary) && (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Génère un résumé pour voir ton bilan</p>
              </div>
            )}
          </div>
        )}

        {/* Notes Analysis Tab */}
        {activeTab === 'notes' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Analyse de tes Notes & Gratitudes
                </h3>
                <p className="text-sm text-gray-500">
                  Découvre les thèmes et émotions dans tes écrits
                </p>
              </div>
              <button
                onClick={() => ai.analyzeNotes()}
                disabled={ai.isAnalyzingNotes}
                className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 transition-colors"
              >
                {ai.isAnalyzingNotes ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Analyser
              </button>
            </div>

            {ai.notesAnalysis && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4"
              >
                <ReactMarkdown>{ai.notesAnalysis}</ReactMarkdown>
              </motion.div>
            )}

            {!ai.notesAnalysis && !ai.isAnalyzingNotes && (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Analyse tes notes de mood, gratitudes et sessions focus</p>
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Recherche Sémantique
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Recherche dans tes données avec des questions naturelles
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Ex: Quand me suis-je senti stressé par le travail ?"
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || ai.isSearching}
                  className="px-4 py-3 bg-violet-500 text-white rounded-xl hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {ai.isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {ai.searchResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4"
              >
                <ReactMarkdown>{ai.searchResults}</ReactMarkdown>
              </motion.div>
            )}

            {!ai.searchResults && !ai.isSearching && (
              <div className="text-center py-12 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Recherche dans les 90 derniers jours de données</p>
              </div>
            )}
          </div>
        )}

        {/* Affirmation Tab */}
        {activeTab === 'affirmation' && (
          <div className="p-6">
            <div className="text-center max-w-xl mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Ton Affirmation du Jour
              </h3>
              <p className="text-gray-500 mb-8">
                Personnalisée selon ton état émotionnel récent
              </p>

              {ai.dailyAffirmation ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 rounded-2xl border border-violet-200 dark:border-violet-800"
                >
                  <p className="text-xl text-violet-900 dark:text-violet-100 italic font-medium">
                    "{ai.dailyAffirmation}"
                  </p>
                </motion.div>
              ) : (
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
                </div>
              )}

              <button
                onClick={() => ai.refreshAffirmation()}
                className="mt-6 flex items-center gap-2 px-4 py-2 mx-auto text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Nouvelle affirmation
              </button>
            </div>
          </div>
        )}

        {/* Habits Tab */}
        {activeTab === 'habits' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Recommandations d'Habitudes
                </h3>
                <p className="text-sm text-gray-500">
                  Analyse de tes habitudes actuelles et suggestions d'optimisation
                </p>
              </div>
              <button
                onClick={() => ai.recommendHabits()}
                disabled={ai.isRecommendingHabits}
                className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 transition-colors"
              >
                {ai.isRecommendingHabits ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
                Analyser
              </button>
            </div>

            {ai.habitRecommendations && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4"
              >
                <ReactMarkdown>{ai.habitRecommendations}</ReactMarkdown>
              </motion.div>
            )}

            {!ai.habitRecommendations && !ai.isRecommendingHabits && (
              <div className="text-center py-12 text-gray-400">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Découvre quelles habitudes ajouter, modifier ou retirer</p>
              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="p-6">
            <div className="max-w-xl mx-auto text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Export Narratif
              </h3>
              <p className="text-gray-500 mb-8">
                Génère un rapport complet de ton bien-être au format Markdown
              </p>

              <div className="flex justify-center gap-2 mb-6">
                {(['week', 'month', '3months'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setExportPeriod(period)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      exportPeriod === period
                        ? 'bg-violet-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    {period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : '3 Mois'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExport}
                disabled={ai.isGeneratingExport}
                className="flex items-center gap-2 px-6 py-3 mx-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25"
              >
                {ai.isGeneratingExport ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                Télécharger le Rapport
              </button>

              {ai.narrativeExport && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 text-left prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 max-h-96 overflow-y-auto"
                >
                  <ReactMarkdown>{ai.narrativeExport}</ReactMarkdown>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
