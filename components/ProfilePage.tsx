
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, EnrolledCourse } from '../contexts/AuthContext';
import { fetchSavedQuestionsAPI, deleteSavedQuestionAPI, fetchUserStatsAPI, fetchUserMistakesAPI, deleteUserMistakeAPI } from '../services/api';
import { User, Mail, BookOpen, Edit2, Check, X, Camera, Award, Calendar, Bookmark, Trash2, ChevronRight, LayoutGrid, List, TrendingUp, BarChart2, AlertCircle, Zap, Filter, GraduationCap, Briefcase, Target, PieChart, Layers, RefreshCw, AlertTriangle, Clock, Play, AlignJustify, LayoutList } from 'lucide-react';
import { AppView } from '../types';

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

interface ProfilePageProps {
  onNavigate?: (view: AppView) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
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
  
  // Filter State (Shared for Saved & Mistakes)
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [filterChapter, setFilterChapter] = useState<string>('ALL');

  // Exam Config Modal
  const [showExamConfig, setShowExamConfig] = useState(false);
  const [examTimeLimit, setExamTimeLimit] = useState(0);
  const [examViewMode, setExamViewMode] = useState<'SINGLE_PAGE' | 'ALL_AT_ONCE'>('SINGLE_PAGE');

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
    // Reset filters when switching tabs
    setFilterSubject('ALL');
    setFilterChapter('ALL');
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

  const handleDeleteMistake = async (id: string) => {
    if (!currentUser) return;
    if (!confirm("আপনি কি নিশ্চিত এই ভুলটি তালিকা থেকে মুছতে চান?")) return;

    try {
        await deleteUserMistakeAPI(currentUser.uid, id);
        setMistakes(prev => prev.filter(m => m._id !== id));
    } catch (e) {
        alert("ডিলিট করতে সমস্যা হয়েছে।");
    }
  };

  // --- Filtering Logic ---
  // Memoized lists of unique subjects and chapters based on the ACTIVE tab data
  const { uniqueSubjects, uniqueChapters } = useMemo(() => {
    const subjects = new Set<string>();
    const chapters = new Set<string>();
    
    const sourceData = activeTab === 'SAVED' ? savedQuestions.map(sq => sq.questionId) : mistakes;

    sourceData.forEach(q => {
        if (!q) return;
        if (q.subject) subjects.add(q.subject);
        if (q.chapter) {
            if (filterSubject === 'ALL' || q.subject === filterSubject) {
                chapters.add(q.chapter);
            }
        }
    });

    return {
        uniqueSubjects: Array.from(subjects),
        uniqueChapters: Array.from(chapters)
    };
  }, [activeTab, savedQuestions, mistakes, filterSubject]);

  const filteredItems = useMemo(() => {
      const sourceData = activeTab === 'SAVED' ? savedQuestions : mistakes;
      
      return sourceData.filter(item => {
          const q = activeTab === 'SAVED' ? item.questionId : item;
          if (!q) return false;
          
          const matchSubject = filterSubject === 'ALL' || q.subject === filterSubject;
          const matchChapter = filterChapter === 'ALL' || q.chapter === filterChapter;
          return matchSubject && matchChapter;
      });
  }, [activeTab, savedQuestions, mistakes, filterSubject, filterChapter]);


