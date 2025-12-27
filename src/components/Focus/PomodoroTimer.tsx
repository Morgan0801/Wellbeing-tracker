import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Timer, Coffee, Brain, Play, Pause, RotateCcw, Settings, Check, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CoffeeCupAnimation } from './CoffeeCupAnimation';
import { CompactTagSelector } from './CompactTagSelector';
import { CompactEnergySelector } from './CompactEnergySelector';
import { PostSessionModal } from './PostSessionModal';
import { DistractionTracker } from './DistractionTracker';
import { useFocusEnhanced } from '@/hooks/useFocusEnhanced';
import { cn } from '@/lib/utils';
import { SessionType, DistractionType } from '@/types';

type TimerMode = 'pomodoro' | 'short_break' | 'long_break';

const DEFAULT_TIMER_CONFIGS = {
  pomodoro: { duration: 25, label: 'Focus', color: 'focus', gradient: 'from-focus to-focus-light', icon: Timer },
  short_break: { duration: 5, label: 'Pause courte', color: 'vitality', gradient: 'from-vitality to-vitality-light', icon: Coffee },
  long_break: { duration: 15, label: 'Pause longue', color: 'sleep', gradient: 'from-sleep to-sleep-light', icon: Brain },
};

interface PomodoroTimerProps {
  onSessionComplete?: (sessionId: string) => void;
}

