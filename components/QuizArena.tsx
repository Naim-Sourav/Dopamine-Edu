
import React, { useState, useEffect, useRef } from 'react';
import { generateQuizFromDB, fetchSyllabusStatsAPI, saveQuestionsToBankAPI, toggleSaveQuestionAPI, saveExamResultAPI } from '../services/api';
import { generateQuiz } from '../services/geminiService';
import { QuizQuestion, ExamStandard, QuizConfig, DifficultyLevel, AppView } from '../types';
import { SYLLABUS_DB } from '../services/syllabusData';
import { PAST_PAPERS_DB, PastPaper } from '../services/staticQuestionBank';
import { useAuth } from '../contexts/AuthContext';
import { 
  Loader2, CheckCircle, XCircle, RefreshCw, Trophy, 
  Clock, Play, Settings, BookOpen, ChevronRight, Check,
  ArrowRight, Atom, Activity, Calculator, Globe, Book, Beaker, Dna, 
  Library, ChevronDown, ChevronUp, Layers, MousePointer2, CheckSquare,
  AlertTriangle, FileText, LayoutList, AlignJustify, GraduationCap, Flame, HelpCircle, Database,
  Filter, Home, MinusCircle, PieChart as PieChartIcon, Bookmark, Archive
} from 'lucide-react';

// --- PRESET DATABASE ---
interface Preset {
  id: string;
  title: string;
  subtitle: string;
  standard: ExamStandard;
  duration: number; // minutes
  negativeMark: number;
  distribution: { subject: string; count: number }[];
  totalMarks: number;
  color: string;
}

const PRESET_DB: Preset[] = [
  {
    id: 'medical',
    title: 'Medical Admission',
    subtitle: 'মেডিকেল ভর্তি পরীক্ষা',
    standard: ExamStandard.MEDICAL,
    duration: 60,
    negativeMark: 0.25,
    totalMarks: 100,
    color: 'bg-green-100 text-green-700 border-green-300',
    distribution: [
      { subject: 'Biology', count: 30 },
      { subject: 'Chemistry', count: 25 },
      { subject: 'Physics', count: 20 },
      { subject: 'English', count: 15 },
      { subject: 'General Knowledge', count: 10 }
    ]
  },
  {
    id: 'du_a',
    title: 'Dhaka University (A-Unit)',
    subtitle: 'ক-ইউনিট ভর্তি পরীক্ষা',
    standard: ExamStandard.VARSITY,
    duration: 60,
    negativeMark: 0.25,
    totalMarks: 100,
    color: 'bg-red-100 text-red-700 border-red-300',
    distribution: [
      { subject: 'Physics', count: 25 },
      { subject: 'Chemistry', count: 25 },
      { subject: 'Higher Math', count: 25 },
      { subject: 'Biology', count: 25 }
    ]
  },
  {
    id: 'engineering',
    title: 'Engineering (BUET/CKRUET)',
    subtitle: 'ইঞ্জিনিয়ারিং প্রিলি',
    standard: ExamStandard.ENGINEERING,
    duration: 60,
    negativeMark: 0.50,
    totalMarks: 100, 
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    distribution: [
      { subject: 'Physics', count: 35 },
      { subject: 'Chemistry', count: 35 },
      { subject: 'Higher Math', count: 30 }
    ]
  },
  {
    id: 'gst',
    title: 'GST (গুচ্ছ)',
    subtitle: 'সমন্বিত ভর্তি পরীক্ষা',
    standard: ExamStandard.VARSITY,
    duration: 60,
    negativeMark: 0.25,
    totalMarks: 100,
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    distribution: [
      { subject: 'Physics', count: 25 },
      { subject: 'Chemistry', count: 25 },
      { subject: 'Higher Math', count: 25 },
      { subject: 'Biology', count: 25 }
    ]
  }
];

type QuizStep = 'SELECTION' | 'TOPIC_CONFIG' | 'LOADING' | 'EXAM' | 'RESULT';
type SelectionMode = 'SINGLE' | 'MULTI';
type ExamViewMode = 'SINGLE_PAGE' | 'ALL_AT_ONCE';
type TabMode = 'CUSTOM' | 'PRESET' | 'PAST_PAPER' | 'MISTAKE_REVISION';

interface QuizArenaProps {
  onNavigate?: (view: AppView) => void;
}

