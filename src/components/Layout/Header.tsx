import { useState, useEffect } from 'react';
import { Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const [isDark, setIsDark] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    // Vérifier le thème stocké ou la préférence système
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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌟</span>
          <h1 className="text-xl font-semibold">Wellbeing Tracker</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
            <Moon className="h-4 w-4" />
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  );
}
