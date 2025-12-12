import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Timer, Coffee, Brain, Play, Pause, RotateCcw, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CoffeeCupAnimation } from './CoffeeCupAnimation';
import { SessionTagSelectorInline } from './SessionTagSelectorInline';
import { useFocusEnhanced } from '@/hooks/useFocusEnhanced';
import { cn } from '@/lib/utils';
import { SessionType } from '@/types';

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
  const [isRunning, setIsRunning] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showDurationEdit, setShowDurationEdit] = useState(true); // Ouvert par défaut
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // Tags sélectionnés

  const startTimeRef = useRef<number | null>(null);
  const durationRef = useRef<number>(customDurations[mode] * 60);

  const { startSession, completeSession } = useFocusEnhanced();

  const config = {
    ...DEFAULT_TIMER_CONFIGS[mode],
    duration: customDurations[mode] * 60, // en secondes
  };

  // Calculer le pourcentage de remplissage de la tasse
  // Pour pomodoro : 100% au début (pleine) -> 0% à la fin (vide)
  // Pour breaks : 0% au début (vide) -> 100% à la fin (pleine)
  const fillPercent = mode === 'pomodoro'
    ? (timeRemaining / config.duration) * 100  // Décroissant
    : ((config.duration - timeRemaining) / config.duration) * 100;  // Croissant

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

  // Gestion de la fin de session
  useEffect(() => {
    if (timeRemaining === 0 && isRunning) {
      handleSessionEnd();
    }
  }, [timeRemaining, isRunning]);

  const handleSessionEnd = async () => {
    if (currentSessionId) {
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

    setMode(newMode);
    setTimeRemaining(customDurations[newMode] * 60);
    setIsRunning(false);
    setCurrentSessionId(null);
    startTimeRef.current = null;
    durationRef.current = customDurations[newMode] * 60;
  }, [isRunning, currentSessionId, customDurations, completeSession]);

  const handleToggle = async () => {
    if (!isRunning && !currentSessionId && mode === 'pomodoro') {
      // Démarrer une nouvelle session de travail
      const session = await startSession.mutateAsync({
        durationMinutes: customDurations[mode],
        sessionType: mode as SessionType,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
      setCurrentSessionId(session.id);
    }

    if (!isRunning) {
      // Réinitialiser les refs pour le nouveau démarrage
      startTimeRef.current = null;
      durationRef.current = timeRemaining;
    }

    setIsRunning(!isRunning);
  };

  const handleDone = async () => {
    if (!currentSessionId) return;

    // Calculer la durée réelle écoulée
    const elapsed = Math.ceil((config.duration - timeRemaining) / 60);

    completeSession.mutate({
      id: currentSessionId,
      completed: true,
      actualDurationMinutes: elapsed > 0 ? elapsed : 1,
    });

    onSessionComplete?.(currentSessionId);
    setCurrentSessionId(null);
    setTimeRemaining(config.duration);
    setIsRunning(false);
    startTimeRef.current = null;
    durationRef.current = config.duration;
  };

  const handleReset = () => {
    if (currentSessionId) {
      completeSession.mutate({ id: currentSessionId, completed: false });
      setCurrentSessionId(null);
    }

    setTimeRemaining(config.duration);
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
      <CardContent className="py-8 px-6">
        {/* Mode selector pills */}
        <div className="flex gap-2 flex-wrap justify-center mb-6">
          {(Object.keys(DEFAULT_TIMER_CONFIGS) as TimerMode[]).map((m) => {
            const ModeIcon = DEFAULT_TIMER_CONFIGS[m].icon;
            return (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                disabled={isRunning}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2",
                  mode === m
                    ? "bg-gradient-to-r from-focus to-focus-light text-white shadow-soft-md"
                    : "bg-muted/10 text-muted-foreground hover:bg-muted/20 border border-transparent",
                  isRunning && "opacity-50 cursor-not-allowed"
                )}
              >
                <ModeIcon className="w-4 h-4" />
                {DEFAULT_TIMER_CONFIGS[m].label}
              </button>
            );
          })}
        </div>

        {/* Time Display (au-dessus de la tasse) */}
        <div className="text-center mb-4">
          <motion.span
            key={timeRemaining}
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl lg:text-6xl font-mono font-bold tracking-tight text-foreground block"
          >
            {formatTime(timeRemaining)}
          </motion.span>
          <span
            className={cn(
              "text-xs mt-2 uppercase tracking-widest font-medium block",
              isRunning ? `text-${config.color}` : "text-muted-foreground"
            )}
          >
            {isRunning ? 'En cours' : 'En pause'}
          </span>
        </div>

        {/* Coffee Cup Animation (sans overlay de texte) */}
        <div className="relative mb-6">
          <CoffeeCupAnimation
            fillPercent={fillPercent}
            mode={mode === 'pomodoro' ? 'draining' : 'filling'}
            isAnimating={isRunning}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {/* Reset Button */}
          <Button
            size="icon"
            variant="outline"
            onClick={handleReset}
            disabled={!currentSessionId && timeRemaining === config.duration}
            className="h-12 w-12 rounded-full"
            title="Réinitialiser"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          {/* Play/Pause Button */}
          <Button
            className={cn(
              "h-14 px-10 rounded-full font-bold shadow-soft-lg text-white",
              isRunning
                ? "bg-productivity hover:bg-productivity/90"
                : `bg-gradient-to-r ${config.gradient}`
            )}
            onClick={handleToggle}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
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
              className="h-12 w-12 rounded-full bg-green-500/10 border-green-500 hover:bg-green-500/20"
              title="Terminer maintenant"
            >
              <Check className="w-5 h-5 text-green-600" />
            </Button>
          )}

          {/* Settings Button */}
          <Button
            size="icon"
            variant="outline"
            onClick={() => setShowDurationEdit(!showDurationEdit)}
            disabled={isRunning}
            className={cn(
              "h-12 w-12 rounded-full",
              isRunning && "opacity-50 cursor-not-allowed"
            )}
            title="Personnaliser les durées"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Tag Selector intégré */}
        <div className="pt-4 border-t border-border">
          <SessionTagSelectorInline value={selectedTags} onChange={setSelectedTags} />
        </div>

        {/* Duration Edit Panel (collapsible) */}
        {showDurationEdit && !isRunning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t border-border"
          >
            <h4 className="text-sm font-semibold mb-4 text-center">
              Personnaliser les durées
            </h4>
            <div className="space-y-3">
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
                          setTimeRemaining(newValue * 60);
                          durationRef.current = newValue * 60;
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
    </Card>
  );
}
