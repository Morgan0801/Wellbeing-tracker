import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, X } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useTasks } from '@/hooks/useTasks';
import { Task, TASK_QUADRANTS } from '@/types';
import { cn } from '@/lib/utils';

const Q = {
    1: { dot: 'bg-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-600 dark:text-rose-400' },
    2: { dot: 'bg-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-200 dark:border-sky-800', text: 'text-sky-600 dark:text-sky-400' },
    3: { dot: 'bg-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-600 dark:text-amber-400' },
    4: { dot: 'bg-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-500 dark:text-slate-400' },
};

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
const H = 44; // Compact: 44px per hour

export function CalendarPage() {
    const { tasks, addTask, toggleTask, deleteTask, updateTask } = useTasks();
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<'day' | 'week'>('day');
    const [modal, setModal] = useState(false);
    const [title, setTitle] = useState('');
    const [quad, setQuad] = useState<1 | 2 | 3 | 4>(2);
    const [time, setTime] = useState('09:00');
    const [dur, setDur] = useState(60);
    const [dragged, setDragged] = useState<Task | null>(null);
    const [resize, setResize] = useState<{ id: string, y: number, dur: number } | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    const week = startOfWeek(date, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
    const dayTasks = useMemo(() => tasks?.filter(t => t.deadline && isSameDay(parseISO(t.deadline.split('T')[0]), date)) || [], [tasks, date]);
    const backlog = useMemo(() => tasks?.filter(t => !t.deadline && !t.completed) || [], [tasks]);

    const style = useCallback((t: Task) => {
        if (!t.deadline?.includes('T')) return null;
        const [hrs, mins] = t.deadline.split('T')[1].split(':').map(Number);
        const d = t.duration_minutes || 60;
        return { top: (hrs - 6) * H + (mins / 60) * H, height: Math.max(d / 60 * H, 20), hrs, mins, d };
    }, []);

    // Resize handlers with useEffect
    useEffect(() => {
        if (!resize) return;

        const move = (e: MouseEvent | TouchEvent) => {
            const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
            const delta = Math.round((y - resize.y) / H * 60 / 15) * 15;
            const newDur = Math.max(15, Math.min(480, resize.dur + delta));
            const el = document.getElementById(`t-${resize.id}`);
            if (el) el.style.height = `${Math.max(newDur / 60 * H, 20)}px`;
        };

        const up = (e: MouseEvent | TouchEvent) => {
            const y = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
            const delta = Math.round((y - resize.y) / H * 60 / 15) * 15;
            const newDur = Math.max(15, Math.min(480, resize.dur + delta));
            updateTask({ id: resize.id, updates: { duration_minutes: newDur } });
            setResize(null);
        };

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        window.addEventListener('touchmove', move);
        window.addEventListener('touchend', up);
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
            window.removeEventListener('touchmove', move);
            window.removeEventListener('touchend', up);
        };
    }, [resize, updateTask]);

    const startResize = (e: React.MouseEvent | React.TouchEvent, id: string, d: number) => {
        e.stopPropagation(); e.preventDefault();
        setResize({ id, y: 'touches' in e ? e.touches[0].clientY : e.clientY, dur: d });
    };

    const add = () => {
        if (!title.trim()) return;
        addTask({ title: title.trim(), quadrant: quad, deadline: `${format(date, 'yyyy-MM-dd')}T${time}`, recurring: false, completed: false, duration_minutes: dur });
        setTitle(''); setModal(false);
    };

    const drop = (h: number, half: boolean) => {
        if (!dragged) return;
        updateTask({ id: dragged.id, updates: { deadline: `${format(date, 'yyyy-MM-dd')}T${String(h).padStart(2, '0')}:${half ? '30' : '00'}` } });
        setDragged(null);
    };

    const fmt = (m: number) => m < 60 ? `${m}m` : m % 60 ? `${Math.floor(m / 60)}h${m % 60}` : `${m / 60}h`;

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-80px)] overflow-hidden bg-white dark:bg-slate-950">
            {/* Header - Minimal */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1">
                    <button onClick={() => setDate(addDays(date, view === 'day' ? -1 : -7))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
                    <button onClick={() => setDate(new Date())} className="px-3 py-1 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        {view === 'day' ? format(date, 'd MMM', { locale: fr }) : `S${format(date, 'w')}`}
                        {isToday(date) && <span className="ml-1.5 text-[10px] text-emerald-500 font-semibold">TODAY</span>}
                    </button>
                    <button onClick={() => setDate(addDays(date, view === 'day' ? 1 : 7))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
                </div>
                <div className="flex items-center gap-1">
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs">
                        <button onClick={() => setView('day')} className={cn('px-2.5 py-1 rounded-md font-medium transition-all', view === 'day' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')}>Jour</button>
                        <button onClick={() => setView('week')} className={cn('px-2.5 py-1 rounded-md font-medium transition-all', view === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')}>Sem</button>
                    </div>
                    <button onClick={() => setModal(true)} className="ml-2 flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100"><Plus className="w-3 h-3" />Tâche</button>
                </div>
            </div>

            {/* Modal - Minimal */}
            <AnimatePresence>
                {modal && (<>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40" onClick={() => setModal(false)} />
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-4 w-[90%] max-w-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-3"><span className="text-sm font-semibold">Nouvelle tâche</span><button onClick={() => setModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-4 h-4" /></button></div>
                        <input placeholder="Titre..." value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg mb-3 bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white" autoFocus onKeyDown={e => e.key === 'Enter' && add()} />
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div><label className="text-[10px] text-slate-400 uppercase mb-1 block">Début</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent" step="1800" /></div>
                            <div><label className="text-[10px] text-slate-400 uppercase mb-1 block">Durée</label>
                                <select value={dur} onChange={e => setDur(+e.target.value)} className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent">
                                    <option value={15}>15m</option><option value={30}>30m</option><option value={45}>45m</option><option value={60}>1h</option><option value={90}>1h30</option><option value={120}>2h</option><option value={180}>3h</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-1 mb-3">{TASK_QUADRANTS.map(q => (
                            <button key={q.id} onClick={() => setQuad(q.id as 1 | 2 | 3 | 4)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium border transition-all', quad === q.id ? `${Q[q.id as keyof typeof Q].bg} ${Q[q.id as keyof typeof Q].border} ${Q[q.id as keyof typeof Q].text}` : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300')}>{q.emoji}</button>
                        ))}</div>
                        <button onClick={add} className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100">Créer</button>
                    </motion.div>
                </>)}
            </AnimatePresence>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Minimal */}
                <div className="w-48 border-r border-slate-100 dark:border-slate-800 p-2 overflow-y-auto hidden lg:block">
                    <div className="text-[10px] text-slate-400 uppercase font-medium mb-2">Backlog ({backlog.length})</div>
                    <div className="space-y-1">{backlog.slice(0, 8).map(t => (
                        <div key={t.id} draggable onDragStart={() => setDragged(t)} onDragEnd={() => setDragged(null)} className={cn('p-2 rounded-lg border cursor-grab flex items-center gap-2 text-xs hover:shadow-sm transition-all', Q[t.quadrant as keyof typeof Q].border, Q[t.quadrant as keyof typeof Q].bg)}>
                            <div className={cn('w-1.5 h-1.5 rounded-full', Q[t.quadrant as keyof typeof Q].dot)} /><span className="truncate">{t.title}</span>
                        </div>
                    ))}{backlog.length > 8 && <div className="text-[10px] text-slate-400 text-center py-1">+{backlog.length - 8} autres</div>}</div>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden" ref={ref}>
                    {view === 'day' ? (
                        <div className="relative" style={{ minHeight: `${HOURS.length * H}px` }}>
                            {isToday(date) && <div className="absolute left-10 right-0 z-20 pointer-events-none" style={{ top: `${(new Date().getHours() - 6) * H + new Date().getMinutes() / 60 * H}px` }}><div className="flex items-center"><div className="w-2 h-2 rounded-full bg-rose-500 -ml-1" /><div className="flex-1 h-px bg-rose-500" /></div></div>}
                            {HOURS.map(h => (
                                <div key={h} className="flex absolute left-0 right-0" style={{ top: `${(h - 6) * H}px`, height: `${H}px` }}>
                                    <div className="w-10 flex-shrink-0 text-[10px] text-slate-300 dark:text-slate-600 pr-2 text-right pt-0.5 select-none">{h}:00</div>
                                    <div className="flex-1 relative border-b border-slate-50 dark:border-slate-800/50">
                                        <div className="absolute inset-x-0 top-0 h-1/2 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer border-b border-dashed border-slate-100 dark:border-slate-800/30" onDragOver={e => e.preventDefault()} onDrop={() => drop(h, false)} onClick={() => { setTime(`${String(h).padStart(2, '0')}:00`); setModal(true); }} />
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer" onDragOver={e => e.preventDefault()} onDrop={() => drop(h, true)} onClick={() => { setTime(`${String(h).padStart(2, '0')}:30`); setModal(true); }} />
                                    </div>
                                </div>
                            ))}
                            {dayTasks.map(t => {
                                const s = style(t); if (!s) return null; return (
                                    <div key={t.id} id={`t-${t.id}`} draggable onDragStart={() => setDragged(t)} onDragEnd={() => setDragged(null)} style={{ top: `${s.top}px`, height: `${s.height}px`, left: '44px', right: '4px' }} className={cn('absolute rounded-lg border cursor-grab group transition-all', t.completed && 'opacity-40', Q[t.quadrant as keyof typeof Q].border, Q[t.quadrant as keyof typeof Q].bg)}>
                                        <div className="h-full px-2 py-1 flex items-start gap-1.5">
                                            <button onClick={e => { e.stopPropagation(); toggleTask(t.id); }} className={cn('w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all', t.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400')}>
                                                {t.completed && <Check className="w-2 h-2" />}
                                            </button>
                                            <div className="flex-1 min-w-0 overflow-hidden">
                                                <p className={cn('text-xs font-medium truncate', Q[t.quadrant as keyof typeof Q].text, t.completed && 'line-through')}>{t.title}</p>
                                                {s.height > 28 && <p className="text-[9px] text-slate-400 mt-0.5">{s.hrs}:{String(s.mins).padStart(2, '0')} · {fmt(s.d)}</p>}
                                            </div>
                                            <button onClick={e => { e.stopPropagation(); deleteTask(t.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all"><Trash2 className="w-3 h-3 text-slate-400" /></button>
                                        </div>
                                        {/* Resize handle */}
                                        <div className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 flex items-center justify-center" onMouseDown={e => startResize(e, t.id, s.d)} onTouchStart={e => startResize(e, t.id, s.d)}>
                                            <div className="w-8 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex h-full">
                            <div className="w-8 flex-shrink-0">{HOURS.map(h => <div key={h} className="text-[9px] text-slate-300 pr-1 text-right" style={{ height: `${H / 2}px` }}>{h}</div>)}</div>
                            <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-800">{days.map((d, i) => (
                                <div key={i} className="relative cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20" onClick={() => { setDate(d); setView('day'); }}>
                                    <div className={cn('sticky top-0 z-10 text-center py-1.5 border-b bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm text-[10px]', isToday(d) && 'bg-rose-50 dark:bg-rose-900/20')}>
                                        <div className="text-slate-400">{format(d, 'EEEEE', { locale: fr })}</div>
                                        <div className={cn('font-semibold', isToday(d) ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300')}>{format(d, 'd')}</div>
                                    </div>
                                    <div style={{ height: `${HOURS.length * (H / 2)}px` }} className="relative">
                                        {tasks?.filter(x => x.deadline && isSameDay(parseISO(x.deadline.split('T')[0]), d)).map(x => {
                                            const s = style(x); if (!s) return null; return (
                                                <div key={x.id} style={{ top: `${s.top / 2}px`, height: `${Math.max(s.height / 2, 10)}px` }} className={cn('absolute left-0.5 right-0.5 rounded text-[7px] truncate px-0.5', x.completed && 'opacity-40', Q[x.quadrant as keyof typeof Q].bg, Q[x.quadrant as keyof typeof Q].text)}>{x.title}</div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