export function PomodoroTimer({ onSessionComplete }: PomodoroTimerProps) {
  // Charger les durées personnalisées depuis localStorage
  const [customDurations, setCustomDurations] = useState(() => {
    const saved = localStorage.getItem('pomodoro-durations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          pomodoro: 25,
          short_break: 5,
          long_break: 15,
        };
      }
    }
    return {
      pomodoro: 25,
      short_break: 5,
      long_break: 15,
    };
  });

  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeRemaining, setTimeRemaining] = useState(customDurations[mode] * 60);
  const [sessionStartDuration, setSessionStartDuration] = useState(customDurations[mode] * 60); // Durée au début de la session
  const [isRunning, setIsRunning] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showDurationEdit, setShowDurationEdit] = useState(false); // Fermé par défaut
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // Tags sélectionnés
  const [objective, setObjective] = useState(''); // Objectif de la session
  const [preEnergyLevel, setPreEnergyLevel] = useState<number | undefined>(); // Niveau d'énergie pré-session
  const [distractionsCount, setDistractionsCount] = useState(0); // Compteur de distractions
  const [showPostSessionModal, setShowPostSessionModal] = useState(false); // Modal post-session uniquement

  const startTimeRef = useRef<number | null>(null);
  const durationRef = useRef<number>(customDurations[mode] * 60);

  const { startSession, completeSession, incrementDistractions } = useFocusEnhanced();

  const config = {
    ...DEFAULT_TIMER_CONFIGS[mode],
    duration: customDurations[mode] * 60, // en secondes
  };

  // Calculer le pourcentage de remplissage de la tasse
  // Pour pomodoro : 100% au début (pleine) -> 0% à la fin (vide)
  // Pour breaks : 0% au début (vide) -> 100% à la fin (pleine)
  const fillPercent = mode === 'pomodoro'
    ? (timeRemaining / sessionStartDuration) * 100  // Décroissant
    : ((sessionStartDuration - timeRemaining) / sessionStartDuration) * 100;  // Croissant

  // Debug logs
  console.log('🔍 DEBUG Timer:', {
    mode,
    timeRemaining,
    sessionStartDuration,
    fillPercent: fillPercent.toFixed(1),
    configDuration: config.duration,
    customDurationMinutes: customDurations[mode],
    isRunning,
    hasSession: !!currentSessionId
  });

  // Ref pour savoir si la session vient de se terminer naturellement
  const sessionEndedNaturallyRef = useRef(false);

  // Timer principal avec précision améliorée (timestamp comparison)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeRemaining > 0) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        durationRef.current = timeRemaining;
      }

      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
        const remaining = durationRef.current - elapsed;

        if (remaining <= 0) {
          setTimeRemaining(0);
          // Marquer que la session s'est terminée naturellement
          sessionEndedNaturallyRef.current = true;
          setIsRunning(false);
        } else {
          setTimeRemaining(remaining);
        }
      }, 100); // Vérifier toutes les 100ms pour plus de fluidité
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining]);

  // Gestion de la fin de session - déclenché quand isRunning passe à false avec timeRemaining à 0
  useEffect(() => {
    if (timeRemaining === 0 && !isRunning && sessionEndedNaturallyRef.current && currentSessionId) {
      sessionEndedNaturallyRef.current = false; // Réinitialiser le flag
      handleSessionEnd();
    }
  }, [timeRemaining, isRunning, currentSessionId]);

  const handleSessionEnd = async () => {
    if (currentSessionId && mode === 'pomodoro') {
      // Afficher le modal post-session pour les sessions pomodoro
      setShowPostSessionModal(true);
    } else if (currentSessionId) {
      // Pour les breaks, terminer directement
      completeSession.mutate({
        id: currentSessionId,
        completed: true,
        actualDurationMinutes: customDurations[mode],
      });

      onSessionComplete?.(currentSessionId);
      setCurrentSessionId(null);
    }

    // Notification sonore
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    } catch {}

    // Notification navigateur
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Session terminée !', {
        body: mode === 'pomodoro' ? 'Bravo ! Prends une pause.' : "C'est reparti !",
        icon: '/favicon.ico',
      });
    }
  };

  const handleModeChange = useCallback((newMode: TimerMode) => {
    if (isRunning && currentSessionId) {
      completeSession.mutate({ id: currentSessionId, completed: false });
    }

    const newDuration = customDurations[newMode] * 60;
    setMode(newMode);
    setTimeRemaining(newDuration);
    setSessionStartDuration(newDuration); // Mettre à jour la durée de départ
    setIsRunning(false);
    setCurrentSessionId(null);
    startTimeRef.current = null;
    durationRef.current = newDuration;
  }, [isRunning, currentSessionId, customDurations, completeSession]);

  const handleToggle = async () => {
    if (!isRunning && !currentSessionId) {
      // Démarrer une nouvelle session directement avec les inputs actuels
      // IMPORTANT: Capturer la durée AVANT de démarrer la session UNIQUEMENT à la création
      const initialDuration = timeRemaining;
      setSessionStartDuration(initialDuration);

      const session = await startSession.mutateAsync({
        durationMinutes: customDurations[mode],
        sessionType: mode as SessionType,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        objective: objective.trim() || undefined,
        preEnergyLevel: preEnergyLevel || undefined,
      });
      setCurrentSessionId(session.id);
      setDistractionsCount(0);
    }
    // IMPORTANT: Ne PAS re-capturer sessionStartDuration après une pause !

    if (!isRunning) {
      // Réinitialiser les refs pour le nouveau démarrage
      startTimeRef.current = null;
      durationRef.current = timeRemaining;
    }

    setIsRunning(!isRunning);
  };

  const handlePostSessionSubmit = (data: { postFocusQuality?: number; sessionMood?: string; notes?: string }) => {
    if (currentSessionId) {
      completeSession.mutate({
        id: currentSessionId,
        completed: true,
        actualDurationMinutes: customDurations[mode],
        postFocusQuality: data.postFocusQuality,
        distractionsCount,
        sessionMood: data.sessionMood,
        notes: data.notes,
      });

      onSessionComplete?.(currentSessionId);
      setCurrentSessionId(null);
      setObjective('');
      setPreEnergyLevel(undefined);
      setDistractionsCount(0);
    }
    setShowPostSessionModal(false);
  };

  const handleAddDistraction = (_type: DistractionType) => {
    if (currentSessionId) {
      setDistractionsCount(prev => prev + 1);
      incrementDistractions.mutate(currentSessionId);
    }
  };

  const handleDone = async () => {
    if (!currentSessionId) return;

    // Calculer la durée réelle écoulée
    const elapsed = Math.ceil((config.duration - timeRemaining) / 60);

    // Arrêter le timer
    setIsRunning(false);
    setTimeRemaining(config.duration);
    startTimeRef.current = null;
    durationRef.current = config.duration;

    // Si mode pomodoro, afficher le modal post-session
    if (mode === 'pomodoro') {
      setShowPostSessionModal(true);
    } else {
      completeSession.mutate({
        id: currentSessionId,
        completed: true,
        actualDurationMinutes: elapsed > 0 ? elapsed : 1,
      });

      onSessionComplete?.(currentSessionId);
      setCurrentSessionId(null);
    }
  };

  const handleReset = () => {
    if (currentSessionId) {
      completeSession.mutate({ id: currentSessionId, completed: false });
      setCurrentSessionId(null);
    }

    setTimeRemaining(config.duration);
    setSessionStartDuration(config.duration); // Réinitialiser la durée de départ
    setIsRunning(false);
    startTimeRef.current = null;
    durationRef.current = config.duration;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardContent className="py-4 px-4">
        {/* Inputs compacts EN HAUT - uniquement pour mode pomodoro et si pas de session en cours */}
        {!isRunning && mode === 'pomodoro' && (
          <div className="mb-4 pb-4 border-b border-border space-y-2.5">
            {/* Objectif */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-muted-foreground" />
                <label className="text-xs font-medium text-muted-foreground">Objectif</label>
              </div>
              <Input
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Que veux-tu accomplir ?"
                maxLength={200}
                className="h-8 text-sm"
              />
            </div>

            {/* Énergie */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                <label className="text-xs font-medium text-muted-foreground">Énergie</label>
              </div>
              <CompactEnergySelector value={preEnergyLevel} onChange={setPreEnergyLevel} />
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags</label>
              <CompactTagSelector value={selectedTags} onChange={setSelectedTags} />
            </div>
          </div>
        )}

        {/* Mode selector pills */}
        <div className="flex gap-1.5 flex-wrap justify-center mb-3">
          {(Object.keys(DEFAULT_TIMER_CONFIGS) as TimerMode[]).map((m) => {
            const ModeIcon = DEFAULT_TIMER_CONFIGS[m].icon;
            return (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                disabled={isRunning}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                  mode === m
                    ? "bg-gradient-to-r from-focus to-focus-light text-white shadow-soft-md"
                    : "bg-muted/10 text-muted-foreground hover:bg-muted/20 border border-transparent",
                  isRunning && "opacity-50 cursor-not-allowed"
                )}
              >
                <ModeIcon className="w-3.5 h-3.5" />
                {DEFAULT_TIMER_CONFIGS[m].label}
              </button>
            );
          })}
        </div>

        {/* Time Display (au-dessus de la tasse) */}
        <div className="text-center mb-1">
          <motion.span
            key={timeRemaining}
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl lg:text-4xl font-mono font-bold tracking-tight text-foreground block"
          >
            {formatTime(timeRemaining)}
          </motion.span>
          <span
            className={cn(
              "text-xs mt-0.5 uppercase tracking-widest font-medium block",
              isRunning ? `text-${config.color}` : "text-muted-foreground"
            )}
          >
            {isRunning ? 'En cours' : 'En pause'}
          </span>
        </div>

        {/* Coffee Cup Animation (sans overlay de texte) */}
        <div className="relative mb-3">
          <CoffeeCupAnimation
            fillPercent={fillPercent}
            mode={mode === 'pomodoro' ? 'draining' : 'filling'}
            isAnimating={isRunning}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {/* Reset Button */}
          <Button
            size="icon"
            variant="outline"
            onClick={handleReset}
            disabled={!currentSessionId && timeRemaining === config.duration}
            className="h-9 w-9 rounded-full"
            title="Réinitialiser"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          {/* Play/Pause Button */}
          <Button
            className={cn(
              "h-10 px-6 rounded-full font-semibold shadow-soft-md text-white text-sm",
              isRunning
                ? "bg-productivity hover:bg-productivity/90"
                : `bg-gradient-to-r ${config.gradient}`
            )}
            onClick={handleToggle}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-1.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1.5" />
                Démarrer
              </>
            )}
          </Button>

          {/* Done Button (visible uniquement pendant une session) */}
          {currentSessionId && mode === 'pomodoro' && (
            <Button
              size="icon"
              variant="outline"
              onClick={handleDone}
              className="h-9 w-9 rounded-full bg-green-500/10 border-green-500 hover:bg-green-500/20"
              title="Terminer maintenant"
            >
              <Check className="w-4 h-4 text-green-600" />
            </Button>
          )}

          {/* Settings Button */}
          <Button
            size="icon"
            variant="outline"
            onClick={() => setShowDurationEdit(!showDurationEdit)}
            disabled={isRunning}
            className={cn(
              "h-9 w-9 rounded-full",
              isRunning && "opacity-50 cursor-not-allowed"
            )}
            title="Personnaliser les durées"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Afficher l'objectif pendant la session */}
        {isRunning && objective && mode === 'pomodoro' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-focus/10 rounded-lg p-2 mt-3 text-center border-l-2 border-focus"
          >
            <p className="text-xs font-medium text-focus">{objective}</p>
          </motion.div>
        )}

        {/* Duration Edit Panel (collapsible) */}
        {showDurationEdit && !isRunning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border"
          >
            <h4 className="text-xs font-semibold mb-3 text-center text-muted-foreground uppercase tracking-wide">
              Durées personnalisées
            </h4>
            <div className="space-y-2">
              {(Object.keys(customDurations) as TimerMode[]).map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">
                    {DEFAULT_TIMER_CONFIGS[key].label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={customDurations[key]}
                      onChange={(e) => {
                        const newValue = Math.max(1, Math.min(120, parseInt(e.target.value) || 1));
                        const newDurations = {
                          ...customDurations,
                          [key]: newValue,
                        };
                        setCustomDurations(newDurations);
                        localStorage.setItem('pomodoro-durations', JSON.stringify(newDurations));

                        // Mettre à jour le timer si c'est le mode actuel
                        if (key === mode) {
                          const newDurationSeconds = newValue * 60;
                          setTimeRemaining(newDurationSeconds);
                          setSessionStartDuration(newDurationSeconds); // Mettre à jour la durée de départ
                          durationRef.current = newDurationSeconds;
                        }
                      }}
                      className="w-16 px-2 py-1 text-sm border border-border rounded-lg text-center bg-background"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </CardContent>

      {/* Modal post-session uniquement */}
      <PostSessionModal
        open={showPostSessionModal}
        objective={objective}
        duration={customDurations[mode]}
        distractionsCount={distractionsCount}
        onClose={() => setShowPostSessionModal(false)}
        onSubmit={handlePostSessionSubmit}
      />

      {/* Distraction Tracker */}
      <DistractionTracker
        count={distractionsCount}
        onAddDistraction={handleAddDistraction}
        isVisible={isRunning && mode === 'pomodoro'}
      />
    </Card>
  );
}
