import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { NavigationProvider } from './contexts/NavigationContext';
import { LoginPage } from './components/Auth/LoginPage';
import { Header } from './components/Layout/Header';
import { TabNavigation } from './components/Navigation/TabNavigation';
import { BottomNavigation } from './components/Navigation/BottomNavigation';
import { MenuPlus } from './components/Navigation/MenuPlus';
import { Dashboard } from './components/Dashboard/Dashboard';
import { MoodPage } from './components/Mood/MoodPage';
import { HabitsPage } from './components/Habits/HabitsPage';
import { TasksPage } from './components/Tasks/TasksPage';
import { FocusPage } from './components/Focus/FocusPage';
import { CalendarPage } from './components/Calendar/CalendarPage';
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
      staleTime: 5 * 60 * 1000,
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
      <NavigationProvider activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="min-h-screen bg-background">
          <Header />
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          <main className="pb-16 md:pb-0 px-4 md:px-10">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'mood' && <MoodPage />}
            {activeTab === 'habits' && <HabitsPage />}
            {activeTab === 'tasks' && <TasksPage />}
            {activeTab === 'focus' && <FocusPage />}
            {activeTab === 'calendar' && <CalendarPage />}
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

          <BottomNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onPlusClick={() => setIsPlusMenuOpen(true)}
          />

          <MenuPlus
            isOpen={isPlusMenuOpen}
            onClose={() => setIsPlusMenuOpen(false)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </NavigationProvider>
    </QueryClientProvider>
  );
}

export default App;
