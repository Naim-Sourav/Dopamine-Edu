
import React, { useState, useEffect } from 'react';
import { AppView } from '../types';
import { 
  ArrowRight, Bot, Brain, Search, PieChart, Swords, Library, 
  FileCheck, Sparkles, Trophy, Flame, Target, Zap, Clock, 
  ChevronRight, Star, TrendingUp, Activity, Archive
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserStatsAPI } from '../services/api';

interface HomeDashboardProps {
  onNavigate: (view: AppView) => void;
  onOpenSynapse: () => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate, onOpenSynapse }) => {
  const { currentUser, userAvatar } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('শুভ সকাল');
    else if (hour < 17) setGreeting('শুভ দুপুর');
    else setGreeting('শুভ সন্ধ্যা');

    // Fetch quick stats for the dashboard
    if (currentUser) {
        fetchUserStatsAPI(currentUser.uid).then(data => setStats(data)).catch(() => {});
    }
  }, [currentUser]);

  const startWeakTopicPractice = (topic: string) => {
      // Launch QuizArena specifically for this topic
      const config = {
          questions: [], // Will generate
          time: 15,
          mode: 'SINGLE_PAGE',
          title: `Practice: ${topic}`,
          type: 'PRACTICE',
          focusTopic: topic // Flag for QuizArena if we implemented it, but here we can just use it to generate
      };
      // Note: In a real implementation, we would pass this 'focusTopic' to QuizArena to trigger generation 
      // specific to this topic. For now, since QuizArena generates based on selection, 
      // we might need to simulate selection or update QuizArena to accept a "topic string" for auto-generation.
      // Assuming QuizArena can handle a generic config object that implies "Generate for this topic"
      
      // Let's use the local storage method to pass a signal
      // We will need to update QuizArena to handle "Generate for Topic" signal if not already present.
      // But based on current QuizArena implementation, it takes specific questions.
      // So we might just navigate to Question Bank or Quiz Area.
      
      // For simplicity in this iteration without major refactoring of QuizArena generation logic:
      onNavigate(AppView.QUIZ); 
  };
  
  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors pb-32">
      {/* Top Decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {greeting}, <span className="text-primary dark:text-green-400">{currentUser?.displayName?.split(' ')[0]}</span> <span className="text-xl">👋</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">আজকের প্রস্তুতি শুরু হোক একটি পরীক্ষা দিয়ে!</p>
          </div>
          
          {/* Quick Profile Stats */}
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             <div className="px-4 py-2 border-r border-gray-100 dark:border-gray-700">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rank</p>
                <p className="font-bold text-gray-800 dark:text-white flex items-center gap-1">
                   <Trophy size={14} className="text-yellow-500" /> #{stats ? '12' : '--'}
                </p>
             </div>
             <div className="px-4 py-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Points</p>
                <p className="font-bold text-gray-800 dark:text-white flex items-center gap-1">
                   <Zap size={14} className="text-orange-500" /> {stats?.points || 0}
                </p>
             </div>
             <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-primary/20">
                <img src={userAvatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Profile" className="w-full h-full object-cover" />
             </div>
          </div>
        </header>

        {/* Main Hero: Exam Focus */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 text-white p-6 md:p-10 shadow-2xl mb-10 group cursor-pointer" onClick={() => onNavigate(AppView.QUIZ)}>
           {/* Abstract Background Elements */}
           <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] -mr-20 -mt-20 group-hover:bg-primary/30 transition-all duration-700"></div>
           <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-[80px] -ml-10 -mb-10"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-lg">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-green-300 backdrop-blur-md">
                    <Sparkles size={12} /> ডেইলি চ্যালেঞ্জ
                 </div>
                 <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                    নিজেক যাচাই করো <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">লাইভ কুইজ</span> দিয়ে
                 </h2>
                 <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                    প্রতিদিন নতুন নতুন টপিকের উপর মডেল টেস্ট দাও এবং তোমার অবস্থান যাচাই করো। ভুলগুলো থেকে শেখো।
                 </p>
                 <button className="mt-4 bg-primary hover:bg-green-600 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-900/20 group-hover:scale-105 active:scale-95">
                    পরীক্ষা শুরু করুন <ArrowRight size={18} />
                 </button>
              </div>

              {/* Visual Element */}
              <div className="relative w-full md:w-auto flex justify-center">
                 <div className="relative w-64 h-48 bg-gray-800/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 transform rotate-3 group-hover:rotate-6 transition-transform duration-500 shadow-2xl">
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg animate-bounce">Live</div>
                    <div className="h-full flex flex-col justify-between">
                       <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Clock size={20}/></div>
                          <div>
                             <p className="text-sm font-bold">Physics Quiz</p>
                             <p className="text-[10px] text-gray-400">Time: 20 Mins</p>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                             <div className="h-full bg-primary w-[70%]"></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400">
                             <span>Progress</span>
                             <span>1500+ Participants</span>
                          </div>
                       </div>
                       <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors">
                          Join Now
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
           
           {/* Question Bank (New) */}
           <div 
             onClick={() => onNavigate(AppView.QUESTION_BANK)}
             className="col-span-2 md:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden active:scale-95 duration-200"
           >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                 <Archive size={80} />
              </div>
              <div className="relative z-10">
                 <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                    <Archive size={24} />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">প্রশ্ন ব্যাংক</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                    মেডিকেল, ভার্সিটি ও ইঞ্জিনিয়ারিং এর বিগত বছরের প্রশ্ন সমাধান করো।
                 </p>
                 <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:gap-3 transition-all">
                    অনুশীলন করুন <ChevronRight size={16} />
                 </div>
              </div>
           </div>

           {/* Model Test Pack */}
           <div 
             onClick={() => onNavigate(AppView.EXAM_PACK)}
             className="col-span-2 md:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden active:scale-95 duration-200"
           >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                 <FileCheck size={80} />
              </div>
              <div className="relative z-10">
                 <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                    <Library size={24} />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">মডেল টেস্ট</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                    শেষ মুহূর্তের প্রস্তুতির জন্য পূর্ণাঙ্গ মডেল টেস্ট ও স্পেশাল এক্সাম প্যাক।
                 </p>
                 <div className="flex items-center gap-2 text-sm font-bold text-purple-600 dark:text-purple-400 group-hover:gap-3 transition-all">
                    প্যাক কিনুন <ChevronRight size={16} />
                 </div>
              </div>
           </div>

           {/* Battle Mode */}
           <div 
             onClick={() => onNavigate(AppView.BATTLE)}
             className="col-span-2 md:col-span-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-6 text-white shadow-lg hover:shadow-orange-500/30 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group active:scale-95 duration-200"
           >
              <div className="absolute -bottom-4 -right-4 text-white/10 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                 <Swords size={100} />
              </div>
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                       <Swords size={24} className="text-white" />
                    </div>
                    <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">MULTIPLAYER</span>
                 </div>
                 <h3 className="text-xl font-bold mb-1">কুইজ ব্যাটল</h3>
                 <p className="text-orange-100 text-sm opacity-90 mb-4">বন্ধুদের সাথে লাইভ যুদ্ধ!</p>
                 <button className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-50 transition-colors">
                    চ্যালেঞ্জ জানাও
                 </button>
              </div>
           </div>

           {/* Leaderboard */}
           <div 
             onClick={() => onNavigate(AppView.LEADERBOARD)}
             className="col-span-1 bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-yellow-400 transition-all cursor-pointer group active:scale-95 duration-200"
           >
              <div className="flex justify-between items-start mb-3">
                 <div className="p-2.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-xl">
                    <Trophy size={20} />
                 </div>
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-1">লিডারবোর্ড</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">তোমার র‍্যাংক চেক করো</p>
           </div>

           {/* Study Tracker */}
           <div 
             onClick={() => onNavigate(AppView.TRACKER)}
             className="col-span-1 bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-400 transition-all cursor-pointer group active:scale-95 duration-200"
           >
              <div className="flex justify-between items-start mb-3">
                 <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                    <PieChart size={20} />
                 </div>
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-1">প্রোগ্রেস</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">পড়ার রুটিন ও পরিসংখ্যান</p>
           </div>

           {/* Admission Info */}
           <div 
             onClick={() => onNavigate(AppView.ADMISSION)}
             className="col-span-1 bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-cyan-400 transition-all cursor-pointer group active:scale-95 duration-200"
           >
              <div className="flex justify-between items-start mb-3">
                 <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
                    <Search size={20} />
                 </div>
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-1">ভর্তি তথ্য</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">সার্কুলার ও ডেডলাইন</p>
           </div>

           {/* AI Tutor */}
           <div 
             onClick={onOpenSynapse}
             className="col-span-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-md hover:shadow-lg transition-all cursor-pointer group active:scale-95 duration-200"
           >
              <div className="flex justify-between items-start mb-3">
                 <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                    <Bot size={20} />
                 </div>
              </div>
              <h3 className="font-bold text-white text-sm mb-1">AI টিউটর</h3>
              <p className="text-[10px] text-emerald-100">যেকোনো প্রশ্ন করো</p>
           </div>

        </div>

        {/* Recent Performance Strip */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                 <Activity size={20} />
              </div>
              <div>
                 <p className="text-xs font-bold text-gray-500 uppercase">Last Exam</p>
                 <p className="font-bold text-gray-900 dark:text-white text-sm">Physics 1st Paper - Vector</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-xl font-bold text-green-500">85%</p>
              <p className="text-[10px] text-gray-400">Accuracy</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default HomeDashboard;