  // --- Exam Logic ---
  const launchExam = () => {
    // Only mistakes tab uses this modal for now
    if (activeTab !== 'MISTAKES') return;
    
    const examQuestions = filteredItems.map(m => ({
        question: m.question,
        options: m.options,
        correctAnswerIndex: m.correctAnswerIndex,
        explanation: m.explanation,
        subject: m.subject,
        chapter: m.chapter,
        topic: m.topic
    }));

    if (examQuestions.length === 0) return;

    const config = {
        questions: examQuestions,
        time: examTimeLimit,
        mode: examViewMode
    };

    localStorage.setItem('mistake_exam_config', JSON.stringify(config));
    setShowExamConfig(false);
    
    if (onNavigate) {
        onNavigate(AppView.QUIZ);
    }
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

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl p-5 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 md:h-32 bg-gradient-to-r from-primary to-emerald-600 opacity-10"></div>
          
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 mt-2 md:mt-4">
            
            {/* Avatar */}
            <div className="relative group">
               <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden bg-gray-100">
                  <img src={isEditing ? selectedAvatar : userAvatar} alt="Profile" className="w-full h-full object-cover bg-white" />
               </div>
               {isEditing && (
                 <button 
                    onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                    className="absolute bottom-0 right-0 p-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors shadow-lg"
                 >
                    <Camera size={16} className="md:w-5 md:h-5" />
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
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{currentUser?.displayName}</h1>
                        {stats && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${currentLevel.color}`}>
                                {currentLevel.name}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-2">
                       {college && (
                           <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                               <GraduationCap size={12} className="md:w-3.5 md:h-3.5" /> {college}
                           </div>
                       )}
                       {hscBatch && (
                           <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                               <Calendar size={12} className="md:w-3.5 md:h-3.5" /> Batch: {hscBatch}
                           </div>
                       )}
                       {department && (
                           <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                               <BookOpen size={12} className="md:w-3.5 md:h-3.5" /> {department}
                           </div>
                       )}
                       {target && (
                           <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded font-bold">
                               <Target size={12} className="md:w-3.5 md:h-3.5" /> {target} Aspirant
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
            <div className="w-full md:w-auto">
               {isEditing ? (
                 <div className="flex gap-2 flex-col md:flex-row w-full">
                    <button 
                      onClick={() => { setIsEditing(false); }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-bold flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                       <X size={18} /> Cancel
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-bold flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                       <Check size={18} /> Save
                    </button>
                 </div>
               ) : (
                 <button 
                   onClick={() => setIsEditing(true)}
                   className="px-4 py-2 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-bold flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 transition-colors w-full md:w-auto"
                 >
                    <Edit2 size={16} /> Edit Profile
                 </button>
               )}
            </div>
          </div>

          {/* Avatar Selector Panel */}
          {showAvatarSelector && isEditing && (
             <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-4">
                <p className="font-bold text-gray-700 dark:text-gray-300 mb-4 text-sm">Choose Avatar:</p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                   {AVATARS.map((avatar, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 overflow-hidden transition-all bg-white ${selectedAvatar === avatar ? 'border-primary scale-110 shadow-md' : 'border-transparent hover:border-gray-300'}`}
                      >
                         <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                      </button>
                   ))}
                </div>
             </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full md:w-fit mx-auto md:mx-0 overflow-x-auto no-scrollbar">
           <button onClick={() => setActiveTab('INFO')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'INFO' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              <LayoutGrid size={16} /> Analysis
           </button>
           <button onClick={() => setActiveTab('COURSES')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'COURSES' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              <BookOpen size={16} /> Courses
           </button>
           <button onClick={() => setActiveTab('SAVED')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'SAVED' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              <Bookmark size={16} /> Saved
           </button>
           <button onClick={() => setActiveTab('MISTAKES')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'MISTAKES' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50' : 'text-gray-500 hover:text-red-600 dark:hover:text-red-400'}`}>
              <AlertTriangle size={16} /> Mistakes
           </button>
        </div>

        {/* TAB CONTENT: INFO (Dashboard Stats) */}
        {activeTab === 'INFO' && stats && (
            <div className="space-y-4 md:space-y-6 animate-in fade-in">
               {/* Quick Stats Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                   <div className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                       <p className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs font-bold uppercase mb-1">Total Exams</p>
                       <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{stats.totalExams}</p>
                   </div>
                   <div className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                       <p className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs font-bold uppercase mb-1">Correct</p>
                       <p className="text-xl md:text-2xl font-bold text-green-600">{stats.totalCorrect}</p>
                   </div>
                   <div className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                       <p className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs font-bold uppercase mb-1">Wrong</p>
                       <p className="text-xl md:text-2xl font-bold text-red-600">{stats.totalWrong}</p>
                   </div>
                   <div className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10">
                       <p className="text-orange-600 dark:text-orange-400 text-[10px] md:text-xs font-bold uppercase mb-1 flex items-center justify-center gap-1"><Zap size={12} fill="currentColor"/> Points</p>
                       <p className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.points}</p>
                   </div>
               </div>

               {/* Advanced Analysis Grid */}
               <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                   {/* Weakness & Strength (Topic Wise) */}
                   <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                       <h3 className="font-bold text-gray-800 dark:text-white mb-4 md:mb-6 flex items-center gap-2 text-sm md:text-base">
                           <TrendingUp size={18} className="text-primary"/> Topic Mastery
                       </h3>
                       
                       <div className="space-y-6">
                           {/* Strong Topics */}
                           <div>
                               <p className="text-xs font-bold text-green-600 uppercase mb-3 flex items-center gap-1"><Award size={12}/> Strongest Topics</p>
                               <div className="space-y-2">
                                   {stats.strongestTopics && stats.strongestTopics.length > 0 ? (
                                       stats.strongestTopics.map((t: any) => (
                                           <div key={t.topic} className="flex justify-between items-center bg-green-50 dark:bg-green-900/10 px-3 py-2 rounded-lg">
                                               <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 truncate mr-2">{t.topic}</span>
                                               <span className="text-xs font-bold text-green-600 shrink-0">{t.accuracy.toFixed(0)}%</span>
                                           </div>
                                       ))
                                   ) : <p className="text-xs text-gray-400">Not enough data</p>}
                               </div>
                           </div>

                           {/* Weak Topics */}
                           <div>
                               <p className="text-xs font-bold text-red-500 uppercase mb-3 flex items-center gap-1"><AlertCircle size={12}/> Areas for Improvement</p>
                               <div className="space-y-2">
                                   {stats.weakestTopics && stats.weakestTopics.length > 0 ? (
                                       stats.weakestTopics.map((t: any) => (
                                           <div key={t.topic} className="flex justify-between items-center bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg">
                                               <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 truncate mr-2">{t.topic}</span>
                                               <span className="text-xs font-bold text-red-500 shrink-0">{t.accuracy.toFixed(0)}%</span>
                                           </div>
                                       ))
                                   ) : <p className="text-xs text-gray-400">Not enough data</p>}
                               </div>
                           </div>
                       </div>
                   </div>

                   {/* Subject Performance */}
                   <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                       <h3 className="font-bold text-gray-800 dark:text-white mb-4 md:mb-6 flex items-center gap-2 text-sm md:text-base">
                           <BarChart2 size={18} className="text-blue-500"/> Subject Performance
                       </h3>
                       <div className="space-y-4">
                           {stats.subjectBreakdown && stats.subjectBreakdown.map((subj: any) => (
                               <div key={subj.subject}>
                                   <div className="flex justify-between text-xs md:text-sm mb-1.5">
                                       <span className="font-bold text-gray-700 dark:text-gray-300 truncate mr-2">{subj.subject}</span>
                                       <span className="font-mono font-bold text-gray-900 dark:text-white shrink-0">{subj.accuracy.toFixed(0)}%</span>
                                   </div>
                                   <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 md:h-3 overflow-hidden">
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
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in">
               <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <BookOpen size={20} className="text-primary md:w-6 md:h-6" /> My Courses
               </h2>
               
               {enrolledCourses.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enrolledCourses.map((course) => (
                       <div key={course.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-primary transition-colors">
                          <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-sm md:text-base">{course.title}</h3>
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
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <AlertTriangle size={20} className="text-red-500 md:w-6 md:h-6" /> Mistake Log ({filteredItems.length})
                   </h2>
                   
                   <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:min-w-[150px]">
                            <select 
                            value={filterSubject}
                            onChange={(e) => { setFilterSubject(e.target.value); setFilterChapter('ALL'); }}
                            className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                            >
                                <option value="ALL">All Subjects</option>
                                {uniqueSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                            <Filter size={14} className="absolute left-3 top-3 text-gray-400" />
                        </div>
                        
                        <div className="relative flex-1 md:min-w-[150px]">
                            <select 
                            value={filterChapter}
                            onChange={(e) => setFilterChapter(e.target.value)}
                            className="w-full pl-3 pr-8 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                            >
                                <option value="ALL">All Chapters</option>
                                {uniqueChapters.map(chap => <option key={chap} value={chap}>{chap}</option>)}
                            </select>
                        </div>
                   </div>

                   {filteredItems.length > 0 && (
                       <button 
                         onClick={() => setShowExamConfig(true)}
                         className="w-full md:w-auto px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-95 text-sm"
                       >
                          <RefreshCw size={16} /> Retake ({filteredItems.length})
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
                     {filteredItems.map((m) => (
                        <div key={m._id} className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm relative group">
                           
                           {/* Delete Button */}
                           <button 
                                onClick={() => handleDeleteMistake(m._id)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors z-10"
                                title="Remove from list"
                           >
                                <Trash2 size={18} />
                           </button>

                           <div className="absolute top-4 right-14 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                              Missed {m.wrongCount} times
                           </div>
                           
                           <div className="flex flex-wrap gap-2 mb-3 pr-24">
                               {m.subject && <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-[10px] rounded font-bold text-gray-600 dark:text-gray-300">{m.subject}</span>}
                               {m.topic && <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] rounded font-bold">{m.topic}</span>}
                           </div>

                           <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-base md:text-lg">{m.question}</h3>
                           
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
                              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl text-xs md:text-sm text-gray-700 dark:text-gray-300 border border-red-100 dark:border-red-800/50">
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
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Bookmark size={20} className="text-primary md:w-6 md:h-6" /> Saved Questions ({filteredItems.length})
                   </h2>
                   
                   {/* Filters */}
                   <div className="flex gap-2 w-full md:w-auto">
                      <div className="relative flex-1 md:min-w-[150px]">
                         <select 
                           value={filterSubject}
                           onChange={(e) => { setFilterSubject(e.target.value); setFilterChapter('ALL'); }}
                           className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                         >
                            <option value="ALL">All Subjects</option>
                            {uniqueSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                         </select>
                         <Filter size={14} className="absolute left-3 top-3 text-gray-400" />
                      </div>
                      
                      <div className="relative flex-1 md:min-w-[150px]">
                         <select 
                           value={filterChapter}
                           onChange={(e) => setFilterChapter(e.target.value)}
                           className="w-full pl-3 pr-8 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                         >
                            <option value="ALL">All Chapters</option>
                            {uniqueChapters.map(chap => <option key={chap} value={chap}>{chap}</option>)}
                         </select>
                      </div>
                   </div>
               </div>

               {loadingSaved ? (
                  <div className="text-center py-12 text-gray-500">Loading...</div>
               ) : filteredItems.length === 0 ? (
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
                     {filteredItems.map((sq) => {
                        const q = sq.questionId; 
                        if (!q) return null; 
                        
                        return (
                           <div key={sq._id} className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative group">
                              <button 
                                 onClick={() => handleDeleteSaved(sq._id)}
                                 className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                 title="Delete"
                              >
                                 <Trash2 size={18} />
                              </button>
                              
                              <div className="flex flex-wrap gap-2 mb-3 pr-10">
                                 {q.subject && <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-[10px] rounded font-bold text-gray-600 dark:text-gray-300">{q.subject}</span>}
                                 {q.chapter && <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-[10px] rounded font-bold">{q.chapter}</span>}
                                 {q.topic && <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] rounded font-bold">{q.topic}</span>}
                              </div>

                              <h3 className="font-bold text-gray-800 dark:text-white mb-4 pr-4 text-base md:text-lg">{q.question}</h3>
                              
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
                                 <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-xs md:text-sm text-gray-700 dark:text-gray-300 border border-blue-100 dark:border-blue-800/50">
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

      {/* Exam Config Modal */}
      {showExamConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <AlertTriangle size={24} className="text-red-500"/> Retake Configuration
                      </h3>
                      <button onClick={() => setShowExamConfig(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={20} className="text-gray-500"/></button>
                  </div>

                  <div className="space-y-6">
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Selected Questions</p>
                          <div className="flex justify-between items-center">
                              <span className="text-2xl font-bold text-gray-900 dark:text-white">{filteredItems.length}</span>
                              <div className="text-xs text-right text-gray-500">
                                  {filterSubject !== 'ALL' ? filterSubject : 'All Subjects'} <br/>
                                  {filterChapter !== 'ALL' ? filterChapter : 'All Chapters'}
                              </div>
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Time Limit</label>
                          <div className="grid grid-cols-4 gap-2">
                              {[0, 10, 20, 30].map(t => (
                                  <button 
                                    key={t} 
                                    onClick={() => setExamTimeLimit(t)}
                                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${examTimeLimit === t ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}
                                  >
                                      {t === 0 ? 'No Limit' : `${t} Min`}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">View Mode</label>
                          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                              <button 
                                onClick={() => setExamViewMode('SINGLE_PAGE')}
                                className={`flex-1 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all ${examViewMode === 'SINGLE_PAGE' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary dark:text-white' : 'text-gray-500'}`}
                              >
                                  <LayoutList size={14} /> Single Page
                              </button>
                              <button 
                                onClick={() => setExamViewMode('ALL_AT_ONCE')}
                                className={`flex-1 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all ${examViewMode === 'ALL_AT_ONCE' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary dark:text-white' : 'text-gray-500'}`}
                              >
                                  <AlignJustify size={14} /> All at Once
                              </button>
                          </div>
                      </div>

                      <button 
                        onClick={launchExam}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-200 dark:shadow-none transition-all"
                      >
                          <Play size={18} fill="currentColor"/> Start Exam
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProfilePage;