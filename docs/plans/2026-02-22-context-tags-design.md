# Context Tags & Design Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add "Contexte de vie" custom tags (Vacances, Ski, Van life…) to mood entry and redesign the modal, history cards, and global UI polish.

**Architecture:** Extend the existing `activity_types` / `mood_activities` system with a new `'contexte'` category. Context tags appear first in Step 3 of the MoodModal as horizontal scrollable pills. Fix the bug where activities were never saved on new mood creation. Then redesign visual layers: modal progress bar, history cards, global CSS.

**Tech Stack:** React 18 + TypeScript + Tailwind CSS + Framer Motion + Supabase (MCP available) + @tanstack/react-query

---

## IMPORTANT: Context

- **No git repo** — skip all git commit steps
- **Supabase project:** `dfjkqrajelqgoqtcukkx` (projet "Perso") — use MCP to run migrations
- **Working dir:** `E:\WellBeing - ACTUEL _ MODIF - Copie (2)\Wellbeing-tracker ajout timer\`
- **Path alias:** `@/` maps to `./src/`

### Known bugs to fix during implementation
1. **Activities not saved on new mood** — `saveMoodActivities` is only called on edit, never on create. Context tags won't persist without this fix.
2. **`activity_types` table empty in Supabase** — the UI falls back to fake IDs (`default-0`, etc.) which can't be stored in `mood_activities`. We need real DB rows.

---

## Task 1: Supabase DB Migration — Add 'contexte' category

**Files:** None (run via Supabase MCP)

**Step 1: Alter the CHECK constraint on `activity_types.category`**

Run this SQL in Supabase (project `dfjkqrajelqgoqtcukkx`):

```sql
-- Drop old constraint
ALTER TABLE activity_types
  DROP CONSTRAINT IF EXISTS activity_types_category_check;

-- Add new constraint with 'contexte'
ALTER TABLE activity_types
  ADD CONSTRAINT activity_types_category_check
  CHECK (category = ANY (ARRAY[
    'sport'::text, 'social'::text, 'travail'::text,
    'loisirs'::text, 'sante'::text, 'custom'::text, 'contexte'::text
  ]));
```

**Step 2: Insert all default activities (real rows) + context defaults**

```sql
-- Insert regular defaults (only if not already present)
INSERT INTO activity_types (name, emoji, category, is_default, is_active)
SELECT name, emoji, category, is_default, is_active FROM (VALUES
  ('Sport',       '💪', 'sport',   true, true),
  ('Marche',      '🚶', 'sport',   true, true),
  ('Yoga',        '🧘', 'sport',   true, true),
  ('Famille',     '👨‍👩‍👧', 'social',  true, true),
  ('Amis',        '👥', 'social',  true, true),
  ('Couple',      '❤️', 'social',  true, true),
  ('Sortie',      '🎉', 'social',  true, true),
  ('Travail',     '💼', 'travail', true, true),
  ('Deep Work',   '🧠', 'travail', true, true),
  ('Réunions',    '🤝', 'travail', true, true),
  ('Méditation',  '🧘', 'sante',   true, true),
  ('Bien dormi',  '😴', 'sante',   true, true),
  ('Hydraté',     '💧', 'sante',   true, true),
  ('Sain',        '🥗', 'sante',   true, true),
  ('Vitamines',   '💊', 'sante',   true, true),
  ('Lecture',     '📚', 'loisirs', true, true),
  ('Nature',      '🌳', 'loisirs', true, true),
  ('Musique',     '🎵', 'loisirs', true, true),
  ('Gaming',      '🎮', 'loisirs', true, true),
  ('Créatif',     '🎨', 'loisirs', true, true),
  ('Séries',      '📺', 'loisirs', true, true),
  ('Alcool',      '🍺', 'sante',   true, true),
  ('Caféine++',   '☕', 'sante',   true, true),
  ('Malbouffe',   '🍔', 'sante',   true, true),
  ('Écrans tard', '📱', 'sante',   true, true),
  -- Context defaults
  ('Vacances',          '🏖️', 'contexte', true, true),
  ('Voyage',            '✈️', 'contexte', true, true),
  ('Weekend',           '🎉', 'contexte', true, true),
  ('Ski',               '⛷️', 'contexte', true, true),
  ('Van life',          '🚐', 'contexte', true, true),
  ('Télétravail',       '🏠', 'contexte', true, true),
  ('Période stressante','😤', 'contexte', true, true),
  ('Temps libre',       '😌', 'contexte', true, true),
  ('Sport intensif',    '🏔️', 'contexte', true, true)
) AS v(name, emoji, category, is_default, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM activity_types
  WHERE activity_types.name = v.name AND activity_types.is_default = true
);
```

**Step 3: Verify**
```sql
SELECT category, count(*) FROM activity_types GROUP BY category ORDER BY category;
-- Expected: contexte=9, loisirs=6, sante=9, social=4, sport=3, travail=3
```

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/index.ts:204` — ActivityCategory type
- Modify: `src/types/index.ts:253-260` — ACTIVITY_CATEGORIES array

