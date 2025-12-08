interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
  { id: 'mood', label: 'Humeur', icon: '😊' },
  { id: 'habits', label: 'Habitudes', icon: '✅' },
  { id: 'tasks', label: 'Tâches', icon: '📝' },
  { id: 'focus', label: 'Focus', icon: '⏱️' },
  { id: 'calendar', label: 'Calendrier', icon: '📅' },
  { id: 'sleep', label: 'Sommeil', icon: '😴' },
  { id: 'goals', label: 'Objectifs', icon: '🎯' },
  { id: 'gratitude', label: 'Gratitude', icon: '🙏' },
  { id: 'moodboard', label: 'Moodboard', icon: '✨' },
  { id: 'gamification', label: 'Progression', icon: '🏆' },
  { id: 'insights', label: 'Insights', icon: '📈' },
  { id: 'export', label: 'Export', icon: '📄' },
  { id: 'notifications', label: 'Rappels', icon: '🔔' },
  { id: 'theme', label: 'Thème', icon: '🎨' },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="hidden md:block border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="px-4 md:px-12">
        <div className="flex overflow-x-auto scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                flex items-center gap-2 px-4 py-3 whitespace-nowrap text-sm font-medium
                border-b-2 transition-colors
                ${activeTab === item.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
