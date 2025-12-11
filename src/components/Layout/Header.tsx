import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, LogOut, Sparkles, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { levelProgress, xpForNextLevel } from '@/types/phase4-types';
import { cn } from '@/lib/utils';

export function Header() {
  const [isDark, setIsDark] = useState(false);
  const { logout } = useAuth();
  const { gamification } = useGamification();

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark);

    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  const progress = gamification
    ? levelProgress(gamification.total_xp, gamification.level)
    : 0;

  const nextLevelXP = gamification ? xpForNextLevel(gamification.level) : 0;
  const xpRemaining = gamification
    ? nextLevelXP - gamification.total_xp
    : 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 lg:px-12">
        {/* Logo et nom */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-vitality/20">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </motion.div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Wellbeing</h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5 hidden sm:block">Tracker personnel</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Niveau + XP - Version compacte et élégante */}
          {gamification && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-productivity-light to-focus-light dark:from-productivity/10 dark:to-focus/10 border border-productivity/20"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-productivity to-focus text-white font-display font-bold shadow-soft-md"
              >
                {gamification.level}
              </motion.div>
              <div className="flex flex-col min-w-[100px]">
                <span className="text-xs font-medium text-foreground">Niveau {gamification.level}</span>
                <Progress value={progress} size="sm" variant="productivity" className="mt-1" />
                <span className="text-[10px] text-muted-foreground mt-0.5">{xpRemaining} XP restants</span>
              </div>
            </motion.div>
          )}

          {/* Version mobile du niveau */}
          {gamification && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-productivity to-focus text-white font-display font-bold text-sm shadow-soft-sm"
            >
              {gamification.level}
            </motion.div>
          )}

          {/* Notifications (placeholder) */}
          <Button variant="ghost" size="icon" className="relative hidden sm:flex">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-mood rounded-full" />
          </Button>

          {/* Theme Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30">
            <Sun className={cn("h-4 w-4 transition-colors", !isDark ? "text-focus" : "text-muted-foreground")} />
            <Switch
              checked={isDark}
              onCheckedChange={toggleTheme}
              size="sm"
              variant="gradient"
            />
            <Moon className={cn("h-4 w-4 transition-colors", isDark ? "text-sleep" : "text-muted-foreground")} />
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Déconnexion</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