**Step 1: Add `'contexte'` to ActivityCategory type**

In `src/types/index.ts`, find line 204:
```typescript
export type ActivityCategory = 'sport' | 'social' | 'travail' | 'loisirs' | 'sante' | 'custom';
```
Replace with:
```typescript
export type ActivityCategory = 'sport' | 'social' | 'travail' | 'loisirs' | 'sante' | 'custom' | 'contexte';
```

**Step 2: Add contexte to ACTIVITY_CATEGORIES (first position)**

Find the ACTIVITY_CATEGORIES const (around line 253):
```typescript
export const ACTIVITY_CATEGORIES: { type: ActivityCategory; label: string; emoji: string; color: string }[] = [
  { type: 'sport', label: 'Sport', emoji: '💪', color: '#66BB6A' },
```
Replace with:
```typescript
export const ACTIVITY_CATEGORIES: { type: ActivityCategory; label: string; emoji: string; color: string }[] = [
  { type: 'contexte', label: 'Contexte de vie', emoji: '🌍', color: '#FF7043' },
  { type: 'sport', label: 'Sport', emoji: '💪', color: '#66BB6A' },
```

**Step 3: Verify TypeScript compiles**
```bash
npm run build 2>&1 | head -30
```
Expected: no errors about ActivityCategory.

---

## Task 3: Fix Bug — Save Activities on New Mood Creation

**Files:**
- Modify: `src/hooks/useMood.ts` — export `addMoodMutation` directly
- Modify: `src/components/Mood/MoodModal.tsx` — call saveMoodActivities after new mood creation

**Background:** Currently `addMood` is `addMoodMutation.mutate` (fire-and-forget). We need `mutateAsync` to chain activity saving.

**Step 1: Expose `addMoodAsync` in useMood hook**

In `src/hooks/useMood.ts`, find the return statement (around line 193):
```typescript
return {
  moods,
  isLoading,
  addMood: addMoodMutation.mutate,
  isAdding: addMoodMutation.isPending,
```
Replace with:
```typescript
return {
  moods,
  isLoading,
  addMood: addMoodMutation.mutate,
  addMoodAsync: addMoodMutation.mutateAsync,
  isAdding: addMoodMutation.isPending,
```

**Step 2: Update MoodModal.tsx to save activities on new mood creation**

In `src/components/Mood/MoodModal.tsx`, update the import at line 49:
```typescript
const { addMood, updateMood, isAdding, isUpdating } = useMood();
```
Replace with:
```typescript
const { addMood, addMoodAsync, updateMood, isAdding, isUpdating } = useMood();
```

In `handleSubmit`, find the else branch (around line 162):
```typescript
} else {
  addMood({
    score_global: scoreGlobal,
    emotions: selectedEmotions,
    note: note || undefined,
    weather: weather || undefined,
    energy_level: energyLevel,
    datetime: datetimeISO,
    domains: domainsToSave,
  });
}
```
Replace with:
```typescript
} else {
  const newMood = await addMoodAsync({
    score_global: scoreGlobal,
    emotions: selectedEmotions,
    note: note || undefined,
    weather: weather || undefined,
    energy_level: energyLevel,
    datetime: datetimeISO,
    domains: domainsToSave,
  });

  if (newMood && activitiesToSave.length > 0) {
    saveMoodActivities.mutate({
      moodId: newMood.id,
      activities: activitiesToSave,
    });
  }
}
```

Also change `handleSubmit` signature from `const handleSubmit = async () => {` — it's already `async`, good.

**Step 3: Verify build**
```bash
npm run build 2>&1 | head -30
```

---

## Task 4: Redesign ActivityCheckboxes — Contexte Pills

**Files:**
- Modify: `src/components/Mood/ActivityCheckboxes.tsx`

**Step 1: Replace the entire component**

The new version displays `contexte` activities as horizontal scrollable pills at the top, with a distinct style. Other categories remain as grid.

```typescript
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

            {/* ── CONTEXTE DE VIE (pills scrollables) ── */}
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
                                        : 'border-orange-200 text-orange-700 hover:border-orange-400 hover:bg-orange-50'
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
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border-2 border-dashed border-orange-300 text-orange-400 hover:border-orange-500 hover:text-orange-600 transition-all"
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
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider opacity-60" style={{ color: group.color }}>
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

            {/* ── ADD CUSTOM FORM ── */}
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
```

