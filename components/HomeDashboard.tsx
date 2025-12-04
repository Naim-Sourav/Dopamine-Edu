
import React from 'react';
import { AppView } from '../types';
import { ArrowRight, Bot, Brain, Search, PieChart, Swords, Library, FileCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HomeDashboardProps {
  onNavigate: (view: AppView) => void;
  onOpenSynapse: () => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate, onOpenSynapse }) => {
  const { currentUser } = useAuth();
  
  return (
    <div className="h-full overflow-y-auto p-6 pb-40 md:p-10 scroll-smooth">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-3">
            স্বাগতম, <span className="text-primary dark:text-green-400">{currentUser?.displayName || 'ভবিষ্যৎ লিডার!'}</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            তোমার HSC এবং এডমিশন প্রস্তুতির স্মার্ট সঙ্গী। আজ তুমি কি শিখতে চাও?
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {/* Card 1: Synapse (Replaces Concept Tutor) */}
          <div 
            onClick={onOpenSynapse}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-lg dark:hover:shadow-emerald-900/20 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                <Bot size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Synapse (AI)</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm line-clamp-2">
                যেকোনো প্রশ্নের উত্তর বা ডাউট সলভ করতে Synapse এর সাথে কথা বলো।
              </p>
              <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium text-sm group-hover:gap-2 transition-all">
                জিজ্ঞেস করুন <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </div>

          {/* Card 2: Course Section (New) */}
          <div 
            onClick={() => onNavigate(AppView.COURSE)}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-lg dark:hover:shadow-indigo-900/20 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                <Library size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">প্রিমিয়াম কোর্স</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm line-clamp-2">
                HSC ও এডমিশন প্রস্তুতির স্পেশাল ব্যাচে ভর্তি হও। ডেইলি ও উইকলি এক্সাম।
              </p>
              <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium text-sm group-hover:gap-2 transition-all">
                কোর্স দেখুন <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </div>

          {/* Card 3: Model Tests (Exam Packs) */}
          <div 
            onClick={() => onNavigate(AppView.EXAM_PACK)}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-pink-500/50 dark:hover:border-pink-500/50 hover:shadow-lg dark:hover:shadow-pink-900/20 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 dark:bg-pink-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center mb-4">
                <FileCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">মডেল টেস্ট</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm line-clamp-2">
                শেষ মুহূর্তের প্রস্তুতির জন্য এক্সাম প্যাক কিনুন। প্রশ্ন ব্যাংক সলভ ও মডেল টেস্ট।
              </p>
              <div className="flex items-center text-pink-600 dark:text-pink-400 font-medium text-sm group-hover:gap-2 transition-all">
                প্যাক দেখুন <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </div>

          {/* Card 4: Quiz */}
          <div 
            onClick={() => onNavigate(AppView.QUIZ)}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-secondary/50 dark:hover:border-red-500/50 hover:shadow-lg dark:hover:shadow-red-900/20 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 text-secondary dark:text-red-400 rounded-xl flex items-center justify-center mb-4">
                <Brain size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">কুইজ চ্যালেঞ্জ</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm line-clamp-2">
                নিজেকে যাচাই করো। যেকোনো বিষয়ের ওপর কুইজ তৈরি করে পরীক্ষা দাও।
              </p>
              <div className="flex items-center text-secondary dark:text-red-400 font-medium text-sm group-hover:gap-2 transition-all">
                যাচাই করুন <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </div>

          {/* Card 5: Battle */}
          <div 
            onClick={() => onNavigate(AppView.BATTLE)}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-orange-500/50 dark:hover:border-orange-400/50 hover:shadow-lg dark:hover:shadow-orange-900/20 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center mb-4">
                <Swords size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">কুইজ ব্যাটল</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm line-clamp-2">
                বন্ধুদের সাথে লাইভ কুইজ খেলে নিজের মেধা যাচাই করো। (Beta)
              </p>
              <div className="flex items-center text-orange-600 dark:text-orange-400 font-medium text-sm group-hover:gap-2 transition-all">
                ব্যাটল করুন <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </div>

          {/* Card 6: Tracker */}
          <div 
            onClick={() => onNavigate(AppView.TRACKER)}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-500/50 dark:hover:border-purple-400/50 hover:shadow-lg dark:hover:shadow-purple-900/20 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4">
                <PieChart size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">পড়ার রুটিন</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm line-clamp-2">
                প্রতিদিনের পড়ার হিসাব রাখুন এবং নিজের অগ্রগতি ট্র্যাক করুন।
              </p>
              <div className="flex items-center text-purple-600 dark:text-purple-400 font-medium text-sm group-hover:gap-2 transition-all">
                লগ করুন <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </div>

          {/* Card 7: Admission */}
          <div 
            onClick={() => onNavigate(AppView.ADMISSION)}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-lg dark:hover:shadow-blue-900/20 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
                <Search size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">ভর্তি তথ্য</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm line-clamp-2">
                ভর্তি পরীক্ষার তারিখ, যোগ্যতা এবং সিলেবাস খুঁজুন রিয়েল-টাইম তথ্যের সাহায্যে।
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:gap-2 transition-all">
                তথ্য খুঁজুন <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-xl">
          <div className="mb-6 md:mb-0 md:mr-6">
            <h2 className="text-2xl font-bold mb-2">প্রস্তুতি হোক গোছানো</h2>
            <p className="text-gray-400 max-w-lg">
              আমাদের AI টিউটর ২৪/৭ তোমার পাশে আছে। যেকোনো সময়, যেকোনো প্রশ্ন।
            </p>
          </div>
          <button 
            onClick={onOpenSynapse}
            className="bg-primary hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition-colors whitespace-nowrap shadow-lg shadow-green-900/50"
          >
            চ্যাট শুরু করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
