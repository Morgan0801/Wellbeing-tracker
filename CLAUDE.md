# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # TypeScript compile + Vite production build
npm run preview   # Preview production build locally
npm run lint      # ESLint check (ts,tsx files, 0 warnings allowed)
```

## Database Migrations

SQL migrations are in `sql/` and `supabase/migrations/`. Apply via Supabase SQL Editor in order (01, 02, etc.).

```bash
supabase db push  # Push migrations to Supabase
```

## Environment Variables

Requires `.env` file with:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + tailwind-merge + tailwindcss-animate
- **State**: Zustand (auth), React Query (server state)
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Charts**: Recharts
- **Animations**: Framer Motion

### Project Structure

```
src/
├── App.tsx                    # Tab-based routing, no React Router
├── main.tsx                   # Entry point
├── components/                # Feature-based organization
│   ├── Auth/                  # Login page
│   ├── Dashboard/             # Main dashboard widgets
│   ├── Mood/                  # Mood tracking (score, emotions, domains)
│   ├── Habits/                # Habit tracking with streaks
│   ├── Tasks/                 # Eisenhower matrix (quadrants 1-4)
│   ├── Focus/                 # Pomodoro timer with tags
│   ├── Sleep/                 # Sleep tracking (REM, deep, quality)
│   ├── Goals/                 # Goal setting with milestones
│   ├── Gratitude/             # Daily gratitude entries
│   ├── Gamification/          # XP system, levels, badges
│   ├── Insights/              # Analytics, correlations, heatmaps
│   ├── Navigation/            # Tab nav, bottom nav, plus menu
│   └── ui/                    # Shared UI components (button, card, etc.)
├── hooks/                     # Custom hooks (one per feature)
│   ├── useMood.ts             # Mood CRUD + React Query
│   ├── useHabits.ts           # Habits + habit_logs
│   ├── useTasks.ts            # Tasks management
│   ├── useFocus.ts            # Focus sessions + tags
│   ├── useFocusEnhanced.ts    # Enhanced focus with manual entries
│   ├── useSleep.ts            # Sleep logs
│   ├── useGamification.ts     # XP, levels, badges
│   ├── useInsights.ts         # Cross-feature analytics
│   └── ...
├── stores/
│   └── authStore.ts           # Zustand store for auth state
├── lib/
│   ├── supabase.ts            # Supabase client init
│   ├── utils.ts               # cn() helper (clsx + tailwind-merge)
│   └── themes.ts              # Theme definitions
├── types/
│   └── index.ts               # All TypeScript interfaces
└── contexts/
    └── NavigationContext.tsx  # Navigation state provider
```

### Key Patterns

**Tab-based Navigation**: No React Router. `App.tsx` uses `activeTab` state to conditionally render pages.

**Data Fetching**: All hooks use React Query (`@tanstack/react-query`) with Supabase. Pattern:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['feature', userId],
  queryFn: async () => {
    const { data } = await supabase.from('table').select('*').eq('user_id', userId);
    return data;
  }
});
```

**Mutations**: Use `useMutation` with `queryClient.invalidateQueries` for cache updates.

**Auth**: Simple localStorage-based auth via `authStore.ts`. User ID stored in Zustand store.

**XP System**: `useGamification.ts` calls `add_xp` Supabase function. XP triggers calculated in `user_gamification` table.

### Supabase Tables

Core tables (all have `user_id` FK to `users`):
- `users` - User accounts with settings
- `moods` - Mood logs (score 1-10, emotions array, weather JSON)
- `mood_domains` - Impact per domain (travail, sport, amour, etc.)
- `habits` - Habit definitions (category, frequency)
- `habit_logs` - Daily habit completions
- `tasks` - Eisenhower matrix tasks (quadrant 1-4)
- `focus_sessions` - Pomodoro sessions with tags
- `session_tags` - Custom tags for focus sessions
- `sleep_logs` - Sleep data (hours, REM, deep, quality)
- `goals` - Goals with milestones
- `goal_milestones` - Goal sub-tasks
- `gratitude_entries` - Daily gratitude (3 entries)
- `user_gamification` - XP, level, badges, streak
- `xp_history` - XP transaction log
- `notification_settings` - Reminder preferences
- `theme_settings` - UI theme customization
- `moodboard_items` - Vision board items

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json` and `vite.config.ts`).

## Language

The app UI is in French. Keep French for user-facing strings.
