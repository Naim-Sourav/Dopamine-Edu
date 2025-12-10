
import React, { useState, useEffect, useRef } from 'react';
import { generateQuizFromDB, fetchSyllabusStatsAPI, saveQuestionsToBankAPI, saveQuestionAPI, unsaveQuestionAPI, saveExamResultAPI } from '../services/api';
import { generateQuiz } from '../services/geminiService';
import { QuizQuestion, ExamStandard, QuizConfig, DifficultyLevel, AppView } from '../types';
import { SYLLABUS_DB } from '../services/syllabusData';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import Confetti from './Confetti'; // Import Confetti
import { 
  Loader2, CheckCircle, XCircle, RefreshCw, Trophy, 
  Clock, Play, Settings, BookOpen, ChevronRight, Check,
  ArrowRight, Atom, Activity, Calculator, Globe, Book, Beaker, Dna, 
  Library, ChevronDown, ChevronUp, Layers, MousePointer2, CheckSquare,
  AlertTriangle, FileText, LayoutList, AlignJustify, GraduationCap, Flame, HelpCircle, Database,
  Filter, Home, MinusCircle, PieChart as PieChartIcon, Bookmark, Archive, Zap, Eye, LayoutGrid, Download
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
type TabMode = 'CUSTOM' | 'PRESET' | 'MISTAKE_REVISION';

interface QuizArenaProps {
  onNavigate?: (view: AppView) => void;
}

const QuizArena: React.FC<QuizArenaProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
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
  const [isPracticeMode, setIsPracticeMode] = useState(false); // NEW: Practice Mode State

  // Preset State
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false); // Mobile Nav State
  
  // Exam State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [examDuration, setExamDuration] = useState(0);
  const [customTitle, setCustomTitle] = useState<string | undefined>(undefined);
  
  // Saved Questions State
  const [savedQuestionIndices, setSavedQuestionIndices] = useState<Set<number>>(new Set());

  // Result View Filter
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'SKIPPED'>('ALL');

  // DB Stats State
  const [syllabusStats, setSyllabusStats] = useState<any>(null);
  
  // Micro-interaction State
  const [showConfetti, setShowConfetti] = useState(false);
  const [animatingOption, setAnimatingOption] = useState<number | null>(null);
  const [shakeIndex, setShakeIndex] = useState<number | null>(null); // For wrong answers

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

    // Check for Mistake Exam Config from Profile Page
    const mistakeConfig = localStorage.getItem('mistake_exam_config');
    if (mistakeConfig) {
        const parsedConfig = JSON.parse(mistakeConfig);
        const parsedQuestions = parsedConfig.questions;
        
        if (parsedQuestions && parsedQuestions.length > 0) {
            setTabMode('MISTAKE_REVISION');
            setQuestions(parsedQuestions);
            setUserAnswers(new Array(parsedQuestions.length).fill(null));
            setCurrentQIndex(0);
            
            // Apply Settings
            const time = parsedConfig.time || 0;
            setTimeLimit(time);
            setTimeLeft(time > 0 ? time * 60 : 0);
            
            setExamViewMode(parsedConfig.mode || 'SINGLE_PAGE');
            setNegativeMarking(0);
            setIsPracticeMode(true); // Default to practice mode for revisions
            setCustomTitle('Mistake Revision');
            
            setStep('EXAM');
            // Clean up
            localStorage.removeItem('mistake_exam_config');
        }
    }

    // Check for Generic Quiz Launch Config (From Question Bank or other sources)
    const launchConfig = localStorage.getItem('quiz_launch_config');
    if (launchConfig) {
        const config = JSON.parse(launchConfig);
        
        if (config.questions && config.questions.length > 0) {
            setQuestions(config.questions);
            setUserAnswers(new Array(config.questions.length).fill(null));
            setCurrentQIndex(0);
            
            setTimeLimit(config.time || 0);
            setTimeLeft(config.time ? config.time * 60 : 0);
            setExamViewMode(config.mode || 'ALL_AT_ONCE');
            setNegativeMarking(0.25);
            setIsPracticeMode(config.type === 'PRACTICE');
            setCustomTitle(config.title);
            
            setStep('EXAM');
            localStorage.removeItem('quiz_launch_config');
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
    setIsPracticeMode(false);
    setShowMobileNav(false);
    setCustomTitle(undefined);
    setShowConfetti(false);
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
        showToast("অনুগ্রহ করে অন্তত একটি টপিক সিলেক্ট করুন", 'warning');
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
      chapter: 'Full Syllabus',
      topics: ['পূর্ণাঙ্গ প্রস্তুতি (Full Syllabus)'], // Changed from English to Bengali
      questionCount: dist.count
    }));

    // Set Environment
    setTimeLimit(selectedPreset.duration);
    setNegativeMarking(selectedPreset.negativeMark);
    setExamStandard(selectedPreset.standard);
    setExamViewMode('ALL_AT_ONCE'); 
    setIsPracticeMode(false); // Presets are strict
    
    setTimeLeft(selectedPreset.duration * 60);

    initiateQuizGeneration(configs, selectedPreset.standard, selectedPreset.totalMarks, difficulty, true);
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
      showToast("দুঃখিত, প্রশ্ন লোড করা যায়নি। সার্ভার ব্যস্ত থাকতে পারে।", "error");
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
    
    // Check for High Score Celebration
    const percentage = (finalScore / questions.length) * 100;
    if (percentage >= 80) {
        setShowConfetti(true);
        // Play success sound logic here if needed
    }

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
            showToast("ফলাফল সংরক্ষণ করা হয়েছে", "success");
        } catch (e) {
            console.error("Failed to save result", e);
            showToast("ফলাফল সংরক্ষণ ব্যর্থ হয়েছে", "warning");
        }
    }
  };

  const toggleSaveQuestion = async (index: number) => {
    if (!currentUser) {
      showToast("প্রশ্ন সেভ করতে লগইন করুন", "warning");
      return;
    }
    
    const newSet = new Set(savedQuestionIndices);
    
    try {
      const q = questions[index];
      
      // We only support saving if the question has a DB ID
      if (!(q as any)._id) {
          console.log("Cannot save non-persisted question yet.");
          return;
      }

      if (newSet.has(index)) {
        // If it looks saved in UI, user wants to UNSAVE
        newSet.delete(index);
        setSavedQuestionIndices(newSet);
        await unsaveQuestionAPI(currentUser.uid, (q as any)._id);
        showToast("বুকমার্ক রিমুভ করা হয়েছে", "info");
      } else {
        // If it looks unsaved in UI, user wants to SAVE
        newSet.add(index);
        setSavedQuestionIndices(newSet);
        await saveQuestionAPI(currentUser.uid, (q as any)._id);
        showToast("প্রশ্নটি বুকমার্ক করা হয়েছে", "success");
      }
    } catch (e) {
      console.error("Failed to update save status", e);
      // Revert state on error
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      setSavedQuestionIndices(newSet);
      showToast("বুকমার্ক আপডেট করতে সমস্যা হয়েছে", "error");
    }
  };

  // Handle option selection with animation
  const handleOptionSelect = (qIndex: number, optionIndex: number) => {
      if (isPracticeMode && userAnswers[qIndex] !== null) return;
      
      const newAns = [...userAnswers];
      newAns[qIndex] = optionIndex;
      setUserAnswers(newAns);
      
      // Animation Trigger
      setAnimatingOption(optionIndex);
      setTimeout(() => setAnimatingOption(null), 300);

      // Wrong answer feedback in practice mode
      if (isPracticeMode) {
          const isCorrect = optionIndex === questions[qIndex].correctAnswerIndex;
          if (!isCorrect) {
              setShakeIndex(optionIndex);
              setTimeout(() => setShakeIndex(null), 500);
          }
      }
  };

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (step === 'EXAM' && (!isPracticeMode || timeLimit > 0)) {
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
  }, [step, timeLimit, isPracticeMode]);

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

  const handleDownloadPDF = () => {
    const correctCount = userAnswers.filter((ans, idx) => ans === questions[idx]?.correctAnswerIndex).length;
    const wrongCount = userAnswers.filter((ans, idx) => ans !== null && ans !== questions[idx]?.correctAnswerIndex).length;
    const skippedCount = questions.length - (correctCount + wrongCount);
    const score = Math.max(0, correctCount - (wrongCount * negativeMarking));

    const htmlContent = `
      <html>
      <head>
        <title>Exam Result - Shikkha Shohayok</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; line-height: 1.5; color: #333; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #006a4e; padding-bottom: 10px; }
          .logo { font-size: 24px; font-weight: bold; color: #006a4e; }
          .meta { font-size: 14px; color: #666; margin-top: 5px; }
          .score-card { display: flex; justify-content: space-between; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .score-item { text-align: center; }
          .score-val { font-size: 20px; font-weight: bold; }
          .score-label { font-size: 12px; color: #555; text-transform: uppercase; }
          .question-container { margin-bottom: 15px; border: 1px solid #eee; padding: 15px; border-radius: 8px; page-break-inside: avoid; }
          .q-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; display: flex; gap: 10px; }
          .q-num { color: #006a4e; }
          .options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
          .option { padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; }
          .correct-ans { background-color: #dcfce7; border-color: #22c55e; color: #15803d; font-weight: bold; }
          .wrong-ans { background-color: #fee2e2; border-color: #ef4444; color: #b91c1c; text-decoration: line-through; }
          .user-select { border-width: 2px; }
          .explanation { margin-top: 10px; padding: 10px; background: #f8fafc; border-left: 4px solid #3b82f6; font-size: 13px; color: #475569; }
          .badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 5px; }
          .badge-skipped { background: #f3f4f6; color: #6b7280; }
          .badge-correct { background: #dcfce7; color: #166534; }
          .badge-wrong { background: #fee2e2; color: #991b1b; }
          @media print {
            body { font-size: 12pt; }
            .no-print { display: none; }
            .question-container { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">শিক্ষা সহায়ক (Shikkha Shohayok)</div>
          <div class="meta">Exam Report • ${new Date().toLocaleDateString()} • ${new Date().toLocaleTimeString()}</div>
          <div class="meta">${selectedPreset ? selectedPreset.title : customTitle || 'Custom Exam'} | Duration: ${formatTime(examDuration)}</div>
        </div>

        <div class="score-card">
          <div class="score-item">
            <div class="score-val" style="color: #006a4e">${score.toFixed(2)}</div>
            <div class="score-label">Score</div>
          </div>
          <div class="score-item">
            <div class="score-val" style="color: #16a34a">${correctCount}</div>
            <div class="score-label">Correct</div>
          </div>
          <div class="score-item">
            <div class="score-val" style="color: #dc2626">${wrongCount}</div>
            <div class="score-label">Wrong</div>
          </div>
          <div class="score-item">
            <div class="score-val" style="color: #6b7280">${skippedCount}</div>
            <div class="score-label">Skipped</div>
          </div>
        </div>

        <div class="questions">
          ${questions.map((q, idx) => {
            const userAns = userAnswers[idx];
            const isCorrect = userAns === q.correctAnswerIndex;
            const isSkipped = userAns === null;
            const statusBadge = isCorrect 
              ? '<span class="badge badge-correct">CORRECT</span>' 
              : isSkipped 
                ? '<span class="badge badge-skipped">SKIPPED</span>' 
                : '<span class="badge badge-wrong">WRONG</span>';

            return `
              <div class="question-container">
                <div>${statusBadge}</div>
                <div class="q-title"><span class="q-num">${idx + 1}.</span> <span>${q.question}</span></div>
                <div class="options">
                  ${q.options.map((opt, oIdx) => {
                    let cls = 'option';
                    if (oIdx === q.correctAnswerIndex) cls += ' correct-ans';
                    if (userAns === oIdx && !isCorrect) cls += ' wrong-ans';
                    if (userAns === oIdx) cls += ' user-select';
                    return `<div class="${cls}">(${['A','B','C','D'][oIdx]}) ${opt}</div>`;
                  }).join('')}
                </div>
                ${q.explanation ? `<div class="explanation"><strong>Explanation:</strong> ${q.explanation}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      showToast("Pop-up blocked! Please allow pop-ups to download PDF.", "error");
    }
  };

  const renderBreadcrumbs = () => (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 overflow-x-auto whitespace-nowrap pb-2">
       <button onClick={resetAll} className="hover:text-primary dark:hover:text-green-400 font-bold flex items-center gap-1">
         <Library size={16} /> কুইজ জোন
       </button>
       <ChevronRight size={14} />
       <span className={step === 'SELECTION' ? 'text-primary dark:text-green-400 font-bold' : ''}>
         {tabMode === 'CUSTOM' ? 'অধ্যায় নির্বাচন' : tabMode === 'MISTAKE_REVISION' ? 'Mistake Review' : 'প্রিসেট নির্বাচন'}
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
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors relative">
        <div className="flex-1 overflow-y-auto overflow-x-hidden md:flex md:flex-col">
            <div className="p-4 md:p-6 pb-0 flex-none bg-gray-50 dark:bg-gray-900">
                <div className="hidden md:block mb-4">{renderBreadcrumbs()}</div>
                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm max-w-lg mb-6 overflow-x-auto mx-auto md:mx-0 no-scrollbar">
                   <button onClick={() => setTabMode('CUSTOM')} className={`flex-1 py-2.5 px-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all whitespace-nowrap ${tabMode === 'CUSTOM' ? 'bg-primary text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><Settings size={16} /> কাস্টম কুইজ</button>
                   <button onClick={() => setTabMode('PRESET')} className={`flex-1 py-2.5 px-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all whitespace-nowrap ${tabMode === 'PRESET' ? 'bg-primary text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><GraduationCap size={16} /> এডমিশন প্রিসেট</button>
                </div>
                {(tabMode === 'CUSTOM') && (
                    <div className="flex flex-row items-center justify-between gap-4 mb-4">
                        <div><h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white">অধ্যায় নির্বাচন</h2><p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-0.5 hidden md:block">{selectionMode === 'SINGLE' ? 'একটি অধ্যায় সিলেক্ট করুন' : 'এক বা একাধিক অধ্যায় সিলেক্ট করুন'}</p></div>
                        <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-9 md:h-10"><button onClick={() => { setSelectionMode('SINGLE'); setGlobalSelection({}); }} className={`px-3 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${selectionMode === 'SINGLE' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>একক</button><button onClick={() => { setSelectionMode('MULTI'); setGlobalSelection({}); }} className={`px-3 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${selectionMode === 'MULTI' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>একাধিক</button></div>
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
                ) : (
                    <div className="p-4 md:p-6 pb-28 bg-gray-50 dark:bg-gray-900">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto">
                            {PRESET_DB.map(preset => (<div key={preset.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all overflow-hidden group"><div className={`p-4 border-b ${preset.color} bg-opacity-20`}><div className="flex justify-between items-start"><div><h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">{preset.title}</h3><p className="text-xs md:text-sm opacity-80">{preset.subtitle}</p></div><div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur-sm"><Trophy size={18} className="text-gray-700 dark:text-white" /></div></div></div><div className="p-5 md:p-6"><div className="flex gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-6"><span className="flex items-center gap-1"><Clock size={14}/> {preset.duration} মিনিট</span><span className="flex items-center gap-1"><CheckSquare size={14}/> {preset.totalMarks} মার্কস</span><span className="flex items-center gap-1 text-red-500"><AlertTriangle size={14}/> -{preset.negativeMark}</span></div><div className="space-y-2 mb-6"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider"> মানবন্টন:</p><div className="flex flex-wrap gap-2">{preset.distribution.map((d, idx) => (<span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] md:text-xs rounded">{d.subject}: {d.count}</span>))}</div></div><button onClick={() => { setSelectedPreset(preset); setShowDifficultyModal(true); }} className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors flex items-center justify-center gap-2">পরীক্ষা দিন <ArrowRight size={18} /></button></div></div>))}
                        </div>
                    </div>
                )}
            </div>
        </div>
        {(tabMode === 'CUSTOM') && (<div className="fixed bottom-0 left-0 md:left-64 right-0 p-3 md:p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40 flex justify-end"><button onClick={initializeTopics} disabled={Object.keys(globalSelection).length === 0} className="w-full md:w-auto bg-primary hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-6 py-3 md:px-8 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95 text-sm md:text-base">পরবর্তী ধাপ <ArrowRight size={18} /></button></div>)}
        {showDifficultyModal && selectedPreset && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-gray-900 dark:text-white">কঠিন্য নির্বাচন করুন</h3><button onClick={() => setShowDifficultyModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><XCircle size={24} className="text-gray-400" /></button></div><div className="space-y-3">{[DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD].map((level) => { let color = 'bg-gray-100 hover:bg-green-100 border-transparent hover:border-green-500'; let icon = <CheckCircle size={20} />; if (level === DifficultyLevel.HARD) { color = 'bg-gray-100 hover:bg-red-100 border-transparent hover:border-red-500'; icon = <Flame size={20} />; } return (<button key={level} onClick={() => startPresetQuiz(level)} className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${color} dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600`}><div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">{icon}</div><div><p className="font-bold text-gray-800 dark:text-white">{level}</p></div></button>) })}</div></div></div>)}
      </div>
    );
  }

  // TOPIC CONFIG STEP
  if (step === 'TOPIC_CONFIG') {
    const subjects = Object.keys(globalSelection);
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors"><div className="p-4 md:p-6 pb-2">{renderBreadcrumbs()}</div><div className="flex-1 overflow-y-auto px-4 md:px-6 pb-40"><div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8"><div className="md:col-span-2 space-y-8">{subjects.map(subject => (<div key={subject} className="space-y-4"><div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-xs border-b border-gray-200 dark:border-gray-700 pb-1">{getSubjectIcon(subject)} {subject}</div>{globalSelection[subject].map(chapter => { const key = `${subject}-${chapter}`; const availableTopics = SYLLABUS_DB[subject][chapter]; const selectedInChapter = topicSelection[key] || []; const isAllSelected = selectedInChapter.length === availableTopics.length; return (<div key={chapter} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"><div className="bg-gray-50 dark:bg-gray-900/50 p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center"><h4 className="font-bold text-gray-800 dark:text-white text-sm">{chapter}</h4><button onClick={() => toggleAllTopicsInChapter(subject, chapter)} className="text-xs text-primary dark:text-green-400 font-bold hover:underline">{isAllSelected ? 'মুছুন' : 'সব'}</button></div><div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">{availableTopics.map(topic => { const isSelected = selectedInChapter.includes(topic); const topicQ = getStatsFor(subject, chapter, topic); return (<label key={topic} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${isSelected ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'}`}><div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary dark:bg-green-600 border-primary dark:border-green-600' : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700'}`}>{isSelected && <Check size={10} className="text-white" />}</div><input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleTopic(subject, chapter, topic)}/><div className="flex-1"><span className="text-gray-700 dark:text-gray-300 text-xs font-medium line-clamp-1">{topic}</span>{renderStatsBadge(topicQ)}</div></label>) })}</div></div>) })}</div>))}</div>
      
      <div className="md:col-span-1 space-y-6">
        <div className="md:sticky md:top-0 space-y-6">
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4"><Settings size={18} className="text-primary dark:text-green-400" /> পরীক্ষার সেটিংস</h3>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 shadow-sm space-y-4 md:space-y-6">
                
                {/* Practice Mode Toggle */}
                <div 
                    onClick={() => setIsPracticeMode(!isPracticeMode)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isPracticeMode ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isPracticeMode ? 'bg-white text-green-600 dark:bg-green-800 dark:text-white' : 'bg-white text-gray-400 dark:bg-gray-600 dark:text-gray-300'}`}>
                            <Zap size={18} fill={isPracticeMode ? "currentColor" : "none"} />
                        </div>
                        <div>
                            <p className={`font-bold text-sm ${isPracticeMode ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>প্র্যাকটিস মোড</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">তাৎক্ষণিক উত্তর ও ব্যাখ্যা দেখুন</p>
                        </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${isPracticeMode ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-500'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPracticeMode ? 'left-5' : 'left-1'}`}></div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">পরীক্ষার ধরন</label>
                    <select value={examStandard} onChange={(e) => setExamStandard(e.target.value as ExamStandard)} className="w-full p-2 md:p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-medium text-xs md:text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary">{Object.values(ExamStandard).map(std => (<option key={std} value={std}>{std}</option>))}</select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">প্রশ্ন সংখ্যা: <span className="text-primary dark:text-green-400">{questionCount}</span></label>
                    <input type="range" min="5" max="50" step="5" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary dark:accent-green-500"/><div className="flex justify-between text-xs text-gray-400 mt-1"><span>৫</span><span>৫০</span></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">সময় (মিনিট)</label>
                        <select value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value))} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs md:text-sm font-medium text-gray-800 dark:text-white focus:outline-none"><option value="0">কোনো লিমিট নেই</option><option value="5">৫ মিনিট</option><option value="10">১০ মিনিট</option><option value="15">১৫ মিনিট</option><option value="20">২০ মিনিট</option><option value="30">৩০ মিনিট</option><option value="45">৪৫ মিনিট</option><option value="60">১ ঘণ্টা</option></select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">নেগেটিভ মার্ক</label>
                        <select value={negativeMarking} onChange={(e) => setNegativeMarking(parseFloat(e.target.value))} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs md:text-sm font-medium text-gray-800 dark:text-white focus:outline-none"><option value="0">নেই (0)</option><option value="0.25">0.25</option><option value="0.50">0.50</option><option value="1.00">1.00</option></select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">ভিউ মোড</label>
                    <div className="flex bg-gray-50 dark:bg-gray-700 p-1 rounded-lg"><button onClick={() => setExamViewMode('SINGLE_PAGE')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-bold transition-all ${examViewMode === 'SINGLE_PAGE' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary dark:text-white' : 'text-gray-500'}`}><LayoutList size={14}/> সিঙ্গেল</button><button onClick={() => setExamViewMode('ALL_AT_ONCE')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-bold transition-all ${examViewMode === 'ALL_AT_ONCE' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary dark:text-white' : 'text-gray-500'}`}><AlignJustify size={14}/> সব একসাথে</button></div>
                </div>
            </div>
          </div>
        </div>
      </div>
      
      </div></div><div className="fixed bottom-0 left-0 md:left-64 right-0 p-3 md:p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40 flex justify-between items-center transition-colors"><button onClick={() => setStep('SELECTION')} className="text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-3 rounded-xl text-sm md:text-base transition-colors">আগের ধাপ</button><button onClick={startCustomQuiz} className="bg-primary hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-6 py-3 md:px-8 md:py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95 text-sm md:text-base"><Play fill="currentColor" size={16} className="md:w-5 md:h-5" /> <span className="md:hidden">শুরু করুন</span><span className="hidden md:inline">মডেল টেস্ট শুরু করুন</span></button></div></div>
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
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div>
            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">{customTitle ? customTitle : tabMode === 'MISTAKE_REVISION' ? 'Mistake Review' : selectedPreset ? selectedPreset.title : 'Custom Quiz'}</p>
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-xl font-bold text-primary dark:text-green-400">{examViewMode === 'SINGLE_PAGE' ? currentQIndex + 1 : userAnswers.filter(a => a !== null).length}</span><span className="text-gray-400 text-sm md:text-base">/ {questions.length}</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full font-mono font-bold text-sm md:text-base ${timeLimit > 0 && timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
            <Clock size={16} className="md:w-[18px] md:h-[18px]" /> {timeLimit > 0 ? formatTime(timeLeft) : formatTime(examDuration)}
          </div>
        </div>
        
        {examViewMode === 'SINGLE_PAGE' && (<div className="h-1 bg-gray-100 dark:bg-gray-700 w-full"><div className="h-full bg-primary dark:bg-green-500 transition-all duration-300" style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}></div></div>)}
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth" id="quiz-scroll-container">
          <div className={`mx-auto pb-20 relative ${examViewMode === 'ALL_AT_ONCE' ? 'max-w-6xl' : 'max-w-3xl'}`}>
            {examViewMode === 'SINGLE_PAGE' ? (
              <div>
                <div className="bg-white dark:bg-gray-800 p-5 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 relative">
                  <h2 className="text-base md:text-xl font-bold text-gray-800 dark:text-white leading-relaxed pr-8">{questions[currentQIndex]?.question}</h2>
                  <button 
                    onClick={() => toggleSaveQuestion(currentQIndex)}
                    className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Save Question"
                  >
                    <Bookmark size={20} className={`md:w-6 md:h-6 ${savedQuestionIndices.has(currentQIndex) ? "fill-primary text-primary" : "text-gray-400"}`} />
                  </button>
                </div>
                <div className="grid gap-3">
                  {questions[currentQIndex]?.options.map((option, idx) => {
                    const isAnswered = userAnswers[currentQIndex] !== null;
                    const isSelected = userAnswers[currentQIndex] === idx;
                    const isCorrect = idx === questions[currentQIndex]?.correctAnswerIndex;
                    
                    let buttonClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700";
                    
                    if (isPracticeMode && isAnswered) {
                        if (isCorrect) buttonClass = "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-300";
                        else if (isSelected) buttonClass = "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-300";
                        else buttonClass = "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500";
                    } else if (isSelected) {
                        buttonClass = "bg-primary border-primary text-white shadow-md";
                    }

                    // Micro-interaction classes
                    const animateClass = animatingOption === idx ? 'scale-95' : '';
                    const shakeClass = shakeIndex === idx ? 'animate-[shake_0.5s_ease-in-out]' : '';

                    return (
                        <button 
                            key={idx} 
                            onClick={() => handleOptionSelect(currentQIndex, idx)}
                            disabled={isPracticeMode && isAnswered}
                            className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between group active:scale-[0.98] ${buttonClass} ${animateClass} ${shakeClass}`}
                        >
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full border flex items-center justify-center font-bold text-sm ${isSelected && !isPracticeMode ? 'bg-white text-primary border-white' : 'bg-transparent border-current opacity-70'}`}>{['A', 'B', 'C', 'D'][idx]}</div>
                            <span className="text-sm md:text-base">{option}</span>
                        </div>
                        {isPracticeMode && isAnswered && isCorrect && <CheckCircle size={20} className="text-green-600 dark:text-green-400" />}
                        {isPracticeMode && isAnswered && isSelected && !isCorrect && <XCircle size={20} className="text-red-600 dark:text-red-400" />}
                        {!isPracticeMode && isSelected && <CheckCircle size={20} />}
                        </button>
                    );
                  })}
                </div>

                {/* Explanation Box for Practice Mode */}
                {isPracticeMode && userAnswers[currentQIndex] !== null && (
                    <div className="mt-6 p-5 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 animate-in slide-in-from-top-2 fade-in duration-300">
                        <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                            <BookOpen size={18} /> ব্যাখ্যা:
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            {questions[currentQIndex]?.explanation || 'কোনো ব্যাখ্যা নেই।'}
                        </p>
                    </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1 w-full space-y-6 md:space-y-8">
                  {questions.map((q, qIdx) => (
                    <div key={qIdx} id={`question-${qIdx}`} className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative scroll-mt-24">
                      <button 
                        onClick={() => toggleSaveQuestion(qIdx)}
                        className="absolute top-3 right-3 md:top-4 md:right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Bookmark size={18} className={`md:w-5 md:h-5 ${savedQuestionIndices.has(qIdx) ? "fill-primary text-primary" : "text-gray-400"}`} />
                      </button>
                      <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-white mb-4 flex gap-2 md:gap-3 pr-8">
                        <span className="text-gray-400 min-w-[20px] md:min-w-[24px]">{qIdx + 1}.</span>{q.question}
                      </h3>
                      <div className="grid gap-2">
                        {q.options.map((option, oIdx) => (
                          <button key={oIdx} onClick={() => { const newAns = [...userAnswers]; newAns[qIdx] = oIdx; setUserAnswers(newAns); }} className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between active:scale-[0.98] ${userAnswers[qIdx] === oIdx ? 'bg-primary/10 border-primary text-primary dark:text-green-400 font-semibold' : 'bg-gray-50 dark:bg-gray-700/30 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${userAnswers[qIdx] === oIdx ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-400'}`}>{['A', 'B', 'C', 'D'][oIdx]}</div>
                              <span className="text-sm">{option}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigator Sidebar (Desktop) */}
                <div className="hidden lg:block w-72 shrink-0 sticky top-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm flex items-center gap-2">
                                <LayoutGrid size={16}/> Question Navigator
                            </h3>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500">
                                {userAnswers.filter(a => a !== null).length}/{questions.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                            {questions.map((_, idx) => {
                                const isAnswered = userAnswers[idx] !== null;
                                const isSaved = savedQuestionIndices.has(idx);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            document.getElementById(`question-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }}
                                        className={`relative h-10 rounded-lg text-xs font-bold transition-all border ${isAnswered ? 'bg-primary text-white border-primary' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-primary'}`}
                                    >
                                        {idx + 1}
                                        {isSaved && <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full border border-white"></div>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          {examViewMode === 'SINGLE_PAGE' ? (
            <>
              <button onClick={() => setCurrentQIndex(prev => prev - 1)} disabled={currentQIndex === 0} className="px-4 py-3 md:px-6 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-sm md:text-base">পূর্ববর্তী</button>
              {currentQIndex === questions.length - 1 ? (
                <button onClick={() => setShowSubmitModal(true)} className="px-6 py-3 md:px-8 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-none transition-all text-sm md:text-base">সাবমিট করুন</button>
              ) : (
                <button onClick={() => setCurrentQIndex(prev => prev + 1)} className="px-6 py-3 md:px-8 bg-primary text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none transition-all flex items-center gap-2 text-sm md:text-base">পরবর্তী <ChevronRight size={18} /></button>
              )}
            </>
          ) : (
            <div className="w-full flex gap-3 max-w-4xl mx-auto">
                {/* Mobile Navigator Toggle */}
                <button 
                    onClick={() => setShowMobileNav(true)} 
                    className="lg:hidden px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    <LayoutGrid size={20} />
                </button>
                <button onClick={() => setShowSubmitModal(true)} className="flex-1 px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-none transition-all text-sm md:text-base">
                    সাবমিট করুন ({userAnswers.filter(a => a !== null).length}/{questions.length})
                </button>
            </div>
          )}
        </div>
        
        {/* Mobile Nav Modal */}
        {showMobileNav && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-4 shadow-xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg">Question Navigator</h3>
                        <button onClick={() => setShowMobileNav(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><XCircle size={24} className="text-gray-500" /></button>
                    </div>
                    <div className="grid grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto p-1">
                        {questions.map((_, idx) => {
                            const isAnswered = userAnswers[idx] !== null;
                            const isSaved = savedQuestionIndices.has(idx);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        document.getElementById(`question-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        setShowMobileNav(false);
                                    }}
                                    className={`relative h-12 rounded-xl text-sm font-bold transition-all border ${isAnswered ? 'bg-primary text-white border-primary' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600'}`}
                                >
                                    {idx + 1}
                                    {isSaved && <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border border-white"></div>}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        )}

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
         {/* Confetti Overlay */}
         {showConfetti && <Confetti />}
         
         <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-20 relative z-10">
            
            {/* Score Card with Pie Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 md:p-10 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-6 md:gap-8">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                   {/* Left: Score Text */}
                   <div className="text-center md:text-left flex-1 w-full">
                       <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-bold text-xs md:text-sm mb-4">
                          <Trophy size={16} fill="currentColor" /> ফলাফল
                       </div>
                       <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-2">
                          {finalScore.toFixed(2)} <span className="text-xl md:text-2xl text-gray-400 dark:text-gray-500 font-medium">/ {questions.length}</span>
                       </h1>
                       
                       {/* Explicit Stats Display */}
                       <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 my-4 md:my-6">
                           <div className="text-center px-3 py-2 md:px-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 flex-1 md:flex-none min-w-[80px]">
                               <span className="block text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{correctCount}</span>
                               <span className="text-xs text-green-700 dark:text-green-300 font-medium">সঠিক</span>
                           </div>
                           <div className="text-center px-3 py-2 md:px-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 flex-1 md:flex-none min-w-[80px]">
                               <span className="block text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">{wrongCount}</span>
                               <span className="text-xs text-red-700 dark:text-red-300 font-medium">ভুল</span>
                           </div>
                           <div className="text-center px-3 py-2 md:px-4 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 flex-1 md:flex-none min-w-[80px]">
                               <span className="block text-xl md:text-2xl font-bold text-gray-600 dark:text-gray-300">{skippedCount}</span>
                               <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">স্কিপড</span>
                           </div>
                       </div>

                       <div className="flex flex-wrap gap-2 md:gap-4 justify-center md:justify-start">
                          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                             <Clock size={14} className="md:w-4 md:h-4" /> সময়: {formatTime(examDuration)}
                          </div>
                          <div className="flex items-center gap-2 text-xs md:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg font-medium">
                             <AlertTriangle size={14} className="md:w-4 md:h-4" /> পেনাল্টি: -{penalty.toFixed(2)}
                          </div>
                       </div>
                   </div>

                   {/* Right: Pie Chart */}
                   <div className="relative w-40 h-40 md:w-56 md:h-56 shrink-0">
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
                       <div className="absolute inset-3 md:inset-4 bg-white dark:bg-gray-800 rounded-full flex flex-col items-center justify-center shadow-inner">
                          <span className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{percentage}%</span>
                          <span className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">Accuracy</span>
                       </div>
                   </div>
               </div>

               {/* Top Actions Buttons (Moved Inside Card) */}
               <div className="flex flex-col md:flex-row gap-3 md:gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <button 
                      onClick={handleDownloadPDF}
                      className="flex-1 px-6 py-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm md:text-base border border-blue-200 dark:border-blue-800"
                    >
                       <Download size={18} className="md:w-5 md:h-5" /> Download PDF
                    </button>
                    <button 
                      onClick={resetAll}
                      className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm md:text-base"
                    >
                       <RefreshCw size={18} className="md:w-5 md:h-5" /> আবার দিন
                    </button>
                    <button 
                      onClick={goHome}
                      className="flex-1 px-8 py-3 bg-primary hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20 text-sm md:text-base"
                    >
                       <Home size={18} className="md:w-5 md:h-5" /> হোম পেজে যান
                    </button>
               </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 w-full md:w-fit mx-auto md:mx-0 overflow-x-auto no-scrollbar">
               <button onClick={() => setReviewFilter('ALL')} className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${reviewFilter === 'ALL' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  <LayoutList size={14} className="md:w-4 md:h-4" /> সব ({questions.length})
               </button>
               <button onClick={() => setReviewFilter('CORRECT')} className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${reviewFilter === 'CORRECT' ? 'bg-green-100 text-green-700 border border-green-200' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  <CheckCircle size={14} className="md:w-4 md:h-4" /> সঠিক ({correctCount})
               </button>
               <button onClick={() => setReviewFilter('WRONG')} className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${reviewFilter === 'WRONG' ? 'bg-red-100 text-red-700 border border-red-200' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  <XCircle size={14} className="md:w-4 md:h-4" /> ভুল ({wrongCount})
               </button>
               <button onClick={() => setReviewFilter('SKIPPED')} className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${reviewFilter === 'SKIPPED' ? 'bg-gray-200 text-gray-800 border border-gray-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  <MinusCircle size={14} className="md:w-4 md:h-4" /> স্কিপড ({skippedCount})
               </button>
            </div>

            {/* Questions Review List */}
            <div className="space-y-4">
                {filteredQuestions.map(({ q, idx }) => {
                    const userAns = userAnswers[idx];
                    const isCorrect = userAns === q.correctAnswerIndex;
                    const isSkipped = userAns === null;
                    const isWrong = !isCorrect && !isSkipped;
                    
                    let statusColor = isCorrect ? 'border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10' 
                                    : isWrong ? 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10'
                                    : 'border-gray-200 dark:border-gray-700';

                    return (
                        <div key={idx} className={`bg-white dark:bg-gray-800 p-5 rounded-2xl border ${statusColor} shadow-sm`}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex gap-3">
                                    <span className="font-bold text-gray-400 text-sm">{idx + 1}.</span>
                                    <div>
                                        <h3 className="font-bold text-gray-800 dark:text-white text-sm md:text-base leading-relaxed mb-2">{q.question}</h3>
                                        <div className="flex gap-2">
                                            {isCorrect && <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Correct</span>}
                                            {isWrong && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">Wrong</span>}
                                            {isSkipped && <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">Skipped</span>}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => toggleSaveQuestion(idx)} className="text-gray-400 hover:text-primary">
                                    <Bookmark size={18} className={savedQuestionIndices.has(idx) ? "fill-primary text-primary" : ""} />
                                </button>
                            </div>

                            <div className="grid gap-2 mb-3">
                                {q.options.map((opt, oIdx) => {
                                    const isSelected = userAns === oIdx;
                                    const isAnswer = oIdx === q.correctAnswerIndex;
                                    let optClass = "border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300";
                                    
                                    if (isAnswer) optClass = "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-300 font-bold";
                                    else if (isSelected && !isCorrect) optClass = "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-300 font-bold";
                                    
                                    return (
                                        <div key={oIdx} className={`p-3 rounded-xl border flex items-center gap-3 text-sm ${optClass}`}>
                                            <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs opacity-70">{['A','B','C','D'][oIdx]}</div>
                                            <span className="flex-1">{opt}</span>
                                            {isAnswer && <CheckCircle size={16} className="text-green-600 dark:text-green-400"/>}
                                            {isSelected && !isCorrect && <XCircle size={16} className="text-red-600 dark:text-red-400"/>}
                                        </div>
                                    )
                                })}
                            </div>
                            
                            {q.explanation && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-xs md:text-sm text-gray-700 dark:text-gray-300 border border-blue-100 dark:border-blue-800">
                                    <p className="font-bold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1"><BookOpen size={14}/> ব্যাখ্যা:</p>
                                    {q.explanation}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
         </div>
      </div>
    );
  }

  return null;
};

export default QuizArena;
