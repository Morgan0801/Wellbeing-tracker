import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Smile, CheckCircle, ListTodo, Timer,
  Calendar, Moon, Target, Heart, Palette, Trophy,
  TrendingUp, FileText, Bell, Settings
} from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-primary', bgColor: 'bg-primary/10' },
  { id: 'mood', label: 'Humeur', icon: Smile, color: 'text-mood', bgColor: 'bg-mood/10' },
  { id: 'habits', label: 'Habitudes', icon: CheckCircle, color: 'text-vitality', bgColor: 'bg-vitality/10' },
  { id: 'tasks', label: 'Tâches', icon: ListTodo, color: 'text-productivity', bgColor: 'bg-productivity/10' },
  { id: 'focus', label: 'Focus', icon: Timer, color: 'text-focus', bgColor: 'bg-focus/10' },
  { id: 'calendar', label: 'Calendrier', icon: Calendar, color: 'text-sleep', bgColor: 'bg-sleep/10' },
  { id: 'sleep', label: 'Sommeil', icon: Moon, color: 'text-sleep', bgColor: 'bg-sleep/10' },
  { id: 'goals', label: 'Objectifs', icon: Target, color: 'text-vitality', bgColor: 'bg-vitality/10' },
  { id: 'gratitude', label: 'Gratitude', icon: Heart, color: 'text-gratitude', bgColor: 'bg-gratitude/10' },
  { id: 'moodboard', label: 'Moodboard', icon: Palette, color: 'text-mood', bgColor: 'bg-mood/10' },
  { id: 'gamification', label: 'Progression', icon: Trophy, color: 'text-productivity', bgColor: 'bg-productivity/10' },
  { id: 'insights', label: 'Insights', icon: TrendingUp, color: 'text-primary', bgColor: 'bg-primary/10' },
  { id: 'export', label: 'Export', icon: FileText, color: 'text-muted-foreground', bgColor: 'bg-muted/30' },
  { id: 'notifications', label: 'Rappels', icon: Bell, color: 'text-focus', bgColor: 'bg-focus/10' },
  { id: 'theme', label: 'Thème', icon: Settings, color: 'text-muted-foreground', bgColor: 'bg-muted/30' },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="hidden md:block border-b border-border/30 bg-card/50 backdrop-blur-sm">
      <div className="px-4 lg:px-12">
        <div className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabDesktop"
                    className={cn("absolute inset-0 rounded-xl border", item.bgColor, `border-${item.color.replace('text-', '')}/20`)}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon className={cn("w-4 h-4 relative z-10", isActive && item.color)} />
                <span className="relative z-10 hidden lg:inline">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
