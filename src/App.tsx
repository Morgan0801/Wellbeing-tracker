import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './components/Auth/LoginPage';
import { Header } from './components/Layout/Header';
import { TabNavigation } from './components/Navigation/TabNavigation';
import { BottomNavigation } from './components/Navigation/BottomNavigation';
import { MenuPlus } from './components/Navigation/MenuPlus';
import { Dashboard } from './components/Dashboard/Dashboard';
import { HabitsPage } from './components/Habits/HabitsPage';
import { TasksPage } from './components/Tasks/TasksPage';
import { SleepPage } from './components/Sleep/SleepPage';
import { GoalsPage } from './components/Goals/GoalsPage';
import { GratitudePage } from './components/Gratitude/GratitudePage';
import { MoodboardPage } from './components/Moodboard/MoodboardPage';
import { GamificationPage } from './components/Gamification/GamificationPage';
import { InsightsPage } from '@/components/Insights/InsightsPage';
import ExportPage from '@/components/Export/ExportPage';
import NotificationsSettings from '@/components/Notifications/NotificationsSettings';
import ThemeSettings from '@/components/Settings/ThemeSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main content with padding bottom for mobile nav */}
        <main className="pb-16 md:pb-0">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'mood' && <Dashboard />}
          {activeTab === 'habits' && <HabitsPage />}
          {activeTab === 'tasks' && <TasksPage />}
          {activeTab === 'sleep' && <SleepPage />}
          {activeTab === 'goals' && <GoalsPage />}
          {activeTab === 'gratitude' && <GratitudePage />}
          {activeTab === 'moodboard' && <MoodboardPage />}
          {activeTab === 'gamification' && <GamificationPage />}
          {activeTab === 'insights' && <InsightsPage />}
          {activeTab === 'export' && <ExportPage />}
          {activeTab === 'notifications' && <NotificationsSettings />}
          {activeTab === 'theme' && <ThemeSettings />}
        </main>

        {/* Bottom Navigation (Mobile only) */}
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onPlusClick={() => setIsPlusMenuOpen(true)}
        />

        {/* Menu Plus (Drawer) */}
        <MenuPlus
          isOpen={isPlusMenuOpen}
          onClose={() => setIsPlusMenuOpen(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </QueryClientProvider>
  );
}

export default App;
