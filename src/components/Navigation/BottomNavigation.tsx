import { Home, Heart, CheckSquare, BarChart3, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onPlusClick: () => void;
}

const bottomNavItems = [
  { id: 'dashboard', icon: Home, label: 'Accueil', color: 'text-primary' },
  { id: 'mood', icon: Heart, label: 'Humeur', color: 'text-mood' },
  { id: 'habits', icon: CheckSquare, label: 'Habitudes', color: 'text-vitality' },
  { id: 'insights', icon: BarChart3, label: 'Insights', color: 'text-productivity' },
  { id: 'plus', icon: MoreHorizontal, label: 'Plus', color: 'text-muted-foreground' },
];

export function BottomNavigation({ activeTab, onTabChange, onPlusClick }: BottomNavigationProps) {
  const handleClick = (id: string) => {
    if (id === 'plus') {
      onPlusClick();
    } else {
      onTabChange(id);
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Glass background */}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-lg border-t border-border/30" />

      <div className="relative flex items-center justify-around h-16 pb-safe-bottom">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => handleClick(item.id)}
              whileTap={{ scale: 0.9 }}
              className="relative flex flex-col items-center justify-center flex-1 h-full group"
              aria-label={item.label}
            >
              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-2 top-1 bottom-1 rounded-2xl bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Icon container */}
              <motion.div
                animate={isActive ? { y: -2 } : { y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative z-10"
              >
                <Icon
                  className={cn(
                    "w-6 h-6 transition-colors duration-200",
                    isActive ? item.color : "text-muted-foreground"
                  )}
                />
              </motion.div>

              {/* Label */}
              <motion.span
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0.6,
                  scale: isActive ? 1 : 0.95,
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "text-[10px] font-medium mt-0.5 relative z-10",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