const QuizArena: React.FC<QuizArenaProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  
  // --- STATE ---
  const [step, setStep] = useState<QuizStep>('SELECTION');
  const [tabMode, setTabMode] = useState<TabMode>('CUSTOM');
  
  // Selection Mode (Custom)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('SINGLE');
  const [activeSubjectTab, setActiveSubjectTab] = useState<string>('');
  const [globalSelection, setGlobalSelection] = useState<Record<string, string[]>>({});
  const [topicSelection, setTopicSelection] = useState<Record<string, string[]>>({});
  
  // Config State (Custom)
  const [examStandard, setExamStandard] = useState<ExamStandard>(ExamStandard.HSC);
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState<number>(0);
  const [negativeMarking, setNegativeMarking] = useState<number>(0);
  const [examViewMode, setExamViewMode] = useState<ExamViewMode>('SINGLE_PAGE');

  // Preset State
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  // Exam State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [examDuration, setExamDuration] = useState(0);
  
  // Saved Questions State
  const [savedQuestionIndices, setSavedQuestionIndices] = useState<Set<number>>(new Set());

  // Result View Filter
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'SKIPPED'>('ALL');

  // DB Stats State
  const [syllabusStats, setSyllabusStats] = useState<any>(null);

  useEffect(() => {
    // Fetch DB stats on mount
    const loadStats = async () => {
      try {
        const stats = await fetchSyllabusStatsAPI();
        setSyllabusStats(stats);
      } catch (err) {
        console.error("Failed to load syllabus stats", err);
      }
    };
    loadStats();

    // Check for Mistake Exam Queue
    const mistakeQueue = localStorage.getItem('mistake_exam_queue');
    if (mistakeQueue) {
        const parsedQuestions = JSON.parse(mistakeQueue);
        if (parsedQuestions.length > 0) {
            setTabMode('MISTAKE_REVISION');
            setQuestions(parsedQuestions);
            setUserAnswers(new Array(parsedQuestions.length).fill(null));
            setCurrentQIndex(0);
            setTimeLimit(0); // No strict limit for revision
            setNegativeMarking(0);
            setExamViewMode('SINGLE_PAGE');
            setStep('EXAM');
            // Clean up
            localStorage.removeItem('mistake_exam_queue');
        }
    }
  }, []);

  // --- ACTIONS ---

  const resetAll = () => {
    setStep('SELECTION');
    setTabMode('CUSTOM');
    setGlobalSelection({});
    setTopicSelection({});
    setQuestions([]);
    setUserAnswers([]);
    setTimeLeft(0);
    setExamDuration(0);
    setSelectedPreset(null);
    setShowSubmitModal(false);
    setReviewFilter('ALL');
    setSavedQuestionIndices(new Set());
  };

  const goHome = () => {
    if (onNavigate) {
      onNavigate(AppView.HOME);
    } else {
      resetAll();
    }
  };

  // Custom Selection Logic...
  const toggleChapter = (subject: string, chapter: string) => {
    setGlobalSelection(prev => {
      let newState: Record<string, string[]>;
      if (selectionMode === 'SINGLE') {
        const isAlreadySelected = prev[subject]?.includes(chapter) && Object.keys(prev).length === 1 && prev[subject].length === 1;
        newState = isAlreadySelected ? {} : { [subject]: [chapter] };
      } else {
        const currentChapters = prev[subject] || [];
        const newChapters = currentChapters.includes(chapter)
          ? currentChapters.filter(c => c !== chapter)
          : [...currentChapters, chapter];
        newState = { ...prev, [subject]: newChapters };
        if (newChapters.length === 0) delete newState[subject];
      }
      return newState;
    });
  };

  const toggleAllChaptersInSubject = (subject: string) => {
    if (selectionMode === 'SINGLE') return;
    const allChapters = Object.keys(SYLLABUS_DB[subject]);
    setGlobalSelection((prev: Record<string, string[]>) => {
      const currentSelected = prev[subject] || [];
      if (currentSelected.length === allChapters.length) {
        const newState = { ...prev };
        delete newState[subject];
        return newState;
      } else {
        return { ...prev, [subject]: allChapters };
      }
    });
  };

  const toggleTopic = (subject: string, chapter: string, topic: string) => {
    const key = `${subject}-${chapter}`;
    setTopicSelection(prev => {
      const currentTopics = prev[key] || [];
      const newTopics = currentTopics.includes(topic)
        ? currentTopics.filter(t => t !== topic)
        : [...currentTopics, topic];
      const newState = { ...prev, [key]: newTopics };
      if (newTopics.length === 0) delete newState[key];
      return newState;
    });
  };

  const toggleAllTopicsInChapter = (subject: string, chapter: string) => {
    const key = `${subject}-${chapter}`;
    const allTopics = SYLLABUS_DB[subject][chapter];
    setTopicSelection(prev => {
      const current = prev[key] || [];
      if (current.length === allTopics.length) {
         const newState = { ...prev };
         delete newState[key];
         return newState;
      } else {
         return { ...prev, [key]: [...allTopics] };
      }
    });
  };

  const initializeTopics = () => {
    const newTopicSelection = { ...topicSelection };
    Object.keys(globalSelection).forEach(subject => {
        globalSelection[subject].forEach(chapter => {
            const key = `${subject}-${chapter}`;
            if (!newTopicSelection[key]) {
                newTopicSelection[key] = [...SYLLABUS_DB[subject][chapter]];
            }
        });
    });
    setTopicSelection(newTopicSelection);
    setStep('TOPIC_CONFIG');
  };

  // --- QUIZ START LOGIC ---

  const startCustomQuiz = async () => {
    const configs: QuizConfig[] = [];
    Object.keys(globalSelection).forEach(subject => {
       globalSelection[subject].forEach(chapter => {
          const key = `${subject}-${chapter}`;
          const topics = topicSelection[key] || [];
          if (topics.length > 0) {
             configs.push({ subject, chapter, topics });
          }
       });
    });

    if (configs.length === 0) {
        alert("অনুগ্রহ করে অন্তত একটি টপিক সিলেক্ট করুন");
        return;
    }
    
    // Set timer before generation
    if (timeLimit > 0) {
      setTimeLeft(timeLimit * 60);
    } else {
      setTimeLeft(0);
    }
    
    initiateQuizGeneration(configs, examStandard, questionCount);
  };

  const startPresetQuiz = async (difficulty: DifficultyLevel) => {
    if (!selectedPreset) return;
    setShowDifficultyModal(false);

    // Construct Config from Preset Distribution
    const configs: QuizConfig[] = selectedPreset.distribution.map(dist => ({
      subject: dist.subject,
      chapter: 'Full Syllabus (High Yield)',
      topics: ['Important Admission Topics'],
      questionCount: dist.count
    }));

    // Set Environment
    setTimeLimit(selectedPreset.duration);
    setNegativeMarking(selectedPreset.negativeMark);
    setExamStandard(selectedPreset.standard);
    setExamViewMode('ALL_AT_ONCE'); 
    
    setTimeLeft(selectedPreset.duration * 60);

    initiateQuizGeneration(configs, selectedPreset.standard, selectedPreset.totalMarks, difficulty, true);
  };

  const startPastPaper = (paper: PastPaper) => {
      setQuestions(paper.questions);
      setUserAnswers(new Array(paper.questions.length).fill(null));
      setCurrentQIndex(0);
      
      setTimeLimit(paper.totalTime);
      setTimeLeft(paper.totalTime * 60);
      setNegativeMarking(0.25); // Standard assumption
      setExamStandard(ExamStandard.VARSITY); // Generic fallback
      setExamViewMode('ALL_AT_ONCE');
      
      setExamDuration(0);
      setStep('EXAM');
  };

  const initiateQuizGeneration = async (configs: QuizConfig[], standard: ExamStandard, count: number, difficulty?: DifficultyLevel, isPreset = false) => {
    setStep('LOADING');
    try {
      let qs: QuizQuestion[] = [];
      let isAiGenerated = false;

      // Use DB generation for custom quizzes if available
      if (!isPreset && tabMode === 'CUSTOM') {
         const allPromises = configs.map(cfg => 
            generateQuizFromDB({
                subject: cfg.subject,
                chapter: cfg.chapter,
                topics: cfg.topics,
                count: Math.ceil(count / configs.length)
            })
         );
         
         const results = await Promise.all(allPromises);
         qs = results.flat();
         
         if (qs.length === 0) {
             console.log("DB returned 0 questions, falling back to AI.");
             qs = await generateQuiz(configs, standard, count, difficulty);
             isAiGenerated = true;
         }
      } else {
         qs = await generateQuiz(configs, standard, count, difficulty);
         isAiGenerated = true;
      }

      if (!qs || qs.length === 0) throw new Error("No questions generated");
      
      qs = qs.sort(() => 0.5 - Math.random()).slice(0, count);
      
      if (isAiGenerated) {
         saveQuestionsToBankAPI(qs).catch(e => console.log("Auto-harvest failed", e));
      }

      setQuestions(qs);
      setUserAnswers(new Array(qs.length).fill(null));
      setCurrentQIndex(0);
      
      setExamDuration(0);
      setStep('EXAM');
    } catch (e) {
      console.error(e);
      alert("দুঃখিত, প্রশ্ন লোড করা যায়নি। সার্ভার ব্যস্ত থাকতে পারে।");
      setStep('SELECTION');
    }
  };

  const submitExam = async () => {
    setShowSubmitModal(false);
    setStep('RESULT');

    // Calculate Score
    const correctCount = userAnswers.filter((ans, idx) => ans === questions[idx]?.correctAnswerIndex).length;
    const wrongCount = userAnswers.filter((ans, idx) => ans !== null && ans !== questions[idx]?.correctAnswerIndex).length;
    const skippedCount = questions.length - (correctCount + wrongCount);
    const penalty = wrongCount * negativeMarking;
    const rawScore = correctCount - penalty;
    const finalScore = Math.max(0, rawScore);

    // Calculate Topic-wise Stats & Identify Mistakes
    const topicStats: { [topic: string]: { correct: number, total: number } } = {};
    const mistakes: QuizQuestion[] = [];
    
    questions.forEach((q, idx) => {
        const topic = q.topic || 'General';
        if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
        topicStats[topic].total += 1;
        
        if (userAnswers[idx] === q.correctAnswerIndex) {
            topicStats[topic].correct += 1;
        } else if (userAnswers[idx] !== null) {
            // Wrong answer found
            mistakes.push(q);
        }
    });

    const topicStatsArray = Object.keys(topicStats).map(t => ({
        topic: t,
        correct: topicStats[t].correct,
        total: topicStats[t].total
    }));

    // Save Result to DB (Including Mistakes)
    if (currentUser) {
        try {
            await saveExamResultAPI(currentUser.uid, {
                subject: questions[0]?.subject || 'General', 
                totalQuestions: questions.length,
                correct: correctCount,
                wrong: wrongCount,
                skipped: skippedCount,
                score: finalScore,
                topicStats: topicStatsArray,
                mistakes: mistakes // Sending mistakes to backend
            });
        } catch (e) {
            console.error("Failed to save result", e);
        }
    }
  };

  const toggleSaveQuestion = async (index: number) => {
    if (!currentUser) {
      alert("প্রশ্ন সেভ করতে লগইন করুন");
      return;
    }
    
    const newSet = new Set(savedQuestionIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSavedQuestionIndices(newSet);

    try {
      const q = questions[index];
      if ((q as any)._id) {
          await toggleSaveQuestionAPI(currentUser.uid, (q as any)._id);
      } else {
          // If question is not from DB (AI generated and not saved yet or Past Paper), we might not have ID.
          // For now, only DB-sourced questions can be saved reliably.
          // Future: Auto-save AI questions to DB on user save interaction.
          console.log("Cannot save non-persisted question yet.");
      }
    } catch (e) {
      console.error("Failed to toggle save", e);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      setSavedQuestionIndices(new Set(newSet));
    }
  };

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (step === 'EXAM') {
      interval = setInterval(() => {
        setExamDuration(prev => prev + 1);
        if (timeLimit > 0) {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              submitExam(); // Auto submit
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timeLimit]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getSubjectIcon = (subject: string) => {
    if (subject.includes('Physics')) return <Atom size={20} className="text-purple-600 dark:text-purple-400" />;
    if (subject.includes('Chemistry')) return <Beaker size={20} className="text-orange-600 dark:text-orange-400" />;
    if (subject.includes('Math')) return <Calculator size={20} className="text-blue-600 dark:text-blue-400" />;
    if (subject.includes('Biology')) return <Dna size={20} className="text-green-600 dark:text-green-400" />;
    if (subject.includes('English') || subject.includes('Bangla')) return <Book size={20} className="text-pink-600 dark:text-pink-400" />;
    if (subject.includes('ICT')) return <Activity size={20} className="text-teal-600 dark:text-teal-400" />;
    return <Globe size={20} className="text-gray-600 dark:text-gray-400" />;
  };

  const getStatsFor = (subject: string, chapter?: string, topic?: string) => {
      if (!syllabusStats || !syllabusStats[subject]) return 0;
      if (!chapter) return syllabusStats[subject].total || 0;
      if (!syllabusStats[subject].chapters[chapter]) return 0;
      if (!topic) return syllabusStats[subject].chapters[chapter].total || 0;
      return syllabusStats[subject].chapters[chapter].topics[topic] || 0;
  };

  const renderStatsBadge = (count: number) => {
      return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded text-[10px] font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <Database size={10} className="opacity-60" /> 
              {count} টি প্রশ্ন
          </span>
      );
  };

  const renderBreadcrumbs = () => (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 overflow-x-auto whitespace-nowrap pb-2">
       <button onClick={resetAll} className="hover:text-primary dark:hover:text-green-400 font-bold flex items-center gap-1">
         <Library size={16} /> কুইজ জোন
       </button>
       <ChevronRight size={14} />
       <span className={step === 'SELECTION' ? 'text-primary dark:text-green-400 font-bold' : ''}>
         {tabMode === 'CUSTOM' ? 'অধ্যায় নির্বাচন' : tabMode === 'PAST_PAPER' ? 'প্রশ্ন ব্যাংক' : tabMode === 'MISTAKE_REVISION' ? 'Mistake Review' : 'প্রিসেট নির্বাচন'}
       </span>
       {step === 'TOPIC_CONFIG' && (
           <>
            <ChevronRight size={14} />
            <span className="text-primary dark:text-green-400 font-bold">কনফিগারেশন</span>
           </>
       )}
    </div>
  );

  // --- VIEWS ---

  if (step === 'SELECTION') {
    // ... (Same as before)
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors relative">
        <div className="flex-1 overflow-y-auto overflow-x-hidden md:flex md:flex-col">
            <div className="p-4 md:p-6 pb-0 flex-none bg-gray-50 dark:bg-gray-900">
                <div className="hidden md:block mb-4">{renderBreadcrumbs()}</div>
                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm max-w-2xl mb-6 overflow-x-auto mx-auto md:mx-0">
                   <button onClick={() => setTabMode('CUSTOM')} className={`flex-1 py-2.5 px-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap ${tabMode === 'CUSTOM' ? 'bg-primary text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><Settings size={16} /> কাস্টম</button>
                   <button onClick={() => setTabMode('PRESET')} className={`flex-1 py-2.5 px-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap ${tabMode === 'PRESET' ? 'bg-primary text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><GraduationCap size={16} /> এডমিশন</button>
                   <button onClick={() => setTabMode('PAST_PAPER')} className={`flex-1 py-2.5 px-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap ${tabMode === 'PAST_PAPER' ? 'bg-primary text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><Archive size={16} /> প্রশ্ন ব্যাংক</button>
                </div>
                {(tabMode === 'CUSTOM') && (
                    <div className="flex flex-row items-center justify-between gap-4 mb-4">
                        <div><h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white">অধ্যায় নির্বাচন</h2><p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-0.5 hidden md:block">{selectionMode === 'SINGLE' ? 'একটি অধ্যায় সিলেক্ট করুন' : 'এক বা একাধিক অধ্যায় সিলেক্ট করুন'}</p></div>
                        <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-10"><button onClick={() => { setSelectionMode('SINGLE'); setGlobalSelection({}); }} className={`px-3 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${selectionMode === 'SINGLE' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>একক</button><button onClick={() => { setSelectionMode('MULTI'); setGlobalSelection({}); }} className={`px-3 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${selectionMode === 'MULTI' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>একাধিক</button></div>
                    </div>
                )}
            </div>
            <div className="flex-1 md:overflow-hidden md:flex md:flex-col md:border-t border-gray-200 dark:border-gray-700">
                {tabMode === 'CUSTOM' ? (
                    <>
                        <div className="md:hidden p-4 pt-0 pb-40 space-y-2">
                            {Object.keys(SYLLABUS_DB).map(subject => {
                                const isActive = activeSubjectTab === subject;
                                const count = globalSelection[subject]?.length || 0;
                                const chapters = Object.keys(SYLLABUS_DB[subject]);
                                const totalQ = getStatsFor(subject);
                                return (
                                    <div key={subject} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                        <button onClick={() => setActiveSubjectTab(isActive ? '' : subject)} className={`w-full flex items-center justify-between p-4 transition-colors ${isActive ? 'bg-primary/5 dark:bg-gray-700/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}><div className="flex items-center gap-3">{getSubjectIcon(subject)}<div className="text-left"><span className="font-bold text-gray-800 dark:text-white text-sm block">{subject.split('(')[0]}</span>{renderStatsBadge(totalQ)}</div></div><div className="flex items-center gap-2">{count > 0 && <span className="bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{count}</span>}{isActive ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}</div></button>
                                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isActive ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}><div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-t border-gray-200 dark:border-gray-700">{selectionMode === 'MULTI' && (<div className="flex justify-between items-center mb-3"><span className="text-xs text-gray-500 font-medium">{chapters.length} টি অধ্যায়</span><button onClick={(e) => { e.stopPropagation(); toggleAllChaptersInSubject(subject); }} className="text-xs font-bold text-primary dark:text-green-400 hover:underline">{globalSelection[subject]?.length === chapters.length ? 'সব মুছুন' : 'সব সিলেক্ট করুন'}</button></div>)}<div className="grid gap-2">{chapters.map(chapter => { const isSelected = globalSelection[subject]?.includes(chapter); const chapQ = getStatsFor(subject, chapter); return (<button key={chapter} onClick={() => toggleChapter(subject, chapter)} className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${isSelected ? 'bg-white dark:bg-gray-800 border-primary dark:border-green-500 shadow-sm ring-1 ring-primary/20' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isSelected ? 'bg-primary dark:bg-green-500 border-primary dark:border-green-500' : 'bg-transparent border-gray-300 dark:border-gray-600'}`}>{isSelected && <Check size={12} className="text-white" />}</div><div className="flex-1"><span className={`text-sm font-medium block ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{chapter}</span>{renderStatsBadge(chapQ)}</div></button>); })}</div></div></div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="hidden md:flex flex-1 h-full overflow-hidden">
                            <div className="w-1/3 lg:w-1/4 bg-white dark:bg-gray-800 overflow-y-auto border-r border-gray-200 dark:border-gray-700 p-2">
                                {Object.keys(SYLLABUS_DB).map(subject => { const count = globalSelection[subject]?.length || 0; const totalQ = getStatsFor(subject); return (<button key={subject} onClick={() => setActiveSubjectTab(subject)} className={`w-full text-left p-4 rounded-xl mb-1 flex items-center justify-between transition-all ${activeSubjectTab === subject ? 'bg-primary/5 dark:bg-green-900/20 text-primary dark:text-green-400 border border-primary/20 dark:border-green-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}><div className="flex items-center gap-3">{getSubjectIcon(subject)}<div><span className="font-medium text-sm block">{subject.split('(')[0]}</span>{renderStatsBadge(totalQ)}</div></div>{count > 0 && <span className="bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{count}</span>}</button>) })}
                            </div>
                            <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto p-6 pb-24">
                                {activeSubjectTab ? (<><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">{getSubjectIcon(activeSubjectTab)}{activeSubjectTab}</h3>{selectionMode === 'MULTI' && <button onClick={() => toggleAllChaptersInSubject(activeSubjectTab)} className="text-xs font-bold text-primary dark:text-green-400 hover:underline">{globalSelection[activeSubjectTab]?.length === Object.keys(SYLLABUS_DB[activeSubjectTab]).length ? 'সব মুছুন' : 'সব সিলেক্ট করুন'}</button>}</div><div className="grid gap-3">{Object.keys(SYLLABUS_DB[activeSubjectTab]).map((chapter, idx) => { const isSelected = globalSelection[activeSubjectTab]?.includes(chapter); const chapQ = getStatsFor(activeSubjectTab, chapter); return (<button key={chapter} onClick={() => toggleChapter(activeSubjectTab, chapter)} className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${isSelected ? 'bg-green-50 dark:bg-green-900/20 border-primary dark:border-green-500 shadow-sm ring-1 ring-primary/20' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}><div className="flex items-center gap-4"><div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isSelected ? 'bg-primary dark:bg-green-500 border-primary dark:border-green-500' : 'bg-transparent border-gray-300 dark:border-gray-600'}`}>{isSelected && <Check size={12} className="text-white" />}</div><div><span className={`font-medium block ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{chapter}</span>{renderStatsBadge(chapQ)}</div></div></button>) })}</div></>) : (<div className="h-full flex flex-col items-center justify-center text-gray-400"><BookOpen size={48} className="mb-4 opacity-20" /><p>বাম পাশ থেকে একটি বিষয় নির্বাচন করুন</p></div>)}
                            </div>
                        </div>
                    </>
                ) : tabMode === 'PRESET' ? (
                    <div className="p-4 md:p-6 pb-28 bg-gray-50 dark:bg-gray-900">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                            {PRESET_DB.map(preset => (<div key={preset.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all overflow-hidden group"><div className={`p-4 border-b ${preset.color} bg-opacity-20`}><div className="flex justify-between items-start"><div><h3 className="text-xl font-bold text-gray-800 dark:text-white">{preset.title}</h3><p className="text-sm opacity-80">{preset.subtitle}</p></div><div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur-sm"><Trophy size={20} className="text-gray-700 dark:text-white" /></div></div></div><div className="p-6"><div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6"><span className="flex items-center gap-1"><Clock size={14}/> {preset.duration} মিনিট</span><span className="flex items-center gap-1"><CheckSquare size={14}/> {preset.totalMarks} মার্কস</span><span className="flex items-center gap-1 text-red-500"><AlertTriangle size={14}/> -{preset.negativeMark}</span></div><div className="space-y-2 mb-6"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider"> মানবন্টন:</p><div className="flex flex-wrap gap-2">{preset.distribution.map((d, idx) => (<span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">{d.subject}: {d.count}</span>))}</div></div><button onClick={() => { setSelectedPreset(preset); setShowDifficultyModal(true); }} className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors flex items-center justify-center gap-2">পরীক্ষা দিন <ArrowRight size={18} /></button></div></div>))}
                        </div>
                    </div>
                ) : (
                    // PAST PAPERS VIEW
                    <div className="p-4 md:p-6 pb-28 bg-gray-50 dark:bg-gray-900">
                        <div className="max-w-5xl mx-auto">
                            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">বিগত বছরের প্রশ্ন</h2>
                                    <p className="text-gray-500 dark:text-gray-400">আসল পরীক্ষার প্রশ্ন দিয়ে নিজেকে যাচাই করো</p>
                                </div>
                                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <button className="px-3 py-1.5 text-xs font-bold rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white">All</button>
                                    <button className="px-3 py-1.5 text-xs font-bold rounded-md text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700">Medical</button>
                                    <button className="px-3 py-1.5 text-xs font-bold rounded-md text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700">Varsity</button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {PAST_PAPERS_DB.map(paper => (
                                    <div key={paper.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all group overflow-hidden">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-2 inline-block ${paper.source === 'Medical' ? 'bg-green-100 text-green-700' : paper.source === 'Engineering' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                        {paper.source}
                                                    </span>
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{paper.title}</h3>
                                                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">Session: {paper.year}</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300">
                                                    <FileText size={20} />
                                                </div>
                                            </div>
                                            
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 line-clamp-2">
                                                {paper.description}
                                            </p>
                                            
                                            <div className="flex items-center gap-4 text-xs text-gray-500 font-medium mb-6">
                                                <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded"><Clock size={12}/> {paper.totalTime} Min</span>
                                                <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded"><Database size={12}/> {paper.questions.length} Questions</span>
                                            </div>

                                            <button 
                                                onClick={() => startPastPaper(paper)}
                                                className="w-full py-3 bg-white border-2 border-gray-200 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl font-bold hover:border-primary hover:text-primary dark:hover:border-green-400 dark:hover:text-green-400 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Play size={16} fill="currentColor" /> পরীক্ষা শুরু করুন
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        {(tabMode === 'CUSTOM') && (<div className="fixed bottom-0 left-0 md:left-64 right-0 p-3 md:p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40 flex justify-end"><button onClick={initializeTopics} disabled={Object.keys(globalSelection).length === 0} className="w-full md:w-auto bg-primary hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-6 py-2 md:px-8 md:py-3 rounded-lg md:rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95 text-sm md:text-base">পরবর্তী ধাপ <ArrowRight size={18} /></button></div>)}
        {showDifficultyModal && selectedPreset && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-gray-900 dark:text-white">কঠিন্য নির্বাচন করুন</h3><button onClick={() => setShowDifficultyModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><XCircle size={24} className="text-gray-400" /></button></div><div className="space-y-3">{[DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD].map((level) => { let color = 'bg-gray-100 hover:bg-green-100 border-transparent hover:border-green-500'; let icon = <CheckCircle size={20} />; if (level === DifficultyLevel.HARD) { color = 'bg-gray-100 hover:bg-red-100 border-transparent hover:border-red-500'; icon = <Flame size={20} />; } return (<button key={level} onClick={() => startPresetQuiz(level)} className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${color} dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600`}><div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">{icon}</div><div><p className="font-bold text-gray-800 dark:text-white">{level}</p></div></button>) })}</div></div></div>)}
      </div>
    );
  }

  // TOPIC CONFIG STEP
  if (step === 'TOPIC_CONFIG') {
    // ... (Same as before)
    const subjects = Object.keys(globalSelection);
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors"><div className="p-4 md:p-6 pb-2">{renderBreadcrumbs()}</div><div className="flex-1 overflow-y-auto px-4 md:px-6 pb-40"><div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8"><div className="md:col-span-2 space-y-8">{subjects.map(subject => (<div key={subject} className="space-y-4"><div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-xs border-b border-gray-200 dark:border-gray-700 pb-1">{getSubjectIcon(subject)} {subject}</div>{globalSelection[subject].map(chapter => { const key = `${subject}-${chapter}`; const availableTopics = SYLLABUS_DB[subject][chapter]; const selectedInChapter = topicSelection[key] || []; const isAllSelected = selectedInChapter.length === availableTopics.length; return (<div key={chapter} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"><div className="bg-gray-50 dark:bg-gray-900/50 p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center"><h4 className="font-bold text-gray-800 dark:text-white text-sm">{chapter}</h4><button onClick={() => toggleAllTopicsInChapter(subject, chapter)} className="text-xs text-primary dark:text-green-400 font-bold hover:underline">{isAllSelected ? 'মুছুন' : 'সব'}</button></div><div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">{availableTopics.map(topic => { const isSelected = selectedInChapter.includes(topic); const topicQ = getStatsFor(subject, chapter, topic); return (<label key={topic} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${isSelected ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'}`}><div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary dark:bg-green-600 border-primary dark:border-green-600' : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700'}`}>{isSelected && <Check size={10} className="text-white" />}</div><input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleTopic(subject, chapter, topic)}/><div className="flex-1"><span className="text-gray-700 dark:text-gray-300 text-xs font-medium line-clamp-1">{topic}</span>{renderStatsBadge(topicQ)}</div></label>) })}</div></div>) })}</div>))}</div><div className="md:col-span-1 space-y-6"><div className="md:sticky md:top-0 space-y-6"><div><h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4"><Settings size={18} className="text-primary dark:text-green-400" /> পরীক্ষার সেটিংস</h3><div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 shadow-sm space-y-4 md:space-y-6"><div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">পরীক্ষার ধরন</label><select value={examStandard} onChange={(e) => setExamStandard(e.target.value as ExamStandard)} className="w-full p-2 md:p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-medium text-xs md:text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary">{Object.values(ExamStandard).map(std => (<option key={std} value={std}>{std}</option>))}</select></div><div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">প্রশ্ন সংখ্যা: <span className="text-primary dark:text-green-400">{questionCount}</span></label><input type="range" min="5" max="50" step="5" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary dark:accent-green-500"/><div className="flex justify-between text-xs text-gray-400 mt-1"><span>৫</span><span>৫০</span></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">সময় (মিনিট)</label><select value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value))} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs md:text-sm font-medium text-gray-800 dark:text-white focus:outline-none"><option value="0">কোনো লিমিট নেই</option><option value="5">৫ মিনিট</option><option value="10">১০ মিনিট</option><option value="15">১৫ মিনিট</option><option value="20">২০ মিনিট</option><option value="30">৩০ মিনিট</option><option value="45">৪৫ মিনিট</option><option value="60">১ ঘণ্টা</option></select></div><div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">নেগেটিভ মার্ক</label><select value={negativeMarking} onChange={(e) => setNegativeMarking(parseFloat(e.target.value))} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs md:text-sm font-medium text-gray-800 dark:text-white focus:outline-none"><option value="0">নেই (0)</option><option value="0.25">0.25</option><option value="0.50">0.50</option><option value="1.00">1.00</option></select></div></div><div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">ভিউ মোড</label><div className="flex bg-gray-50 dark:bg-gray-700 p-1 rounded-lg"><button onClick={() => setExamViewMode('SINGLE_PAGE')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-bold transition-all ${examViewMode === 'SINGLE_PAGE' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary dark:text-white' : 'text-gray-500'}`}><LayoutList size={14}/> সিঙ্গেল</button><button onClick={() => setExamViewMode('ALL_AT_ONCE')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-bold transition-all ${examViewMode === 'ALL_AT_ONCE' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary dark:text-white' : 'text-gray-500'}`}><AlignJustify size={14}/> সব একসাথে</button></div></div></div></div></div></div></div></div><div className="fixed bottom-0 left-0 md:left-64 right-0 p-3 md:p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40 flex justify-between items-center transition-colors"><button onClick={() => setStep('SELECTION')} className="text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base transition-colors">আগের ধাপ</button><button onClick={startCustomQuiz} className="bg-primary hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 py-2 md:px-8 md:py-3 rounded-lg md:rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95 text-sm md:text-base"><Play fill="currentColor" size={16} className="md:w-5 md:h-5" /> <span className="md:hidden">পরীক্ষা শুরু</span><span className="hidden md:inline">মডেল টেস্ট শুরু করুন</span></button></div></div>
    );
  }

  // LOADING STEP
  if (step === 'LOADING') {
    return (<div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center p-6 transition-colors"><div className="relative"><div className="absolute inset-0 bg-primary/20 dark:bg-primary/40 rounded-full blur-xl animate-pulse"></div><Loader2 size={64} className="text-primary dark:text-green-400 animate-spin relative z-10" /></div><h3 className="mt-8 text-xl font-bold text-gray-800 dark:text-white">প্রশ্নপত্র তৈরি হচ্ছে...</h3><p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">ডেটাবেস থেকে প্রশ্ন লোড করা হচ্ছে।</p></div>);
  }

  // EXAM STEP
  if (step === 'EXAM') {
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors relative">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{tabMode === 'PAST_PAPER' ? 'Question Bank' : tabMode === 'MISTAKE_REVISION' ? 'Mistake Review' : selectedPreset ? selectedPreset.title : 'Custom Quiz'}</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary dark:text-green-400">{examViewMode === 'SINGLE_PAGE' ? currentQIndex + 1 : userAnswers.filter(a => a !== null).length}</span><span className="text-gray-400">/ {questions.length}</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold ${timeLimit > 0 && timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
            <Clock size={18} /> {timeLimit > 0 ? formatTime(timeLeft) : formatTime(examDuration)}
          </div>
        </div>
        
        {examViewMode === 'SINGLE_PAGE' && (<div className="h-1 bg-gray-100 dark:bg-gray-700 w-full"><div className="h-full bg-primary dark:bg-green-500 transition-all duration-300" style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}></div></div>)}
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto pb-20">
            {examViewMode === 'SINGLE_PAGE' ? (
              <div>
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 relative">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white leading-relaxed pr-8">{questions[currentQIndex]?.question}</h2>
                  <button 
                    onClick={() => toggleSaveQuestion(currentQIndex)}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Save Question"
                  >
                    <Bookmark size={24} className={savedQuestionIndices.has(currentQIndex) ? "fill-primary text-primary" : "text-gray-400"} />
                  </button>
                </div>
                <div className="grid gap-3">
                  {questions[currentQIndex]?.options.map((option, idx) => (
                    <button key={idx} onClick={() => { const newAns = [...userAnswers]; newAns[currentQIndex] = idx; setUserAnswers(newAns); }} className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${userAnswers[currentQIndex] === idx ? 'bg-primary border-primary text-white shadow-md' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary/50 dark:hover:border-green-500/50 hover:bg-green-50 dark:hover:bg-gray-700'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-sm ${userAnswers[currentQIndex] === idx ? 'bg-white text-primary border-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600'}`}>{['A', 'B', 'C', 'D'][idx]}</div>
                        <span className="text-base">{option}</span>
                      </div>
                      {userAnswers[currentQIndex] === idx && <CheckCircle size={20} />}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative">
                    <button 
                      onClick={() => toggleSaveQuestion(qIdx)}
                      className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Bookmark size={20} className={savedQuestionIndices.has(qIdx) ? "fill-primary text-primary" : "text-gray-400"} />
                    </button>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex gap-3 pr-8">
                      <span className="text-gray-400 min-w-[24px]">{qIdx + 1}.</span>{q.question}
                    </h3>
                    <div className="grid gap-2">
                      {q.options.map((option, oIdx) => (
                        <button key={oIdx} onClick={() => { const newAns = [...userAnswers]; newAns[qIdx] = oIdx; setUserAnswers(newAns); }} className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${userAnswers[qIdx] === oIdx ? 'bg-primary/10 border-primary text-primary dark:text-green-400 font-semibold' : 'bg-gray-50 dark:bg-gray-700/30 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${userAnswers[qIdx] === oIdx ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-400'}`}>{['A', 'B', 'C', 'D'][oIdx]}</div>
                            <span>{option}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center z-20">
          {examViewMode === 'SINGLE_PAGE' ? (
            <>
              <button onClick={() => setCurrentQIndex(prev => prev - 1)} disabled={currentQIndex === 0} className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">পূর্ববর্তী</button>
              {currentQIndex === questions.length - 1 ? (
                <button onClick={() => setShowSubmitModal(true)} className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-none transition-all">সাবমিট করুন</button>
              ) : (
                <button onClick={() => setCurrentQIndex(prev => prev + 1)} className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none transition-all flex items-center gap-2">পরবর্তী <ChevronRight size={18} /></button>
              )}
            </>
          ) : (
            <button onClick={() => setShowSubmitModal(true)} className="w-full max-w-md mx-auto px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-none transition-all">সাবমিট করুন ({userAnswers.filter(a => a !== null).length}/{questions.length})</button>
          )}
        </div>
        {showSubmitModal && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95"><div className="text-center mb-6"><div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4"><HelpCircle size={32} /></div><h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">আপনি কি নিশ্চিত?</h3><p className="text-gray-500 dark:text-gray-400 text-sm">আপনি {questions.length} টির মধ্যে {userAnswers.filter(a => a !== null).length} টি প্রশ্নের উত্তর দিয়েছেন। পরীক্ষা শেষ করতে চাইলে 'সাবমিট' বাটনে ক্লিক করুন।</p></div><div className="flex gap-3"><button onClick={() => setShowSubmitModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">ফিরে যান</button><button onClick={submitExam} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-none transition-colors">সাবমিট</button></div></div></div>)}
      </div>
    );
  }

  // --- RESULT STEP (Enhanced) ---
  if (step === 'RESULT') {
    const correctCount = userAnswers.filter((ans, idx) => ans === questions[idx]?.correctAnswerIndex).length;
    const wrongCount = userAnswers.filter((ans, idx) => ans !== null && ans !== questions[idx]?.correctAnswerIndex).length;
    const skippedCount = questions.length - (correctCount + wrongCount);
    
    const penalty = wrongCount * negativeMarking;
    const rawScore = correctCount - penalty;
    const finalScore = Math.max(0, rawScore);
    const percentage = Math.round((finalScore / questions.length) * 100);

    // Filter Logic
    const filteredQuestions = questions.map((q, idx) => ({ q, idx })).filter(({ q, idx }) => {
       const isCorrect = userAnswers[idx] === q.correctAnswerIndex;
       const isSkipped = userAnswers[idx] === null;
       const isWrong = !isCorrect && !isSkipped;

       if (reviewFilter === 'CORRECT') return isCorrect;
       if (reviewFilter === 'WRONG') return isWrong;
       if (reviewFilter === 'SKIPPED') return isSkipped;
       return true;
    });

    return (
      <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors">
         <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Score Card with Pie Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-10 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-8">
               <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                   {/* Left: Score Text */}
                   <div className="text-center md:text-left flex-1">
                       <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-bold text-sm mb-4">
                          <Trophy size={16} fill="currentColor" /> ফলাফল
                       </div>
                       <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-2">
                          {finalScore.toFixed(2)} <span className="text-2xl text-gray-400 dark:text-gray-500 font-medium">/ {questions.length}</span>
                       </h1>
                       
                       {/* Explicit Stats Display */}
                       <div className="flex flex-wrap justify-center md:justify-start gap-4 my-6">
                           <div className="text-center px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                               <span className="block text-2xl font-bold text-green-600 dark:text-green-400">{correctCount}</span>
                               <span className="text-xs text-green-700 dark:text-green-300 font-medium">সঠিক</span>
                           </div>
                           <div className="text-center px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                               <span className="block text-2xl font-bold text-red-600 dark:text-red-400">{wrongCount}</span>
                               <span className="text-xs text-red-700 dark:text-red-300 font-medium">ভুল</span>
                           </div>
                           <div className="text-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                               <span className="block text-2xl font-bold text-gray-600 dark:text-gray-300">{skippedCount}</span>
                               <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">স্কিপড</span>
                           </div>
                       </div>

                       <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                             <Clock size={16} /> সময়: {formatTime(examDuration)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg font-medium">
                             <AlertTriangle size={16} /> পেনাল্টি: -{penalty.toFixed(2)}
                          </div>
                       </div>
                   </div>

                   {/* Right: Pie Chart */}
                   <div className="relative w-48 h-48 md:w-56 md:h-56 shrink-0">
                       <div 
                         className="w-full h-full rounded-full"
                         style={{
                            background: `conic-gradient(
                               #10b981 0% ${correctCount / questions.length * 100}%, 
                               #ef4444 ${correctCount / questions.length * 100}% ${(correctCount + wrongCount) / questions.length * 100}%, 
                               #e5e7eb ${(correctCount + wrongCount) / questions.length * 100}% 100%
                            )`
                         }}
                       ></div>
                       <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-full flex flex-col items-center justify-center shadow-inner">
                          <span className="text-3xl font-bold text-gray-800 dark:text-white">{percentage}%</span>
                          <span className="text-xs text-gray-500 uppercase font-bold">Accuracy</span>
                       </div>
                   </div>
               </div>

               {/* Top Actions Buttons (Moved Inside Card) */}
               <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <button 
                      onClick={resetAll}
                      className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                       <RefreshCw size={20} /> আবার দিন
                    </button>
                    <button 
                      onClick={goHome}
                      className="flex-1 px-8 py-3 bg-primary hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                    >
                       <Home size={20} /> হোম পেজে যান
                    </button>
               </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 w-fit mx-auto md:mx-0">
               <button onClick={() => setReviewFilter('ALL')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${reviewFilter === 'ALL' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  <LayoutList size={16} /> সব ({questions.length})
               </button>
               <button onClick={() => setReviewFilter('CORRECT')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${reviewFilter === 'CORRECT' ? 'bg-green-100 text-green-700 border border-green-200' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  <CheckCircle size={16} /> সঠিক ({correctCount})
               </button>
               <button onClick={() => setReviewFilter('WRONG')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${reviewFilter === 'WRONG' ? 'bg-red-100 text-red-700 border border-red-200' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  <XCircle size={16} /> ভুল ({wrongCount})
               </button>
               <button onClick={() => setReviewFilter('SKIPPED')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${reviewFilter === 'SKIPPED' ? 'bg-gray-200 text-gray-700 border border-gray-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  <MinusCircle size={16} /> স্কিপড ({skippedCount})
               </button>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
               {filteredQuestions.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                     <p className="text-gray-400 font-medium">এই ক্যাটাগরিতে কোনো প্রশ্ন নেই</p>
                  </div>
               ) : (
                  filteredQuestions.map(({ q, idx }) => {
                    const isCorrect = userAnswers[idx] === q.correctAnswerIndex;
                    const isSkipped = userAnswers[idx] === null;
                    const isWrong = !isCorrect && !isSkipped;
                    
                    return (
                      <div key={idx} className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border shadow-sm transition-all relative ${isCorrect ? 'border-green-200 dark:border-green-900/50' : isSkipped ? 'border-gray-200 dark:border-gray-700' : 'border-red-200 dark:border-red-900/50'}`}>
                         
                         <button 
                            onClick={() => toggleSaveQuestion(idx)}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
                            title="Save Question"
                         >
                            <Bookmark size={20} className={savedQuestionIndices.has(idx) ? "fill-primary text-primary" : "text-gray-400"} />
                         </button>

                         <div className="flex items-start gap-3 mb-4 pr-10">
                             <div className={`min-w-[28px] h-7 flex items-center justify-center rounded-lg text-xs font-bold text-white ${isCorrect ? 'bg-green-500' : isSkipped ? 'bg-gray-400' : 'bg-red-500'}`}>
                                {idx + 1}
                             </div>
                             <div className="flex-1">
                                <div className="flex gap-2 mb-2">
                                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-500">{q.subject}</span>
                                    {q.topic && <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-[10px] font-bold text-blue-500">{q.topic}</span>}
                                </div>
                                <h4 className="font-bold text-gray-800 dark:text-white leading-relaxed text-lg">{q.question}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                   {isCorrect && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">সঠিক উত্তর</span>}
                                   {isWrong && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">ভুল উত্তর</span>}
                                   {isSkipped && <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">উত্তর করা হয়নি</span>}
                                </div>
                             </div>
                         </div>
                         
                         <div className="space-y-2 mb-4">
                           {q.options.map((opt, oIdx) => {
                              let itemClass = "p-3 rounded-lg border text-sm flex justify-between items-center transition-colors ";
                              
                              if (oIdx === q.correctAnswerIndex) {
                                  itemClass += "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 font-bold";
                              } else if (userAnswers[idx] === oIdx && isWrong) {
                                  itemClass += "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 font-medium";
                              } else {
                                  itemClass += "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 opacity-70";
                              }
                              
                              return (
                                  <div key={oIdx} className={itemClass}>
                                     <div className="flex items-center gap-3">
                                       <span className="text-xs font-mono opacity-50 min-w-[20px]">({['A','B','C','D'][oIdx]})</span>
                                       <span>{opt}</span>
                                     </div>
                                     {oIdx === q.correctAnswerIndex && <CheckCircle size={18} className="text-green-600 dark:text-green-400 shrink-0" />}
                                     {userAnswers[idx] === oIdx && isWrong && <XCircle size={18} className="text-red-500 dark:text-red-400 shrink-0" />}
                                  </div>
                              )
                           })}
                         </div>
                         <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-sm text-gray-700 dark:text-gray-300 border border-blue-100 dark:border-blue-800/50">
                            <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1 flex items-center gap-1"><BookOpen size={14}/> ব্যাখ্যা:</span>
                            {q.explanation || 'কোনো ব্যাখ্যা নেই।'}
                         </div>
                      </div>
                    )
                  })
               )}
            </div>
         </div>
      </div>
    );
  };

  return null;
};

export default QuizArena;
