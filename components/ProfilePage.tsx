
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, EnrolledCourse } from '../contexts/AuthContext';
import { fetchSavedQuestionsAPI, deleteSavedQuestionAPI, fetchUserStatsAPI, fetchUserMistakesAPI } from '../services/api';
import { User, Mail, BookOpen, Edit2, Check, X, Camera, Award, Calendar, Bookmark, Trash2, ChevronRight, LayoutGrid, List, TrendingUp, BarChart2, AlertCircle, Zap, Filter, GraduationCap, Briefcase, Target, PieChart, Layers, RefreshCw, AlertTriangle } from 'lucide-react';
import { AppView } from '../types';

// Assuming onNavigate is passed if this component is used in a way that allows navigation switching.
// If strictly used inside App.tsx which controls view, we might need a way to switch view.
// Since ProfilePage doesn't receive props in the current routing setup in App.tsx (it's just <ProfilePage />),
// we will use window.location.reload approach or just localStorage + alert to instruct user to go to Quiz.
// Ideally, App.tsx should pass a navigator. 
// However, looking at App.tsx, ProfilePage is rendered without props. 
// To fix this without changing App.tsx signature too much, we can use a custom event or just modify App.tsx slightly later?
// Wait, I can assume ProfilePage might have access to a global navigation context if I created one, but I didn't.
// Let's use a simple Hack: Reload page with a query param or just LocalStorage queue and user manually goes to Quiz.
// BETTER: I will assume the parent passes onNavigate, but since the existing code doesn't show it passed, 
// I will modify the 'Retake' action to save to localStorage and show an alert "Go to Quiz Page to start".
// OR, I can force a reload to home/quiz if I can't access state setter.
// Actually, let's just use localStorage and tell user to go to Quiz page.

const AVATARS = [
  'https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Bob&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Willow&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Jack&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Bella&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Oliver&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Sophie&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Leo&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Mila&backgroundColor=c0aede'
];

