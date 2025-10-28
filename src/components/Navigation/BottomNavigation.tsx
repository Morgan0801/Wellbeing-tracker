import { Home, Heart, CheckSquare, BarChart3, MoreHorizontal } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onPlusClick: () => void;
}

const bottomNavItems = [
  { id: 'dashboard', icon: Home, label: 'Accueil' },
  { id: 'mood', icon: Heart, label: 'Humeur' },
  { id: 'habits', icon: CheckSquare, label: 'Habitudes' },
  { id: 'insights', icon: BarChart3, label: 'Insights' },
  { id: 'plus', icon: MoreHorizontal, label: 'Plus' },
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full relative group"
              aria-label={item.label}
            >
              {/* Icon */}
              <Icon
                className={`w-6 h-6 transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                }`}
              />

              {/* Active indicator - petit point sous l'icône */}
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
