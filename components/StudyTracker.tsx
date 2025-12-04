import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Subject, StudySession, TodoItem } from '../types';
import { 
  Plus, Clock, TrendingUp, Trash2, Calendar, 
  Play, Pause, Square, CheckSquare, ListTodo,
  Timer, History, BarChart3, X, Zap, Trophy, Target,
  Flame, BookOpen, MoreVertical, LayoutDashboard,
  Maximize2, Minimize2, ChevronRight, PenLine, StopCircle,
  Focus, Activity
} from 'lucide-react';

const StudyTracker: React.FC = () => {
  // --- Global State ---
  const [view, setView] = useState<'DASHBOARD' | 'HISTORY' | 'PLANNER'>('DASHBOARD');
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [dailyGoal, setDailyGoal] = useState<number>(6); // Hours

  // --- Timer State (Persistent) ---
  const [activeSession, setActiveSession] = useState<{
    subject: Subject;
    topic: string;
    startTime: number;
    pausedAt?: number;
  } | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // --- 1. Load Data on Mount ---
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('study_sessions');
      if (savedSessions) setSessions(JSON.parse(savedSessions));

      const savedTodos = localStorage.getItem('study_todos');
      if (savedTodos) setTodos(JSON.parse(savedTodos));
      
      const savedGoal = localStorage.getItem('daily_goal');
      if (savedGoal) setDailyGoal(parseInt(savedGoal));

      const savedActiveSession = localStorage.getItem('active_session');
      if (savedActiveSession) {
        const session = JSON.parse(savedActiveSession);
        setActiveSession(session);
        setIsFocusMode(true); // Auto open focus mode on resume
        const now = Date.now();
        const diff = Math.floor((now - session.startTime) / 1000);
        setElapsedSeconds(diff > 0 ? diff : 0);
      }
    } catch (e) {
      console.error("Error loading study data:", e);
    }
  }, []);

  // --- 2. Save Data on Change ---
  useEffect(() => {
    localStorage.setItem('study_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('study_todos', JSON.stringify(todos));
  }, [todos]);
  
  useEffect(() => {
    localStorage.setItem('daily_goal', dailyGoal.toString());
  }, [dailyGoal]);

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('active_session', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('active_session');
    }
  }, [activeSession]);

  // --- 3. Timer Ticking Logic ---
  useEffect(() => {
    if (activeSession) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);

      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - activeSession.startTime) / 1000);
        setElapsedSeconds(diff > 0 ? diff : 0);
      }, 1000);
    } else {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setElapsedSeconds(0);
    }

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [activeSession]);

  // --- Timer Actions ---
  const startSession = (subject: Subject) => {
    if (activeSession) return;

    const newActiveSession = {
      subject,
      topic: '',
      startTime: Date.now()
    };
    setActiveSession(newActiveSession);
    setIsFocusMode(true);
  };

  const stopSession = () => {
    if (!activeSession) return;

    if (elapsedSeconds < 10) { 
      if (!window.confirm("খুব অল্প সময়ের সেশন (১০ সেকেন্ডের কম)। আপনি কি এটি বাতিল করতে চান?")) {
        return;
      }
      setActiveSession(null);
      setIsFocusMode(false);
      return;
    }

    const durationMin = Math.floor(elapsedSeconds / 60);
    const finalDuration = durationMin === 0 ? 1 : durationMin; 

    const newSession: StudySession = {
      id: Date.now().toString(),
      subject: activeSession.subject,
      topic: activeSession.topic || 'Self Study',
      durationMinutes: finalDuration,
      timestamp: Date.now()
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSession(null);
    setIsFocusMode(false);
  };

  const updateTimerTopic = (text: string) => {
    if (activeSession) {
      setActiveSession({ ...activeSession, topic: text });
    }
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatMinimalTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // --- Planner Logic ---
  const handleAddTodo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('todoText') as HTMLInputElement;
    const text = input.value.trim();
    
    if (!text) return;
    
    const newItem: TodoItem = {
      id: Date.now().toString(),
      text: text,
      completed: false
    };
    setTodos(prev => [newItem, ...prev]);
    input.value = '';
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  // --- Stats & Helpers ---
  const today: number = new Date().setHours(0,0,0,0);
  
  const subjectTimesToday: Record<string, number> = useMemo(() => {
    const times: Record<string, number> = {};
    Object.values(Subject).forEach(s => times[s as string] = 0);

    sessions.forEach(s => {
      const sessionDate = new Date(s.timestamp).setHours(0,0,0,0);
      if (sessionDate === today) {
        const currentVal = times[s.subject] || 0;
        times[s.subject] = currentVal + Number(s.durationMinutes);
      }
    });
    return times;
  }, [sessions, today]);

  const totalMinutesToday = Object.values(subjectTimesToday).reduce((a: number, b: number) => a + b, 0);

  // Streak Calculation
  const streak = useMemo(() => {
    if (sessions.length === 0) return 0;
    
    const uniqueDates = new Set<number>(
      sessions.map(s => new Date(s.timestamp).setHours(0,0,0,0))
    );
    
    const sortedDates = Array.from(uniqueDates).sort((a: number, b: number) => b - a);
    let currentStreak = 0;
    let checkDate: number = today; // Start checking from today

    // Check if studied today
    if (sortedDates.includes(today)) {
      currentStreak++;
      checkDate -= 86400000; // Move to yesterday
    } else {
        // If not studied today yet, check if studied yesterday to maintain streak
        checkDate -= 86400000; 
        if (!sortedDates.includes(checkDate)) return 0;
    }

    // Count backwards
    while (sortedDates.includes(checkDate)) {
      currentStreak++;
      checkDate -= 86400000;
    }
    
    return currentStreak;
  }, [sessions, today]);

  const getSubjectStyle = (subject: string) => {
    if (subject.includes('Physics')) return { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-200', ring: 'ring-purple-500' };
    if (subject.includes('Chemistry')) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-200', ring: 'ring-orange-500' };
    if (subject.includes('Math')) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200', ring: 'ring-blue-500' };
    if (subject.includes('Biology')) return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-200', ring: 'ring-green-500' };
    return { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-200', ring: 'ring-gray-500' };
  };

  // --- VIEW: FOCUS MODE OVERLAY ---
  if (isFocusMode && activeSession) {
    const style = getSubjectStyle(activeSession.subject);
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-gray-900 relative overflow-hidden transition-all duration-500">
        {/* Ambient Background */}
        <div className={`absolute inset-0 opacity-10 dark:opacity-20 bg-gradient-to-br ${style.color.includes('purple') ? 'from-purple-500 to-indigo-500' : style.color.includes('orange') ? 'from-orange-500 to-red-500' : style.color.includes('blue') ? 'from-blue-500 to-cyan-500' : 'from-green-500 to-emerald-500'}`}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-md p-8 flex flex-col items-center text-center">
            
            {/* Subject Badge */}
            <div className={`mb-8 px-4 py-1.5 rounded-full ${style.bg} ${style.color} font-bold text-sm border ${style.border} dark:border-transparent flex items-center gap-2 shadow-sm`}>
               <BookOpen size={16} />
               {activeSession.subject.split('(')[0]}
            </div>

            {/* Timer Ring Animation */}
            <div className="relative mb-12">
               <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${style.bg.replace('100', '500')}`}></div>
               <div className={`relative w-64 h-64 rounded-full border-8 ${style.color.replace('text-', 'border-').replace('600', '100').replace('400', '800')} flex items-center justify-center bg-white dark:bg-gray-800 shadow-2xl`}>
                  <div className="space-y-1">
                      <span className="block text-5xl font-mono font-bold text-gray-800 dark:text-white tracking-tighter">
                          {formatTime(elapsedSeconds)}
                      </span>
                      <span className="block text-xs text-gray-400 uppercase tracking-widest font-semibold">Focus Time</span>
                  </div>
               </div>
            </div>

            {/* Topic Input */}
            <div className="w-full mb-10 group">
                <div className="relative">
                    <input 
                      type="text" 
                      value={activeSession.topic}
                      onChange={(e) => updateTimerTopic(e.target.value)}
                      placeholder="আজকের টপিক কি?"
                      className="w-full bg-transparent text-center text-xl font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 border-b-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-primary focus:outline-none py-2 transition-all"
                    />
                    <PenLine size={16} className="absolute right-0 top-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
               <button 
                 onClick={() => setIsFocusMode(false)} 
                 className="flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
               >
                 <div className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Minimize2 size={20} />
                 </div>
                 <span className="text-xs font-bold">মিনিমাইজ</span>
               </button>

               <button 
                 onClick={stopSession}
                 className="flex flex-col items-center gap-2 group"
               >
                 <div className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200 dark:shadow-red-900/30 group-hover:scale-110 group-active:scale-95 transition-all duration-300">
                    <StopCircle size={32} fill="currentColor" />
                 </div>
                 <span className="text-sm font-bold text-red-500">শেষ করুন</span>
               </button>

               <button 
                 className="flex flex-col items-center gap-2 text-gray-400 cursor-not-allowed opacity-50"
               >
                 <div className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-gray-800">
                    <Pause size={20} fill="currentColor" />
                 </div>
                 <span className="text-xs font-bold">পজ</span>
               </button>
            </div>

            <p className="mt-8 text-xs text-gray-400 animate-pulse">
               Do not disturb mode recommended
            </p>
        </div>
      </div>
    );
  }

  // --- VIEW: DASHBOARD (MAIN) ---
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden relative transition-colors">
      
      {/* Header Summary Card */}
      <div className="p-4 md:p-6 pb-0">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6 w-full md:w-auto">
                 {/* Progress Ring */}
                 <div className="relative w-24 h-24 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-gray-700" />
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - ((Math.min(totalMinutesToday / (dailyGoal * 60), 1)) * 251.2)} className="text-primary dark:text-green-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-gray-800 dark:text-white">{Math.round((totalMinutesToday / (dailyGoal * 60)) * 100)}%</span>
                    </div>
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">আজকের প্রোগ্রেস</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{formatMinimalTime(totalMinutesToday)} / {dailyGoal}h Goal</p>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-lg text-xs font-bold">
                            <Flame size={12} fill="currentColor" /> {streak} Day Streak
                        </div>
                    </div>
                 </div>
              </div>
              
              {activeSession && (
                  <button 
                    onClick={() => setIsFocusMode(true)}
                    className="w-full md:w-auto bg-primary dark:bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-green-900/20 animate-pulse"
                  >
                     <Maximize2 size={18} /> ফোকাস মোডে যান
                  </button>
              )}
          </div>
      </div>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth space-y-6">
          
          {/* View Toggle */}
          <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl w-fit">
              <button onClick={() => setView('DASHBOARD')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${view === 'DASHBOARD' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                  <LayoutDashboard size={16} /> ড্যাশবোর্ড
              </button>
              <button onClick={() => setView('PLANNER')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${view === 'PLANNER' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                  <ListTodo size={16} /> প্ল্যানার
              </button>
              <button onClick={() => setView('HISTORY')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${view === 'HISTORY' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                  <History size={16} /> হিস্টোরি
              </button>
          </div>

          {view === 'DASHBOARD' && (
              <>
                {/* Subject Grid */}
                <div>
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><Zap size={18} className="text-yellow-500"/> কুইক স্টার্ট</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.values(Subject).map((subj) => {
                            const minutes = subjectTimesToday[subj] || 0;
                            const style = getSubjectStyle(subj);
                            const isActive = activeSession?.subject === subj;

                            return (
                                <button 
                                    key={subj}
                                    onClick={() => isActive ? setIsFocusMode(true) : startSession(subj)}
                                    className={`relative p-4 rounded-2xl border text-left transition-all duration-300 group hover:shadow-md ${isActive ? 'bg-white dark:bg-gray-800 border-primary dark:border-green-500 ring-1 ring-primary dark:ring-green-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                >
                                    <div className={`w-10 h-10 rounded-lg ${style.bg} ${style.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                        {isActive ? <Activity size={20} className="animate-pulse"/> : <Play size={20} className="ml-0.5"/>}
                                    </div>
                                    <h4 className="font-bold text-gray-800 dark:text-white text-sm truncate">{subj.split('(')[0]}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{minutes > 0 ? `${formatMinimalTime(minutes)} Today` : 'Start now'}</p>
                                    
                                    {isActive && <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Mini Planner */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><CheckSquare size={18} className="text-primary dark:text-green-400"/> পেন্ডিং টাস্ক</h3>
                        <button onClick={() => setView('PLANNER')} className="text-xs font-bold text-primary dark:text-green-400 hover:underline">সব দেখুন</button>
                    </div>
                    <div className="space-y-2">
                        {todos.filter(t => !t.completed).slice(0, 3).map(todo => (
                            <div key={todo.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                <button onClick={() => toggleTodo(todo.id)} className="text-gray-400 hover:text-primary dark:hover:text-green-400"><Square size={20} /></button>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{todo.text}</span>
                            </div>
                        ))}
                        {todos.filter(t => !t.completed).length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-4">কোনো পেন্ডিং কাজ নেই। গ্রেট জব!</p>
                        )}
                        <form onSubmit={handleAddTodo} className="flex gap-2 mt-2">
                            <input name="todoText" type="text" placeholder="নতুন টাস্ক..." className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary dark:text-white"/>
                            <button type="submit" className="bg-gray-900 dark:bg-gray-700 text-white p-2 rounded-lg hover:bg-black"><Plus size={18}/></button>
                        </form>
                    </div>
                </div>
              </>
          )}

          {view === 'PLANNER' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 min-h-[500px]">
                 <div className="flex items-center gap-2 mb-6">
                    <ListTodo size={24} className="text-primary dark:text-green-400" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">স্টাডি প্ল্যানার</h3>
                 </div>
                 
                 <form onSubmit={handleAddTodo} className="flex gap-3 mb-8">
                   <input 
                     name="todoText"
                     type="text" 
                     placeholder="নতুন টাস্ক যোগ করুন..." 
                     className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                   />
                   <button type="submit" className="bg-primary hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white p-3 rounded-xl transition-colors shadow-lg shadow-green-200 dark:shadow-none">
                     <Plus size={24} />
                   </button>
                 </form>

                 <div className="space-y-3">
                   {todos.map(todo => (
                     <div key={todo.id} className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${todo.completed ? 'bg-gray-50 dark:bg-gray-800/50 border-transparent opacity-60' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-sm'}`}>
                       <button 
                         onClick={() => toggleTodo(todo.id)}
                         className={`transition-colors duration-300 ${todo.completed ? 'text-primary dark:text-green-400' : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'}`}
                       >
                         {todo.completed ? <CheckSquare size={24} /> : <Square size={24} />}
                       </button>
                       <span className={`flex-1 text-base transition-all duration-300 ${todo.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                         {todo.text}
                       </span>
                       <button 
                         onClick={() => deleteTodo(todo.id)}
                         className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                       >
                         <Trash2 size={18} />
                       </button>
                     </div>
                   ))}
                   {todos.length === 0 && (
                     <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                            <ListTodo size={32} />
                        </div>
                        <p className="text-gray-400 dark:text-gray-500">আজকের কোনো প্ল্যান নেই?</p>
                     </div>
                   )}
                 </div>
              </div>
          )}

          {view === 'HISTORY' && (
              <div className="space-y-6">
                 {/* Summary Cards */}
                 <div className="grid grid-cols-2 gap-4">
                     <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border border-orange-100 dark:border-orange-800">
                         <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2">Current Streak</p>
                         <div className="flex items-center gap-2">
                             <Flame size={32} className="text-orange-500" fill="currentColor"/>
                             <span className="text-4xl font-bold text-gray-800 dark:text-white">{streak}</span>
                         </div>
                     </div>
                     <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
                         <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Total Sessions</p>
                         <div className="flex items-center gap-2">
                             <Target size={32} className="text-blue-500" />
                             <span className="text-4xl font-bold text-gray-800 dark:text-white">{sessions.length}</span>
                         </div>
                     </div>
                 </div>

                 <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                   <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                     <History size={20} className="text-primary dark:text-green-400" /> রিসেন্ট সেশন
                   </h3>
                   <div className="space-y-4">
                     {sessions.length === 0 && <p className="text-gray-400 dark:text-gray-600 text-center py-8">কোনো হিস্টোরি নেই</p>}
                     {sessions.slice(0, 10).map((session) => (
                       <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                         <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-full ${getSubjectStyle(session.subject).bg} flex items-center justify-center`}>
                               <BookOpen size={18} className={getSubjectStyle(session.subject).color.split(' ')[0]} />
                           </div>
                           <div>
                             <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{session.subject.split('(')[0]}</p>
                             <p className="text-xs text-gray-500 dark:text-gray-400">{session.topic || 'Self Study'}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="font-bold text-gray-800 dark:text-white font-mono">{session.durationMinutes} min</p>
                           <p className="text-xs text-gray-400">{new Date(session.timestamp).toLocaleDateString()}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default StudyTracker;