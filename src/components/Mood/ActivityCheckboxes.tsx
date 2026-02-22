import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import { ActivityType, ACTIVITY_CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ActivityCheckboxesProps {
    activityTypes: ActivityType[];
    selectedActivities: Set<string>;
    onChange: (activities: Set<string>) => void;
    onAddCustom?: (name: string, emoji: string, category: string) => void;
}

export function ActivityCheckboxes({
    activityTypes,
    selectedActivities,
    onChange,
    onAddCustom,
}: ActivityCheckboxesProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newActivityName, setNewActivityName] = useState('');
    const [newActivityEmoji, setNewActivityEmoji] = useState('📌');
    const [addCategory, setAddCategory] = useState<'contexte' | 'custom'>('contexte');

    const handleToggle = (activityId: string) => {
        const newSet = new Set(selectedActivities);
        if (newSet.has(activityId)) {
            newSet.delete(activityId);
        } else {
            newSet.add(activityId);
        }
        onChange(newSet);
    };

    const handleAddCustom = () => {
        if (newActivityName.trim() && onAddCustom) {
            onAddCustom(newActivityName.trim(), newActivityEmoji, addCategory);
            setNewActivityName('');
            setNewActivityEmoji('📌');
            setShowAddForm(false);
        }
    };

    const contextActivities = activityTypes.filter(a => a.category === 'contexte');
    const otherCategories = ACTIVITY_CATEGORIES
        .filter(cat => cat.type !== 'contexte')
        .map(cat => ({
            ...cat,
            activities: activityTypes.filter(a => a.category === cat.type),
        }))
        .filter(group => group.activities.length > 0);

    const doneCount = selectedActivities.size;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Coche ce que tu as fait / vécu</p>
                {doneCount > 0 && (
                    <span className="text-xs font-medium text-green-600">✨ {doneCount} sélectionné{doneCount > 1 ? 's' : ''}</span>
                )}
            </div>

            {/* ── CONTEXTE DE VIE (pills) ── */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-500">🌍 Contexte de vie</span>
                    <span className="text-[10px] text-muted-foreground">— Où en es-tu en ce moment ?</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {contextActivities.map((activity) => {
                        const isSelected = selectedActivities.has(activity.id);
                        return (
                            <motion.button
                                key={activity.id}
                                type="button"
                                whileTap={{ scale: 0.92 }}
                                onClick={() => handleToggle(activity.id)}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all',
                                    isSelected
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200'
                                        : 'border-orange-200 text-orange-700 hover:border-orange-400 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-900/20'
                                )}
                            >
                                <span>{activity.emoji}</span>
                                <span>{activity.name}</span>
                                {isSelected && <Check className="w-3 h-3" />}
                            </motion.button>
                        );
                    })}
                    {onAddCustom && !showAddForm && (
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.92 }}
                            onClick={() => { setAddCategory('contexte'); setShowAddForm(true); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border-2 border-dashed border-orange-300 text-orange-400 hover:border-orange-500 hover:text-orange-600 transition-all dark:border-orange-700 dark:text-orange-500"
                        >
                            <Plus className="w-3 h-3" />
                            Ajouter
                        </motion.button>
                    )}
                </div>
            </div>

            {/* ── DIVIDER ── */}
            <div className="border-t border-dashed border-border/50" />

            {/* ── AUTRES CATÉGORIES (grid) ── */}
            {otherCategories.map((group) => (
                <div key={group.type} className="space-y-1.5">
                    <h4
                        className="text-[10px] font-semibold uppercase tracking-wider opacity-60"
                        style={{ color: group.color }}
                    >
                        {group.emoji} {group.label}
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                        {group.activities.map((activity) => {
                            const isDone = selectedActivities.has(activity.id);
                            return (
                                <motion.button
                                    key={activity.id}
                                    type="button"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleToggle(activity.id)}
                                    className={cn(
                                        'relative flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all',
                                        'hover:shadow-sm focus:outline-none focus:ring-1 focus:ring-primary/50',
                                        isDone
                                            ? 'bg-green-50 dark:bg-green-900/30 border-green-400'
                                            : 'bg-card border-border/50 opacity-60 hover:opacity-100'
                                    )}
                                >
                                    <span className="text-lg">{activity.emoji}</span>
                                    <span className="text-[10px] font-medium truncate w-full text-center leading-tight">
                                        {activity.name}
                                    </span>
                                    {isDone && <Check className="w-3 h-3 text-green-600 absolute top-1 right-1" />}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* ── AJOUTER CUSTOM (activités non-contexte) ── */}
            {onAddCustom && (
                <div className="pt-2 border-t">
                    {!showAddForm ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => { setAddCategory('custom'); setShowAddForm(true); }}
                            className="text-xs text-muted-foreground h-7"
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Autre activité custom
                        </Button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-2"
                        >
                            <p className="text-xs text-muted-foreground">
                                Ajout dans : <strong>{addCategory === 'contexte' ? '🌍 Contexte de vie' : '📌 Custom'}</strong>
                            </p>
                            <div className="flex gap-1.5">
                                <Input
                                    type="text"
                                    placeholder="🎯"
                                    value={newActivityEmoji}
                                    onChange={(e) => setNewActivityEmoji(e.target.value.slice(0, 2))}
                                    className="w-10 text-center text-sm h-8 px-1"
                                />
                                <Input
                                    type="text"
                                    placeholder="Nom..."
                                    value={newActivityName}
                                    onChange={(e) => setNewActivityName(e.target.value)}
                                    className="flex-1 h-8 text-xs"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                                    autoFocus
                                />
                                <Button type="button" size="sm" onClick={handleAddCustom} className="h-8 text-xs px-2">
                                    OK
                                </Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddForm(false)} className="h-8 text-xs px-2">
                                    ✕
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}