**Step 2: Verify it renders**
Start dev server and navigate to Mood page, click "+" to open mood modal, go to Step 3.
```bash
npm run dev
```
Expected: contexte pills appear at top in orange, other activities below.

---

## Task 5: Redesign MoodModal — Progress Bar + Step Polish

**Files:**
- Modify: `src/components/Mood/MoodModal.tsx`

**Step 1: Replace DialogDescription with animated progress bar**

Find in MoodModal.tsx:
```typescript
<DialogDescription>Étape {step} sur 5</DialogDescription>
```
Replace with:
```typescript
<DialogDescription asChild>
  <div className="space-y-2">
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => s < step && setStep(s)}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            s === step ? 'bg-primary flex-1' :
            s < step ? 'bg-primary/40 flex-1 cursor-pointer hover:bg-primary/60' :
            'bg-muted flex-1'
          )}
        />
      ))}
    </div>
    <p className="text-xs text-muted-foreground">
      {['Score & énergie', 'Émotions', 'Activités & contexte', 'Domaines de vie', 'Note & date'][step - 1]}
    </p>
  </div>
</DialogDescription>
```

**Step 2: Polish Step 1 — Score selector**

In Step 1, find the score buttons grid and add an `animate` wrapper:
```typescript
{/* Score buttons — add AnimatePresence around the whole step */}
```
Find the existing grid `className="grid grid-cols-5 gap-2"` and add `animate-in fade-in duration-200` class.

Find the energy level section title and add a little style:
```typescript
<Label className="flex items-center gap-2 text-sm font-semibold">
  🔋 Niveau d'énergie
</Label>
```

**Step 3: Polish Step 2 — Emotions grouped by type**

In `src/components/Mood/EmotionSelector.tsx` (read first to understand), wrap emotion groups with visual dividers showing "Positives", "Neutres", "Négatives" with colored section headers if not already done.

Actually Step 2 is already using EmotionSelector. To avoid over-engineering, just verify it looks OK. No change needed if it's already grouped.

**Step 4: Polish Step 4 — Domain sliders with colored track**

In `src/components/Mood/DomainSliders.tsx`, enhance the impact value display:

Find:
```typescript
<span className={`text-sm font-semibold ${getImpactColor(domains[domain.type])}`}>
  {getImpactLabel(domains[domain.type])}
</span>
```
Replace with:
```typescript
<span className={cn(
  'text-sm font-bold px-2 py-0.5 rounded-full',
  domains[domain.type] < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
  domains[domain.type] > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
  'bg-gray-100 text-gray-500 dark:bg-gray-800'
)}>
  {getImpactLabel(domains[domain.type])}
</span>
```
Add `import { cn } from '@/lib/utils';` at top if not present.

**Step 5: Verify modal looks polished**
Open dev server, open mood modal. Check: progress bar at top, clickable dots for past steps, colored domain labels.

---

## Task 6: Redesign MoodHistory — Better Cards

**Files:**
- Modify: `src/components/Mood/MoodHistory.tsx`

**Step 1: Replace the card div with a richer design**

Find the outer div of each mood card:
```typescript
<div
  key={mood.id}
  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
>
```
Replace with:
```typescript
<motion.div
  key={mood.id}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  className="relative flex items-start gap-4 p-4 rounded-xl border border-border/60 hover:border-border hover:shadow-md transition-all duration-200 overflow-hidden"
  style={{
    borderLeftWidth: '4px',
    borderLeftColor: getMoodColor(mood.score_global),
  }}
>
```

Add `import { motion } from 'framer-motion';` at top.

**Step 2: Add context tags display in mood card**

After the emotions section (around line 91), add context tags. We need to fetch them. Since context activities are stored in `mood_activities`, we need to display them.

For now, a simple approach: add a `useQuery` to fetch context activities for each visible mood. This is a progressive enhancement — if no context tags exist yet, nothing shows.

Actually this is complex to do per-card. Simpler: add a `ContextTags` sub-component that fetches for a given moodId.

Add after the emotions section in MoodHistory.tsx:
```typescript
{/* Context Tags — show inline if available */}
<MoodContextTags moodId={mood.id} />
```

**Step 3: Create MoodContextTags component inline**

At the top of `src/components/Mood/MoodHistory.tsx`, add this small component:
```typescript
function MoodContextTags({ moodId }: { moodId: string }) {
  const { data: tags = [] } = useQuery({
    queryKey: ['mood-context-tags', moodId],
    queryFn: async () => {
      const { data } = await supabase
        .from('mood_activities')
        .select('activity_type_id, activity_types!inner(name, emoji, category)')
        .eq('mood_id', moodId)
        .eq('done', true)
        .eq('activity_types.category', 'contexte');
      return (data || []) as Array<{ activity_type_id: string; activity_types: { name: string; emoji: string } }>;
    },
    staleTime: 60_000,
  });

  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {tags.map((t) => (
        <span
          key={t.activity_type_id}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium"
        >
          {t.activity_types.emoji} {t.activity_types.name}
        </span>
      ))}
    </div>
  );
}
```

