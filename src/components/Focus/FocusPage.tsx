import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Brain, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFocus } from '@/hooks/useFocus';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type TimerMode = 'pomodoro' | 'short_break' | 'long_break';

const TIMER_CONFIGS = {
    pomodoro: { duration: 25 * 60, label: 'Focus', color: 'from-rose-500 to-orange-500', emoji: '🎯' },
    short_break: { duration: 5 * 60, label: 'Pause courte', color: 'from-emerald-500 to-teal-500', emoji: '☕' },
    long_break: { duration: 15 * 60, label: 'Pause longue', color: 'from-blue-500 to-indigo-500', emoji: '🧘' },
};

export function FocusPage() {
    const [mode, setMode] = useState<TimerMode>('pomodoro');
    const [timeRemaining, setTimeRemaining] = useState(TIMER_CONFIGS[mode].duration);
    const [isRunning, setIsRunning] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    const { startSession, completeSession, todayStats, weekStats } = useFocus();

    const config = TIMER_CONFIGS[mode];
    const progress = ((config.duration - timeRemaining) / config.duration) * 100;

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isRunning && timeRemaining > 0) {
            interval = setInterval(() => setTimeRemaining((prev) => prev - 1), 1000);
        } else if (timeRemaining === 0 && isRunning) {
            setIsRunning(false);
            if (currentSessionId) {
                completeSession.mutate({ id: currentSessionId, completed: true });
                setCurrentSessionId(null);
            }
            try { new Audio('/notification.mp3').play().catch(() => { }); } catch { }
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⏰ Session terminée !', { body: mode === 'pomodoro' ? 'Bravo ! Prends une pause.' : 'C\'est reparti !', icon: '/favicon.ico' });
            }
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isRunning, timeRemaining, currentSessionId, mode, completeSession]);

    const handleModeChange = useCallback((newMode: TimerMode) => {
        if (isRunning && currentSessionId) completeSession.mutate({ id: currentSessionId, completed: false });
        setMode(newMode);
        setTimeRemaining(TIMER_CONFIGS[newMode].duration);
        setIsRunning(false);
        setCurrentSessionId(null);
    }, [isRunning, currentSessionId, completeSession]);

    const handleToggle = async () => {
        if (!isRunning && !currentSessionId) {
            const session = await startSession.mutateAsync({ durationMinutes: Math.floor(config.duration / 60), sessionType: mode });
            setCurrentSessionId(session.id);
        }
        setIsRunning(!isRunning);
    };

    const handleReset = () => {
        if (currentSessionId) completeSession.mutate({ id: currentSessionId, completed: false });
        setTimeRemaining(config.duration);
        setIsRunning(false);
        setCurrentSessionId(null);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="container mx-auto p-3 max-w-5xl space-y-4">
            {/* Header Compact */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('bg-gradient-to-r rounded-xl p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4', config.color)}>
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2"><Timer className="w-5 h-5" /> Mode Focus {config.emoji}</h2>
                    <p className="text-xs opacity-90">{format(new Date(), 'EEEE d MMMM', { locale: fr })}</p>
                </div>
                <div className="flex gap-2 flex-wrap sm:justify-end">
                    {(Object.keys(TIMER_CONFIGS) as TimerMode[]).map((m) => (
                        <button key={m} onClick={() => handleModeChange(m)} className={cn("px-3 py-1.5 rounded-lg text-xs uppercase font-bold transition-all border border-white/20", mode === m ? "bg-white/30 text-white" : "hover:bg-white/10 text-white/70")}>
                            {TIMER_CONFIGS[m].label}
                        </button>
                    ))}
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Timer Column */}
                <Card className="flex flex-col items-center justify-center py-6 shadow-sm">
                    <div className="relative w-48 h-48 lg:w-56 lg:h-56">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="50%" cy="50%" r="45%" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-800" />
                            <motion.circle cx="50%" cy="50%" r="45%" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 45}%`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}%`} strokeLinecap="round"
                                className={cn(mode === 'pomodoro' && 'text-rose-500', mode === 'short_break' && 'text-emerald-500', mode === 'long_break' && 'text-blue-500')}
                                initial={false} animate={{ strokeDashoffset: `${2 * Math.PI * 45 * (1 - progress / 100)}%` }} transition={{ duration: 0.5 }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span key={timeRemaining} initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl lg:text-5xl font-mono font-bold tracking-tighter">
                                {formatTime(timeRemaining)}
                            </motion.span>
                            <span className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">{isRunning ? 'En cours' : 'Pause'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6">
                        <Button size="icon" variant="outline" onClick={handleReset} disabled={!currentSessionId && timeRemaining === config.duration} className="h-10 w-10 rounded-full">
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                        <motion.div whileTap={{ scale: 0.95 }}>
                            <Button className={cn('h-10 px-8 rounded-full font-bold shadow-lg', isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gradient-to-r ' + config.color)} onClick={handleToggle}>
                                {isRunning ? <><Pause className="w-4 h-4 mr-2" /> Pause</> : <><Play className="w-4 h-4 mr-2" /> Start</>}
                            </Button>
                        </motion.div>
                    </div>
                </Card>

                {/* Right Column: Stats & Tips */}
                <div className="space-y-4 flex flex-col h-full">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 flex-1">
                        {[
                            { val: todayStats.sessionsCompleted, label: 'Sessions Auj', color: 'text-rose-500' },
                            { val: todayStats.minutesFocused, label: 'Minutes Auj', color: 'text-emerald-500' },
                            { val: weekStats.sessionsCompleted, label: 'Sessions Sem', color: 'text-blue-500' },
                            { val: `${Math.round(weekStats.minutesFocused / 60)}h`, label: 'Heures Sem', color: 'text-purple-500' }
                        ].map((s, i) => (
                            <Card key={i} className="shadow-sm border-slate-100 dark:border-slate-800 flex items-center justify-center">
                                <CardContent className="p-4 text-center">
                                    <div className={cn("text-2xl font-bold", s.color)}>{s.val}</div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{s.label}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Tip Compact */}
                    <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/50 shadow-none">
                        <CardContent className="p-4 flex items-start gap-3">
                            <Brain className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-amber-900 dark:text-amber-300 leading-relaxed">
                                <span className="font-bold">Astuce :</span> Après 4 sessions, prends une pause de 20min. Ton cerveau assimile l'information pendant le repos. 🧠
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