const ProfilePage: React.FC = () => {
  const { currentUser, userAvatar, enrolledCourses, extendedProfile, updateUserProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'INFO' | 'COURSES' | 'SAVED' | 'MISTAKES'>('INFO');
  
  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(currentUser?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userAvatar || AVATARS[0]);
  
  // Extended Fields
  const [college, setCollege] = useState(extendedProfile?.college || '');
  const [hscBatch, setHscBatch] = useState(extendedProfile?.hscBatch || '');
  const [department, setDepartment] = useState(extendedProfile?.department || 'Science');
  const [target, setTarget] = useState(extendedProfile?.target || 'Medical');

  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  // Stats State
  const [stats, setStats] = useState<any>(null);

  // Saved Questions State
  const [savedQuestions, setSavedQuestions] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Mistakes State
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [loadingMistakes, setLoadingMistakes] = useState(false);
  
  // Filter State
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [filterChapter, setFilterChapter] = useState<string>('ALL');

  useEffect(() => {
    // Initialize state from context when available
    if (extendedProfile) {
        setCollege(extendedProfile.college || '');
        setHscBatch(extendedProfile.hscBatch || '');
        setDepartment(extendedProfile.department || 'Science');
        setTarget(extendedProfile.target || 'Medical');
    }
  }, [extendedProfile]);

  useEffect(() => {
    if (activeTab === 'SAVED' && currentUser) {
      loadSavedQuestions();
    }
    if (activeTab === 'MISTAKES' && currentUser) {
      loadMistakes();
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser]);

  const loadStats = async () => {
    if (!currentUser) return;
    try {
      const data = await fetchUserStatsAPI(currentUser.uid);
      setStats(data);
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  };

  const loadSavedQuestions = async () => {
    if (!currentUser) return;
    setLoadingSaved(true);
    try {
      const data = await fetchSavedQuestionsAPI(currentUser.uid);
      setSavedQuestions(data);
    } catch (e) {
      console.error("Failed to load saved questions", e);
    } finally {
      setLoadingSaved(false);
    }
  };

  const loadMistakes = async () => {
    if (!currentUser) return;
    setLoadingMistakes(true);
    try {
      const data = await fetchUserMistakesAPI(currentUser.uid);
      setMistakes(data);
    } catch (e) {
      console.error("Failed to load mistakes", e);
    } finally {
      setLoadingMistakes(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateUserProfile(newName, selectedAvatar, {
          college, hscBatch, department, target
      });
      setIsEditing(false);
      setShowAvatarSelector(false);
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("প্রোফাইল আপডেট করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    if (!currentUser) return;
    if (!confirm("আপনি কি নিশ্চিত এই প্রশ্নটি ডিলিট করতে চান?")) return;
    
    try {
      await deleteSavedQuestionAPI(currentUser.uid, id);
      setSavedQuestions(prev => prev.filter(sq => sq._id !== id));
    } catch (e) {
      alert("ডিলিট করতে সমস্যা হয়েছে।");
    }
  };

  const startMistakeExam = () => {
    if (mistakes.length === 0) return;
    
    // Store mistakes in localStorage to be picked up by QuizArena
    // We sanitize them to match QuizQuestion format
    const examQuestions = mistakes.map(m => ({
        question: m.question,
        options: m.options,
        correctAnswerIndex: m.correctAnswerIndex,
        explanation: m.explanation,
        subject: m.subject,
        chapter: m.chapter,
        topic: m.topic
    }));

    localStorage.setItem('mistake_exam_queue', JSON.stringify(examQuestions));
    alert("ভুল করা প্রশ্নগুলো এক্সামের জন্য প্রস্তুত। দয়া করে 'কুইজ চ্যালেঞ্জ' পেজে যান এবং 'স্টার্ট' করুন।");
    // Ideally we would navigate here, but we lack the prop.
  };

  // Gamification Level Logic
  const getLevel = (points: number) => {
    if (points < 100) return { name: 'Novice', color: 'bg-gray-400' };
    if (points < 500) return { name: 'Apprentice', color: 'bg-green-500' };
    if (points < 1000) return { name: 'Scholar', color: 'bg-blue-500' };
    if (points < 2000) return { name: 'Master', color: 'bg-purple-500' };
    return { name: 'Grandmaster', color: 'bg-orange-500' };
  };

  const currentLevel = getLevel(stats?.points || 0);

  // --- Filtering Logic for Saved Questions ---
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    savedQuestions.forEach(sq => {
      if (sq.questionId?.subject) subjects.add(sq.questionId.subject);
    });
    return Array.from(subjects);
  }, [savedQuestions]);

  const uniqueChapters = useMemo(() => {
    const chapters = new Set<string>();
    savedQuestions.forEach(sq => {
      if (sq.questionId?.chapter) {
        if (filterSubject === 'ALL' || sq.questionId.subject === filterSubject) {
           chapters.add(sq.questionId.chapter);
        }
      }
    });
    return Array.from(chapters);
  }, [savedQuestions, filterSubject]);

  const filteredSavedQuestions = useMemo(() => {
    return savedQuestions.filter(sq => {
      const q = sq.questionId;
      if (!q) return false;
      const matchSubject = filterSubject === 'ALL' || q.subject === filterSubject;
      const matchChapter = filterChapter === 'ALL' || q.chapter === filterChapter;
      return matchSubject && matchChapter;
    });
  }, [savedQuestions, filterSubject, filterChapter]);


  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary to-emerald-600 opacity-10"></div>
          
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 mt-4">
            
            {/* Avatar */}
            <div className="relative group">
               <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden bg-gray-100">
                  <img src={isEditing ? selectedAvatar : userAvatar} alt="Profile" className="w-full h-full object-cover bg-white" />
               </div>
               {isEditing && (
                 <button 
                    onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                    className="absolute bottom-0 right-0 p-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors shadow-lg"
                 >
                    <Camera size={18} />
                 </button>
               )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left space-y-2 w-full">
               {isEditing ? (
                 <div className="grid md:grid-cols-2 gap-4 w-full">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">আপনার নাম</label>
                      <input 
                        type="text" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">কলেজ</label>
                      <input 
                        type="text" 
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="আপনার কলেজের নাম"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">HSC ব্যাচ</label>
                      <input 
                        type="text" 
                        value={hscBatch}
                        onChange={(e) => setHscBatch(e.target.value)}
                        placeholder="যেমন: 2024"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">বিভাগ</label>
                      <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white">
                          <option>Science</option>
                          <option>Arts</option>
                          <option>Commerce</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">লক্ষ্য (Target)</label>
                      <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white">
                          <option>Medical</option>
                          <option>Engineering (BUET/CKRUET)</option>
                          <option>University (A Unit)</option>
                          <option>Guccho</option>
                      </select>
                    </div>
                 </div>
               ) : (
                 <>
                    <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{currentUser?.displayName}</h1>
                        {stats && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${currentLevel.color}`}>
                                {currentLevel.name}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-600 dark:text-gray-300 mt-2">
                       {college && (
                           <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                               <GraduationCap size={14} /> {college}
                           </div>
                       )}
                       {hscBatch && (
                           <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                               <Calendar size={14} /> Batch: {hscBatch}
                           </div>
                       )}
                       {department && (
                           <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                               <BookOpen size={14} /> {department}
                           </div>
                       )}
                       {target && (
                           <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded font-bold">
                               <Target size={14} /> {target} Aspirant
                           </div>
                       )}
                    </div>

                    <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 dark:text-gray-400 text-xs mt-2">
                       <Mail size={12} /> {currentUser?.email}
                    </div>
                 </>
               )}
            </div>

            {/* Action Buttons */}
            <div>
               {isEditing ? (
                 <div className="flex gap-2 flex-col md:flex-row">
                    <button 
                      onClick={() => { setIsEditing(false); }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-bold flex justify-center"
                      disabled={loading}
                    >
                       <X size={20} /> Cancel
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-bold flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                       <Check size={20} /> Save Changes
                    </button>
                 </div>
               ) : (
                 <button 
                   onClick={() => setIsEditing(true)}
                   className="px-4 py-2 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 transition-colors w-full md:w-auto justify-center"
                 >
                    <Edit2 size={16} /> Edit Profile
                 </button>
               )}
            </div>
          </div>

          {/* Avatar Selector Panel */}
          {showAvatarSelector && isEditing && (
             <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-4">
                <p className="font-bold text-gray-700 dark:text-gray-300 mb-4">Choose Avatar:</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                   {AVATARS.map((avatar, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`w-16 h-16 rounded-full border-2 overflow-hidden transition-all bg-white ${selectedAvatar === avatar ? 'border-primary scale-110 shadow-md' : 'border-transparent hover:border-gray-300'}`}
                      >
                         <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                      </button>
                   ))}
                </div>
             </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-fit mx-auto md:mx-0 overflow-x-auto">
           <button onClick={() => setActiveTab('INFO')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'INFO' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              <LayoutGrid size={16} /> Analysis
           </button>
           <button onClick={() => setActiveTab('COURSES')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'COURSES' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              <BookOpen size={16} /> Courses
           </button>
           <button onClick={() => setActiveTab('SAVED')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'SAVED' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              <Bookmark size={16} /> Saved
           </button>
           <button onClick={() => setActiveTab('MISTAKES')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'MISTAKES' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'text-gray-500 hover:text-red-600 dark:hover:text-red-400'}`}>
              <AlertTriangle size={16} /> Mistakes
           </button>
        </div>

        {/* TAB CONTENT: INFO (Dashboard Stats) */}
        {activeTab === 'INFO' && stats && (
            <div className="space-y-6 animate-in fade-in">
               {/* Quick Stats Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                       <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Total Exams</p>
                       <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalExams}</p>
                   </div>
                   <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                       <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Correct</p>
                       <p className="text-2xl font-bold text-green-600">{stats.totalCorrect}</p>
                   </div>
                   <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                       <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Wrong</p>
                       <p className="text-2xl font-bold text-red-600">{stats.totalWrong}</p>
                   </div>
                   <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10">
                       <p className="text-orange-600 dark:text-orange-400 text-xs font-bold uppercase mb-1 flex items-center justify-center gap-1"><Zap size={12} fill="currentColor"/> Points</p>
                       <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.points}</p>
                   </div>
               </div>

               {/* Advanced Analysis Grid */}
               <div className="grid md:grid-cols-2 gap-6">
                   {/* Weakness & Strength (Topic Wise) */}
                   <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                       <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                           <TrendingUp size={20} className="text-primary"/> Topic Mastery
                       </h3>
                       
                       <div className="space-y-6">
                           {/* Strong Topics */}
                           <div>
                               <p className="text-xs font-bold text-green-600 uppercase mb-3 flex items-center gap-1"><Award size={14}/> Strongest Topics</p>
                               <div className="space-y-2">
                                   {stats.strongestTopics && stats.strongestTopics.length > 0 ? (
                                       stats.strongestTopics.map((t: any) => (
                                           <div key={t.topic} className="flex justify-between items-center bg-green-50 dark:bg-green-900/10 px-3 py-2 rounded-lg">
                                               <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.topic}</span>
                                               <span className="text-xs font-bold text-green-600">{t.accuracy.toFixed(0)}%</span>
                                           </div>
                                       ))
                                   ) : <p className="text-xs text-gray-400">Not enough data</p>}
                               </div>
                           </div>

                           {/* Weak Topics */}
                           <div>
                               <p className="text-xs font-bold text-red-500 uppercase mb-3 flex items-center gap-1"><AlertCircle size={14}/> Areas for Improvement</p>
                               <div className="space-y-2">
                                   {stats.weakestTopics && stats.weakestTopics.length > 0 ? (
                                       stats.weakestTopics.map((t: any) => (
                                           <div key={t.topic} className="flex justify-between items-center bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg">
                                               <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.topic}</span>
                                               <span className="text-xs font-bold text-red-500">{t.accuracy.toFixed(0)}%</span>
                                           </div>
                                       ))
                                   ) : <p className="text-xs text-gray-400">Not enough data</p>}
                               </div>
                           </div>
                       </div>
                   </div>

                   {/* Subject Performance */}
                   <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                       <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                           <BarChart2 size={20} className="text-blue-500"/> Subject Performance
                       </h3>
                       <div className="space-y-4">
                           {stats.subjectBreakdown && stats.subjectBreakdown.map((subj: any) => (
                               <div key={subj.subject}>
                                   <div className="flex justify-between text-sm mb-1.5">
                                       <span className="font-bold text-gray-700 dark:text-gray-300">{subj.subject}</span>
                                       <span className="font-mono font-bold text-gray-900 dark:text-white">{subj.accuracy.toFixed(0)}%</span>
                                   </div>
                                   <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                       <div 
                                         className={`h-full rounded-full transition-all duration-1000 ${subj.accuracy < 40 ? 'bg-red-500' : subj.accuracy < 75 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                         style={{ width: `${subj.accuracy}%` }}
                                       ></div>
                                   </div>
                               </div>
                           ))}
                           {(!stats.subjectBreakdown || stats.subjectBreakdown.length === 0) && (
                               <div className="text-center py-10 text-gray-400">
                                   <PieChart size={48} className="mx-auto mb-2 opacity-20" />
                                   <p>No data available yet</p>
                               </div>
                           )}
                       </div>
                   </div>
               </div>
            </div>
        )}

        {/* TAB CONTENT: COURSES */}
        {activeTab === 'COURSES' && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in">
               <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <BookOpen size={24} className="text-primary" /> My Courses
               </h2>
               
               {enrolledCourses.length > 0 ? (
                 <div className="grid md:grid-cols-2 gap-4">
                    {enrolledCourses.map((course) => (
                       <div key={course.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-primary transition-colors">
                          <h3 className="font-bold text-gray-800 dark:text-white mb-2">{course.title}</h3>
                          <div className="flex justify-between items-end mb-1">
                             <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                             <span className="text-xs font-bold text-primary dark:text-green-400">{course.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                             <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${course.progress}%` }}></div>
                          </div>
                       </div>
                    ))}
                 </div>
               ) : (
                 <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <p>You are not enrolled in any courses yet.</p>
                 </div>
               )}
            </div>
        )}

        {/* TAB CONTENT: MISTAKES */}
        {activeTab === 'MISTAKES' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                   <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <AlertTriangle size={24} className="text-red-500" /> Mistake Log ({mistakes.length})
                   </h2>
                   
                   {mistakes.length > 0 && (
                       <button 
                         onClick={startMistakeExam}
                         className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all"
                       >
                          <RefreshCw size={18} /> Retake Wrong Answers
                       </button>
                   )}
               </div>

               {loadingMistakes ? (
                  <div className="text-center py-12 text-gray-500">Loading mistakes...</div>
               ) : mistakes.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
                     <p>Great job! You don't have any recorded mistakes yet.</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {mistakes.map((m) => (
                        <div key={m._id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm relative">
                           <div className="absolute top-4 right-4 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                              Missed {m.wrongCount} times
                           </div>
                           
                           <div className="flex flex-wrap gap-2 mb-3">
                               {m.subject && <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded font-bold text-gray-600 dark:text-gray-300">{m.subject}</span>}
                               {m.topic && <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded font-bold">{m.topic}</span>}
                           </div>

                           <h3 className="font-bold text-gray-800 dark:text-white mb-4 pr-20 text-lg">{m.question}</h3>
                           
                           <div className="grid sm:grid-cols-2 gap-2 mb-4">
                              {m.options.map((opt: string, idx: number) => (
                                 <div key={idx} className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${idx === m.correctAnswerIndex ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 font-medium' : 'border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900'}`}>
                                    <span className="opacity-50 text-xs font-mono min-w-[20px]">({['A','B','C','D'][idx]})</span> 
                                    <span>{opt}</span>
                                    {idx === m.correctAnswerIndex && <Check size={16} className="ml-auto text-green-500" />}
                                 </div>
                              ))}
                           </div>

                           {m.explanation && (
                              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl text-sm text-gray-700 dark:text-gray-300 border border-red-100 dark:border-red-800/50">
                                 <span className="font-bold block mb-1 text-red-600 dark:text-red-400 flex items-center gap-1"><BookOpen size={14}/> ব্যাখ্যা:</span> {m.explanation}
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               )}
            </div>
        )}

        {/* TAB CONTENT: SAVED QUESTIONS */}
        {activeTab === 'SAVED' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                   <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Bookmark size={24} className="text-primary" /> Saved Questions ({filteredSavedQuestions.length})
                   </h2>
                   
                   {/* Filters */}
                   <div className="flex gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:min-w-[150px]">
                         <select 
                           value={filterSubject}
                           onChange={(e) => { setFilterSubject(e.target.value); setFilterChapter('ALL'); }}
                           className="w-full pl-8 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                         >
                            <option value="ALL">All Subjects</option>
                            {uniqueSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                         </select>
                         <Filter size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                      </div>
                      
                      <div className="relative flex-1 sm:min-w-[150px]">
                         <select 
                           value={filterChapter}
                           onChange={(e) => setFilterChapter(e.target.value)}
                           className="w-full pl-3 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                         >
                            <option value="ALL">All Chapters</option>
                            {uniqueChapters.map(chap => <option key={chap} value={chap}>{chap}</option>)}
                         </select>
                      </div>
                   </div>
               </div>

               {loadingSaved ? (
                  <div className="text-center py-12 text-gray-500">Loading...</div>
               ) : filteredSavedQuestions.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
                     <p>
                        {savedQuestions.length === 0 
                           ? "No saved questions yet. Bookmark tricky questions during quizzes!"
                           : "No questions found with current filters."
                        }
                     </p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {filteredSavedQuestions.map((sq) => {
                        const q = sq.questionId; 
                        if (!q) return null; 
                        
                        return (
                           <div key={sq._id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative group">
                              <button 
                                 onClick={() => handleDeleteSaved(sq._id)}
                                 className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                 title="Delete"
                              >
                                 <Trash2 size={18} />
                              </button>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                 {q.subject && <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded font-bold text-gray-600 dark:text-gray-300">{q.subject}</span>}
                                 {q.chapter && <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs rounded font-bold">{q.chapter}</span>}
                                 {q.topic && <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded font-bold">{q.topic}</span>}
                              </div>

                              <h3 className="font-bold text-gray-800 dark:text-white mb-4 pr-10 text-lg">{q.question}</h3>
                              
                              <div className="grid sm:grid-cols-2 gap-2 mb-4">
                                 {q.options.map((opt: string, idx: number) => (
                                    <div key={idx} className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${idx === q.correctAnswerIndex ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 font-medium' : 'border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900'}`}>
                                       <span className="opacity-50 text-xs font-mono min-w-[20px]">({['A','B','C','D'][idx]})</span> 
                                       <span>{opt}</span>
                                       {idx === q.correctAnswerIndex && <Check size={16} className="ml-auto text-green-500" />}
                                    </div>
                                 ))}
                              </div>

                              {q.explanation && (
                                 <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-sm text-gray-700 dark:text-gray-300 border border-blue-100 dark:border-blue-800/50">
                                    <span className="font-bold block mb-1 text-blue-600 dark:text-blue-400 flex items-center gap-1"><BookOpen size={14}/> ব্যাখ্যা:</span> {q.explanation}
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
        )}

      </div>
    </div>
  );
};

export default ProfilePage;