Add necessary imports: `import { useQuery } from '@tanstack/react-query';` and `import { supabase } from '@/lib/supabase';`.

**Step 4: Improve emotion pills styling**

Find:
```typescript
className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
```
Replace with:
```typescript
className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
```

---

## Task 7: CSS Fix — Remove Global Transition

**Files:**
- Modify: `src/index.css:257-262`

**Step 1: Scope the transition to interactive elements only**

Find (around line 257-262):
```css
/* === SMOOTH TRANSITIONS === */
* {
  transition-property: color, background-color, border-color, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```
Replace with:
```css
/* === SMOOTH TRANSITIONS (scoped to interactive elements only) === */
button, a, input, select, textarea, [role="button"],
[class*="transition"], [class*="hover:"] {
  transition-property: color, background-color, border-color, box-shadow, opacity, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

**Step 2: Verify no visual regressions**
Open the app, navigate between pages — animations should still work, but the app should feel snappier.

---

## Task 8: MoodPage Header — Stats Improvement

**Files:**
- Modify: `src/components/Mood/MoodPage.tsx`

**Step 1: Add context display in the header**

In `MoodPage.tsx`, after the `todayAvgMood` calculation (around line 37), add:
```typescript
// Contexte actif du jour (most recent mood's context tags)
const latestMoodId = todayMoods[0]?.id;
```

In the header section, after the mood score display, add a small "Contexte" line. This is a progressive enhancement — if we have context tags, show them. Add within the header `<div className="relative z-10">`:

After the existing stats, add:
```tsx
{latestMoodId && <TodayContextBadge moodId={latestMoodId} />}
```

Create `TodayContextBadge` component at top of MoodPage.tsx:
```typescript
function TodayContextBadge({ moodId }: { moodId: string }) {
  const { data: tags = [] } = useQuery({
    queryKey: ['mood-context-tags', moodId],
    queryFn: async () => {
      const { data } = await supabase
        .from('mood_activities')
        .select('activity_type_id, activity_types!inner(name, emoji, category)')
        .eq('mood_id', moodId)
        .eq('done', true)
        .eq('activity_types.category', 'contexte');
      return (data || []) as Array<{ activity_type_id: string; activity_types: { name: string; emoji: string } }>;
    },
    staleTime: 60_000,
  });

  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {tags.map((t) => (
        <span
          key={t.activity_type_id}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium"
        >
          {t.activity_types.emoji} {t.activity_types.name}
        </span>
      ))}
    </div>
  );
}
```

Add `import { useQuery } from '@tanstack/react-query';` and `import { supabase } from '@/lib/supabase';` at top.

---

## Task 9: Final Verification

**Step 1: Build check**
```bash
npm run build 2>&1
```
Expected: No TypeScript errors.

**Step 2: Lint check**
```bash
npm run lint 2>&1
```
Expected: 0 warnings, 0 errors.

**Step 3: Manual smoke test checklist**
- [ ] Open mood modal → Step 3 shows orange context pills (Vacances, Ski, etc.)
- [ ] Select "Vacances" → it turns orange/filled
- [ ] Click "+ Ajouter" in context section → inline form appears, save a custom tag
- [ ] Submit mood → in history, the mood card shows orange pill with the context
- [ ] Progress bar at top of modal shows 5 segments, clicking back segment navigates
- [ ] Domain sliders show colored +/- badges
- [ ] MoodHistory cards have left colored border matching mood score
- [ ] App feels snappier (no global CSS transition lag)

---

## Summary of Files Changed

| File | Change |
|------|--------|
| Supabase DB | ALTER activity_types constraint + INSERT defaults |
| `src/types/index.ts` | Add `'contexte'` to ActivityCategory + ACTIVITY_CATEGORIES |
| `src/hooks/useMood.ts` | Expose `addMoodAsync` |
| `src/components/Mood/MoodModal.tsx` | Progress bar + fix activity save on create |
| `src/components/Mood/ActivityCheckboxes.tsx` | Full redesign with contexte pills |
| `src/components/Mood/DomainSliders.tsx` | Colored impact badges |
| `src/components/Mood/MoodHistory.tsx` | Card redesign + context tags display |
| `src/components/Mood/MoodPage.tsx` | Header context badge |
| `src/index.css` | Scope global transition |
