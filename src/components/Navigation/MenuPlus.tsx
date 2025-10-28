import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckSquare, Moon, Target, Heart, Sparkles, Trophy, FileText, Bell, Palette } from 'lucide-react';

interface MenuPlusProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const secondaryMenuItems = [
  { id: 'tasks', icon: CheckSquare, label: 'Tâches', color: 'text-orange-500' },
  { id: 'sleep', icon: Moon, label: 'Sommeil', color: 'text-indigo-500' },
  { id: 'goals', icon: Target, label: 'Objectifs', color: 'text-green-500' },
  { id: 'gratitude', icon: Heart, label: 'Gratitude', color: 'text-pink-500' },
  { id: 'moodboard', icon: Sparkles, label: 'Moodboard', color: 'text-purple-500' },
  { id: 'gamification', icon: Trophy, label: 'Progression', color: 'text-yellow-500' },
  { id: 'export', icon: FileText, label: 'Export', color: 'text-gray-500' },
  { id: 'notifications', icon: Bell, label: 'Rappels', color: 'text-blue-500' },
  { id: 'theme', icon: Palette, label: 'Thème', color: 'text-cyan-500' },
];

export function MenuPlus({ isOpen, onClose, activeTab, onTabChange }: MenuPlusProps) {
  const handleItemClick = (id: string) => {
    onTabChange(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="md:hidden fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl z-50 max-h-[70vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="overflow-y-auto max-h-[calc(70vh-4rem)] pb-6">
              <div className="grid grid-cols-3 gap-4 p-6">
                {secondaryMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-xl transition-all
                        ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 dark:ring-blue-400'
                            : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon className={`w-7 h-7 ${isActive ? 'text-blue-600 dark:text-blue-400' : item.color}`} />
                      <span
                        className={`text-xs font-medium text-center ${
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
