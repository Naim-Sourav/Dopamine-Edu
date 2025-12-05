
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HomeDashboard from './components/HomeDashboard';
import QuizArena from './components/QuizArena';
import AdmissionSearch from './components/AdmissionSearch';
import StudyTracker from './components/StudyTracker';
import SynapseBot from './components/SynapseBot';
import QuizBattlePrototype from './components/QuizBattlePrototype';
import CourseSection from './components/CourseSection';
import ExamPackSection from './components/ExamPackSection';
import AuthPage from './components/AuthPage';
import LandingPage from './components/LandingPage';
import ProfilePage from './components/ProfilePage';
import AdminPage from './components/AdminPage';
import LeaderboardPage from './components/LeaderboardPage';
import { AppView } from './types';
import { Menu, Loader2, ArrowLeft, GraduationCap } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSynapseOpen, setIsSynapseOpen] = useState(false);
  const [isAuthViewOpen, setIsAuthViewOpen] = useState(false); 
  
  const { currentUser, loading } = useAuth();
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Apply Theme Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const openSynapse = () => setIsSynapseOpen(true);
  const closeSynapse = () => setIsSynapseOpen(false);

  // Helper to get title based on view
  const getViewTitle = (view: AppView) => {
    switch (view) {
      case AppView.HOME: return 'ডোপামিন';
      case AppView.QUIZ: return 'কুইজ চ্যালেঞ্জ';
      case AppView.BATTLE: return 'ব্যাটল জোন';
      case AppView.ADMISSION: return 'ভর্তি তথ্য';
      case AppView.TRACKER: return 'স্টাডি ট্র্যাকার';
      case AppView.COURSE: return 'কোর্সসমূহ';
      case AppView.EXAM_PACK: return 'মডেল টেস্ট';
      case AppView.PROFILE: return 'প্রোফাইল';
      case AppView.ADMIN: return 'অ্যাডমিন প্যানেল';
      case AppView.LEADERBOARD: return 'লিডারবোর্ড';
      default: return 'ডোপামিন';
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-primary">
        <Loader2 size={48} className="animate-spin" />
      </div>
    );
  }

  // Not Logged In Logic
  if (!currentUser) {
    if (isAuthViewOpen) {
      return <AuthPage onBack={() => setIsAuthViewOpen(false)} />;
    }
    return <LandingPage onLoginClick={() => setIsAuthViewOpen(true)} />;
  }

  // Logged In: Show Main App
  const renderContent = () => {
    switch (currentView) {
      case AppView.HOME:
        return <HomeDashboard onNavigate={setCurrentView} onOpenSynapse={openSynapse} />;
      case AppView.QUIZ:
        return <QuizArena onNavigate={setCurrentView} />;
      case AppView.BATTLE:
        return <QuizBattlePrototype />;
      case AppView.ADMISSION:
        return <AdmissionSearch />;
      case AppView.TRACKER:
        return <StudyTracker />;
      case AppView.COURSE:
        return <CourseSection />;
      case AppView.EXAM_PACK:
        return <ExamPackSection />;
      case AppView.PROFILE:
        return <ProfilePage onNavigate={setCurrentView} />;
      case AppView.ADMIN:
        return <AdminPage />;
      case AppView.LEADERBOARD:
        return <LeaderboardPage />;
      case AppView.CONCEPT:
        return <HomeDashboard onNavigate={setCurrentView} onOpenSynapse={openSynapse} />; 
      default:
        return <HomeDashboard onNavigate={setCurrentView} onOpenSynapse={openSynapse} />;
    }
  };

  return (
    <AdminProvider>
      <div className="flex h-[100dvh] bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200 text-gray-900 dark:text-gray-100">
        <Navigation 
          currentView={currentView} 
          onNavigate={setCurrentView} 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          openAuthModal={() => {}} 
        />

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Mobile Header with Back Button Logic */}
          <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between transition-colors sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-3">
              {currentView !== AppView.HOME ? (
                <button 
                  onClick={() => setCurrentView(AppView.HOME)}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
              ) : (
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                  <GraduationCap size={20} />
                </div>
              )}
              <span className="font-bold text-gray-800 dark:text-white text-lg tracking-tight">
                {getViewTitle(currentView)}
              </span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-hidden p-0 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors relative">
            {renderContent()}
            {/* Global Synapse Bot Widget */}
            <SynapseBot isOpen={isSynapseOpen} onClose={closeSynapse} />
          </main>
        </div>
      </div>
    </AdminProvider>
  );
};

export default App;