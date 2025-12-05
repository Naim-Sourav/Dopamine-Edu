
import React, { useState, useEffect } from 'react';
import { Bot, Brain, PieChart, Sparkles, GraduationCap, ArrowRight, CheckCircle2, Trophy, Swords, Zap, Users, Crown, Rocket, Star, ShieldCheck, Play, Activity, BookOpen } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

// --- SUB-COMPONENTS ---

const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

const UniversityMarquee = () => {
  const unis = ["BUET", "DMC", "Dhaka University", "RUET", "KUET", "CUET", "SUST", "Jahangirnagar", "Rajshahi University", "Chittagong University", "GST", "AFMC"];
  return (
    <div className="w-full overflow-hidden bg-gray-50/50 dark:bg-gray-900/50 py-4 border-y border-gray-100 dark:border-gray-800">
      <div className="flex w-[200%] animate-marquee whitespace-nowrap">
        {unis.concat(unis).map((uni, i) => (
          <div key={i} className="mx-8 flex items-center gap-2 text-gray-400 font-bold text-lg uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity cursor-default">
            <GraduationCap size={20} /> {uni}
          </div>
        ))}
      </div>
      <style>{`
        .animate-marquee { animation: marquee 30s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
};

const TypewriterText = () => {
  const words = ["মেডিকেল", "ইঞ্জিনিয়ারিং", "ভার্সিটি 'ক'", "HSC একাডেমিক"];
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [blink, setBlink] = useState(true);
  const [reverse, setReverse] = useState(false);

  // Blinking cursor
  useEffect(() => {
    const timeout = setTimeout(() => setBlink(!blink), 500);
    return () => clearTimeout(timeout);
  }, [blink]);

  // Typing logic
  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), 1000);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 75 : 150);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words]);

  return (
    <span className="text-primary dark:text-green-400">
      {words[index].substring(0, subIndex)}
      <span className={`${blink ? 'opacity-100' : 'opacity-0'} transition-opacity`}>|</span>
    </span>
  );
};

// --- MAIN COMPONENT ---

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  return (
    <div className="h-screen w-full overflow-y-auto bg-white dark:bg-gray-900 font-sans text-gray-900 dark:text-white transition-colors scroll-smooth selection:bg-primary/30">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer group">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/40 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-br from-primary to-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl relative z-10 shadow-inner">
                শি
                </div>
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight block group-hover:text-primary transition-colors">শিক্ষা সহায়ক</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={onLoginClick}
              className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-green-400 hidden sm:block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              লগইন
            </button>
            <button 
              onClick={onLoginClick}
              className="px-4 py-2 md:px-6 md:py-2.5 bg-primary hover:bg-green-700 text-white font-bold text-sm md:text-base rounded-xl transition-all shadow-lg shadow-green-900/20 active:scale-95 flex items-center gap-2 group border border-transparent hover:border-green-400/30"
            >
              রেজিস্ট্রেশন <ArrowRight size={16} className="md:w-[18px] md:h-[18px] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-24 md:pb-32 px-4 md:px-6 overflow-hidden">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
        
        {/* Moving Blobs */}
        <div className="absolute top-20 left-10 w-48 h-48 md:w-72 md:h-72 bg-purple-500/20 rounded-full blur-[80px] md:blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 md:w-96 md:h-96 bg-primary/10 rounded-full blur-[100px] md:blur-[120px] animate-pulse delay-1000"></div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 text-primary dark:text-green-400 font-bold text-[10px] md:text-sm mb-6 md:mb-8 border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:scale-105 transition-transform cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            বাংলাদেশের ১ নম্বর AI লার্নিং প্ল্যাটফর্ম
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 md:mb-8 leading-tight tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 text-gray-900 dark:text-white">
            স্বপ্ন এখন হাতের মুঠোয়<br/>
            <span className="block mt-2">প্রস্তুতি হোক <TypewriterText /></span>
          </h1>
          
          <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 px-4">
            Ostad AI টিউটর, রিয়েল-টাইম কুইজ ব্যাটল এবং স্মার্ট প্রোগ্রেস ট্র্যাকিং এর সাথে নিজেকে প্রস্তুত করো বুয়েট, মেডিকেল বা ঢাকা ভার্সিটির জন্য।
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 w-full sm:w-auto px-4">
            <button 
              onClick={onLoginClick}
              className="w-full sm:w-auto px-6 py-3.5 md:px-8 md:py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl md:rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 md:gap-3 text-base md:text-lg shadow-xl shadow-gray-500/20"
            >
              <Zap size={20} className="fill-yellow-400 text-yellow-400 md:w-[22px] md:h-[22px]" /> বিনামূল্যে শুরু করুন
            </button>
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-6 py-3.5 md:px-8 md:py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-bold rounded-xl md:rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 group"
            >
              <Play size={18} className="group-hover:text-primary transition-colors md:w-5 md:h-5" /> ডেমো দেখুন
            </button>
          </div>

          {/* Animated Stats */}
          <div className="mt-12 md:mt-20 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm max-w-4xl mx-auto animate-in fade-in zoom-in duration-1000 delay-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                  <div className="text-center">
                      <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-1"><AnimatedCounter end={10000} suffix="+" /></p>
                      <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider">শিক্ষার্থী</p>
                  </div>
                  <div className="text-center border-l border-gray-200 dark:border-gray-700">
                      <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-1"><AnimatedCounter end={50} suffix="L+" /></p>
                      <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider">কুইজ সলভ</p>
                  </div>
                  <div className="text-center border-l-0 md:border-l border-gray-200 dark:border-gray-700 pt-4 md:pt-0 border-t md:border-t-0">
                      <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-1"><AnimatedCounter end={500} suffix="+" /></p>
                      <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider">লেকচার নোট</p>
                  </div>
                  <div className="text-center border-l border-gray-200 dark:border-gray-700 pt-4 md:pt-0 border-t md:border-t-0">
                      <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-1">৪.৯</p>
                      <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">ইউজার রেটিং <Star size={10} className="fill-yellow-400 text-yellow-400"/></p>
                  </div>
              </div>
          </div>
        </div>
      </section>

      {/* Infinite Scroll Marquee */}
      <UniversityMarquee />

      {/* Bento Grid Features */}
      <section id="features" className="py-16 md:py-24 px-4 md:px-6 relative">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">কেন আমরাই সেরা?</h2>
                <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">সনাতন পদ্ধতি বাদ দাও, স্মার্ট লার্নিং মেথডে এগিয়ে যাও। আমাদের ফিচারগুলো তোমাকে অন্যদের চেয়ে এগিয়ে রাখবে।</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-6 gap-4 md:gap-6 md:grid-rows-2 h-auto md:h-[600px]">
                
                {/* Feature 1: Ostad AI (Large) */}
                <div className="md:col-span-4 row-span-2 bg-gradient-to-br from-emerald-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group min-h-[400px]">
                    <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-8 shadow-md group-hover:scale-110 transition-transform duration-300">
                                <Bot size={28} className="md:w-9 md:h-9" />
                            </div>
                            <h3 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">Ostad AI (AI Tutor)</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg leading-relaxed max-w-md">
                                প্রাইভেট টিউটরের জন্য আর অপেক্ষা নয়। ২৪/৭ যেকোনো কঠিন টপিক বুঝে নাও আমাদের Ostad AI এর কাছে। ছবি তুলে পাঠাও বা চ্যাট করো। এটি তোমাকে স্টেপ-বাই-স্টেপ সমাধান দিবে।
                            </p>
                        </div>
                        <button onClick={onLoginClick} className="mt-6 md:mt-8 w-fit bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 md:px-6 md:py-3 rounded-xl font-bold flex items-center gap-2 group-hover:gap-4 transition-all text-sm md:text-base">
                            চ্যাট শুরু করুন <ArrowRight size={18} className="md:w-5 md:h-5" />
                        </button>
                    </div>
                    {/* Abstract UI Mockup */}
                    <div className="absolute -bottom-10 -right-10 md:w-80 md:h-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl p-4 rotate-6 group-hover:rotate-3 transition-transform duration-500 hidden md:block">
                        <div className="flex gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="space-y-3">
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg rounded-tl-none text-xs w-3/4">ভেক্টর চ্যাপ্টারের নৌকা-নদীর ম্যাথটা বুঝিয়ে দাও...</div>
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 p-3 rounded-lg rounded-tr-none text-xs self-end ml-auto w-5/6">অবশ্যই! মনে করো স্রোতের বেগ u এবং নৌকার বেগ v...</div>
                        </div>
                    </div>
                </div>

                {/* Feature 2: Battle (Medium) */}
                <div className="md:col-span-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-lg hover:shadow-orange-500/30 hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden group min-h-[200px]" onClick={onLoginClick}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4 md:mb-6">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center">
                                <Swords size={20} className="md:w-7 md:h-7 text-white" />
                            </div>
                            <span className="bg-white/20 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold backdrop-blur-sm animate-pulse">LIVE</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">কুইজ ব্যাটল</h3>
                        <p className="text-orange-100 text-xs md:text-sm mb-2 md:mb-4">বন্ধুদের চ্যালেঞ্জ করো এবং লাইভ ১ বনাম ১ কুইজ খেলে পয়েন্ট জিতো।</p>
                    </div>
                    <div className="absolute -bottom-6 -right-6 text-white/10 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                        <Swords size={80} className="md:w-[120px] md:h-[120px]" />
                    </div>
                </div>

                {/* Feature 3: Tracker (Medium) */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group overflow-hidden relative min-h-[200px]">
                    <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all"></div>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                        <PieChart size={20} className="md:w-7 md:h-7" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 text-gray-900 dark:text-white">স্টাডি ট্র্যাকার</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">প্রতিদিনের পড়ার রুটিন এবং প্রোগ্রেস ট্র্যাক করো। ফোকাস মোড ব্যবহার করে পড়াশুনার গতি বাড়াও।</p>
                    <div className="mt-4 h-1.5 md:h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-2/3 rounded-full animate-[shimmer_2s_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)]"></div>
                    </div>
                </div>

            </div>
        </div>
      </section>

      {/* Gamification Section */}
      <section className="py-16 md:py-20 px-4 md:px-6 bg-gray-900 text-white relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-gray-900 to-gray-900"></div>
         <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-12">
                <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 font-bold text-xs md:text-sm">
                        <Crown size={14} className="md:w-4 md:h-4" /> লিডারবোর্ড ও রিওয়ার্ড
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold">সেরাদের তালিকায়<br/>তুমি কোথায়?</h2>
                    <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                        শুধুমাত্র পড়াশোনা নয়, শেখাটাকে আমরা করেছি গেমের মতো মজাদার। কুইজ দিয়ে পয়েন্ট অর্জন করো, লেভেল আপ করো এবং ব্রোঞ্জ থেকে লিজেন্ড লিগে প্রমোশন নাও। টপ পারফরমারদের জন্য থাকছে বিশেষ পুরস্কার।
                    </p>
                    <button onClick={onLoginClick} className="bg-yellow-500 text-gray-900 px-6 py-2.5 md:px-8 md:py-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] text-sm md:text-base">
                        লিডারবোর্ড দেখুন
                    </button>
                </div>
                
                <div className="flex-1 relative w-full flex justify-center">
                    <div className="relative z-10 grid grid-cols-3 gap-2 md:gap-4 items-end max-w-sm">
                        {/* Silver */}
                        <div className="flex flex-col items-center transform translate-y-6 md:translate-y-8">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-gray-400 bg-gray-800 mb-2 overflow-hidden shadow-lg"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jack" alt="User" /></div>
                            <div className="bg-gray-700 w-20 h-24 md:w-24 md:h-32 rounded-t-xl border-t-4 border-gray-400 flex items-end justify-center pb-2 md:pb-4 shadow-xl">
                                <span className="text-2xl md:text-3xl font-bold text-gray-400">2</span>
                            </div>
                        </div>
                        {/* Gold */}
                        <div className="flex flex-col items-center relative z-20">
                            <Crown size={32} className="text-yellow-400 absolute -top-10 md:-top-12 animate-bounce md:w-10 md:h-10" fill="currentColor" />
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-yellow-400 bg-gray-800 mb-2 overflow-hidden shadow-xl shadow-yellow-500/20"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" /></div>
                            <div className="bg-gray-800 w-24 h-36 md:w-28 md:h-48 rounded-t-xl border-t-4 border-yellow-400 flex items-end justify-center pb-2 md:pb-4 shadow-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent"></div>
                                <span className="text-4xl md:text-5xl font-bold text-yellow-400">1</span>
                            </div>
                        </div>
                        {/* Bronze */}
                        <div className="flex flex-col items-center transform translate-y-8 md:translate-y-12">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-amber-700 bg-gray-800 mb-2 overflow-hidden shadow-lg"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="User" /></div>
                            <div className="bg-gray-700 w-20 h-16 md:w-24 md:h-24 rounded-t-xl border-t-4 border-amber-700 flex items-end justify-center pb-2 md:pb-4 shadow-xl">
                                <span className="text-2xl md:text-3xl font-bold text-amber-700">3</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </section>

      {/* Courses Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-white dark:bg-gray-900">
         <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-12">
               <div className="space-y-2 w-full md:w-auto">
                  <div className="flex items-center gap-2 text-primary font-bold tracking-wider uppercase text-xs md:text-sm">
                      <BookOpen size={14} className="md:w-4 md:h-4"/> প্রিমিয়াম ব্যাচসমূহ
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">তোমার লক্ষ্য কী?</h2>
                  <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">বিশেষজ্ঞ মেন্টরদের গাইডলাইনে কমপ্লিট প্রিপারেশন নাও</p>
               </div>
               <button onClick={onLoginClick} className="text-gray-900 dark:text-white font-bold hover:text-primary mt-4 md:mt-0 flex items-center gap-2 group border-b-2 border-transparent hover:border-primary transition-all text-sm md:text-base">
                  সব কোর্স দেখুন <ArrowRight size={16} className="md:w-[18px] md:h-[18px] group-hover:translate-x-1 transition-transform"/>
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
               {[
                 { title: "মেডিকেল ভর্তি প্রস্তুতি", color: "bg-green-100 text-green-700", icon: <Activity/>, price: "৳৩,৫০০", students: "৮৫০+" },
                 { title: "ইঞ্জিনিয়ারিং মাস্টারক্লাস", color: "bg-blue-100 text-blue-700", icon: <Zap/>, price: "৳৪,০০০", students: "৬২০+" },
                 { title: "ভার্সিটি 'ক' ইউনিট", color: "bg-orange-100 text-orange-700", icon: <GraduationCap/>, price: "৳২,০০০", students: "৯৮০+" },
                 { title: "HSC একাডেমিক ব্যাচ", color: "bg-purple-100 text-purple-700", icon: <BookOpen/>, price: "৳২,৫০০", students: "১২৫০+" }
               ].map((course, idx) => (
                  <div key={idx} className="p-5 md:p-6 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer bg-white dark:bg-gray-800 flex flex-col h-full" onClick={onLoginClick}>
                     <div className={`w-full h-24 md:h-32 ${course.color} rounded-2xl mb-4 md:mb-6 flex items-center justify-center text-3xl md:text-4xl group-hover:scale-105 transition-transform duration-300`}>
                        {course.icon}
                     </div>
                     <h4 className="font-bold text-lg md:text-xl mb-1 md:mb-2 dark:text-white line-clamp-1">{course.title}</h4>
                     <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-3 md:mb-4">
                        <Users size={12} className="md:w-3.5 md:h-3.5" /> {course.students} শিক্ষার্থী
                     </div>
                     <div className="mt-auto flex items-center justify-between pt-3 md:pt-4 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-primary font-bold text-base md:text-lg">{course.price}</p>
                        <button className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors">
                            <ArrowRight size={14} className="md:w-4 md:h-4" />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 px-4 md:px-6">
         <div className="max-w-5xl mx-auto bg-gradient-to-r from-primary to-emerald-700 rounded-[2rem] md:rounded-[3rem] p-8 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-emerald-500/20">
            {/* Abstract Shapes */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
               <h2 className="text-3xl md:text-6xl font-extrabold mb-4 md:mb-6 tracking-tight">দেরি করছো কেন?</h2>
               <p className="text-base md:text-xl text-green-100 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
                  হাজারো শিক্ষার্থী ইতিমধ্যে তাদের প্রস্তুতি শুরু করে দিয়েছে। তুমি কি পিছিয়ে থাকবে? আজই জয়েন করো শিক্ষা সহায়ক পরিবারে।
               </p>
               <button 
                 onClick={onLoginClick}
                 className="bg-white text-primary px-8 py-3.5 md:px-10 md:py-4 rounded-xl md:rounded-2xl font-bold text-lg md:text-xl hover:bg-green-50 hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-2 md:gap-3 mx-auto w-full sm:w-auto"
               >
                 <Rocket size={20} className="md:w-6 md:h-6" /> একাউন্ট তৈরি করুন
               </button>
               <p className="mt-4 md:mt-6 text-xs md:text-sm text-green-200 opacity-80 font-medium">ক্রেডিট কার্ড লাগবে না • ১০০% ফ্রি ট্রায়াল</p>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 md:mb-6 opacity-80">
           <div className="h-7 w-7 md:h-8 md:w-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm md:text-base">
             শি
           </div>
           <span className="font-bold text-lg md:text-xl text-gray-800 dark:text-white">শিক্ষা সহায়ক</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-6 md:mb-8 text-sm text-gray-500">
            <a href="#" className="hover:text-primary transition-colors">আমাদের সম্পর্কে</a>
            <a href="#" className="hover:text-primary transition-colors">কোর্সসমূহ</a>
            <a href="#" className="hover:text-primary transition-colors">যোগাযোগ</a>
            <a href="#" className="hover:text-primary transition-colors">প্রাইভেসি পলিসি</a>
        </div>
        <p className="text-gray-400 text-xs md:text-sm">© 2024 Shikkha Shohayok. Made with ❤️ for Students in Bangladesh.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
