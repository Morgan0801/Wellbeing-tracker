import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Plus, Minus, Target, TrendingUp, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWater } from '@/hooks/useWater';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const WATER_AMOUNTS = [
    { ml: 150, label: 'Petit verre', emoji: '🥛' },
    { ml: 250, label: 'Verre', emoji: '🥤' },
    { ml: 330, label: 'Canette', emoji: '🥫' },
    { ml: 500, label: 'Bouteille', emoji: '🍶' },
];

export function WaterPage() {
    const {
        todayLogs,
        todayTotal,
        dailyGoal,
        progressPercent,
        isGoalReached,
        addWater,
        removeWater,
        updateGoal,
    } = useWater();

    const [showGoalEditor, setShowGoalEditor] = useState(false);
    const [newGoal, setNewGoal] = useState(dailyGoal);

    const glassesEquivalent = Math.floor(todayTotal / 250);
    const remaining = Math.max(0, dailyGoal - todayTotal);

    return (
        <div className="container mx-auto p-3 md:p-4 pb-20 md:pb-4 space-y-4 md:space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-xl p-4 md:p-8 text-white"
            >
                <h2 className="text-xl md:text-3xl font-bold mb-1 flex items-center gap-3">
                    <Droplets className="w-6 h-6 md:w-8 md:h-8" />
                    Hydratation 💧
                </h2>
                <p className="text-sm md:text-base opacity-90">
                    {format(new Date(), 'EEEE d MMMM', { locale: fr })}
                </p>
            </motion.div>

            {/* Main Progress Card */}
            <Card className="overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Circular Progress */}
                        <div className="relative w-48 h-48">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="45%"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    className="text-blue-100 dark:text-blue-900/30"
                                />
                                <motion.circle
                                    cx="50%"
                                    cy="50%"
                                    r="45%"
                                    fill="transparent"
                                    stroke="url(#waterGradient)"
                                    strokeWidth="12"
                                    strokeDasharray={`${2 * Math.PI * 45}%`}
                                    strokeLinecap="round"
                                    initial={{ strokeDashoffset: `${2 * Math.PI * 45}%` }}
                                    animate={{
                                        strokeDashoffset: `${2 * Math.PI * 45 * (1 - progressPercent / 100)}%`,
                                    }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                />
                                <defs>
                                    <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#06b6d4" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={todayTotal}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className="text-center"
                                    >
                                        <span className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
                                            {todayTotal}
                                        </span>
                                        <span className="text-sm text-muted-foreground ml-1">ml</span>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            / {dailyGoal} ml
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                                {isGoalReached && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-2xl mt-2"
                                    >
                                        🎉
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex-1 space-y-4 w-full">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-cyan-600">{glassesEquivalent}</div>
                                    <p className="text-xs text-muted-foreground">Verres (250ml)</p>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{progressPercent}%</div>
                                    <p className="text-xs text-muted-foreground">Objectif</p>
                                </div>
                            </div>

                            {!isGoalReached && (
                                <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        💡 Plus que <strong>{remaining} ml</strong> pour atteindre ton objectif !
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Add Buttons */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Ajouter de l'eau
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {WATER_AMOUNTS.map((amount) => (
                            <motion.button
                                key={amount.ml}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => addWater.mutate(amount.ml)}
                                disabled={addWater.isPending}
                                className={cn(
                                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                                    'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                                    'border-gray-200 dark:border-gray-700'
                                )}
                            >
                                <span className="text-3xl">{amount.emoji}</span>
                                <span className="text-sm font-medium">{amount.ml} ml</span>
                                <span className="text-xs text-muted-foreground">{amount.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Today's Log */}
            {todayLogs.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Aujourd'hui ({todayLogs.length} entrées)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {todayLogs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">💧</span>
                                        <span className="font-medium">{log.amount_ml} ml</span>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(log.logged_at), 'HH:mm')}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeWater.mutate(log.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Goal Settings */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Objectif quotidien
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowGoalEditor(!showGoalEditor)}
                        >
                            <Settings className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {showGoalEditor ? (
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                value={newGoal}
                                onChange={(e) => setNewGoal(Number(e.target.value))}
                                min={500}
                                max={5000}
                                step={100}
                                className="flex-1 px-3 py-2 border rounded-lg"
                            />
                            <span className="text-muted-foreground">ml</span>
                            <Button
                                onClick={() => {
                                    updateGoal.mutate(newGoal);
                                    setShowGoalEditor(false);
                                }}
                            >
                                Sauvegarder
                            </Button>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">
                            Ton objectif : <strong>{dailyGoal} ml</strong> par jour (environ {Math.round(dailyGoal / 250)} verres)
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
