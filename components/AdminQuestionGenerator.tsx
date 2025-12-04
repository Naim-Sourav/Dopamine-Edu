
import React, { useState, useRef } from 'react';
import { generateQuiz } from '../services/geminiService';
import { saveQuestionsToBankAPI } from '../services/api';
import { ExamStandard, QuizQuestion } from '../types';
import { SYLLABUS_DB } from '../services/syllabusData';
import { Sparkles, Save, Trash2, Brain, CheckCircle, Loader2, RefreshCw, Layers, BookOpen, Hash, CheckSquare, Square, Upload, Download, XCircle, PieChart, Atom, Beaker, Calculator, Dna, Activity, Globe, ChevronDown, Book } from 'lucide-react';

// --- BLOOM'S TAXONOMY & QUESTION STRATEGIES ---
interface BatchStrategy {
    label: string;
    temp: number;
    instruction: string;
    color: string;
}

const BATCH_STRATEGIES: BatchStrategy[] = [
    {
        label: "Knowledge (জ্ঞানমূলক)",
        temp: 0.3,
        instruction: "Focus on: Knowledge & Memory. Ask direct questions about definitions, specific dates, scientific names, SI units, formulas, and fundamental facts from the textbook.",
        color: "bg-blue-100 text-blue-700 border-blue-200"
    },
    {
        label: "Comprehension (অনুধাবনমূলক)",
        temp: 0.4,
        instruction: "Focus on: Comprehension. Ask 'Why' and 'How' type questions. Focus on explaining concepts, distinguishing between similar terms, characteristics, and underlying principles.",
        color: "bg-green-100 text-green-700 border-green-200"
    },
    {
        label: "Application (প্রয়োগমূলক/গাণিতিক)",
        temp: 0.5,
        instruction: "Focus on: Application & Problem Solving. Create mathematical problems (for Physics/Chem/Math) or scenario-based questions where the student must apply a specific law or formula.",
        color: "bg-yellow-100 text-yellow-700 border-yellow-200"
    },
    {
        label: "Higher Order (উচ্চতর দক্ষতা)",
        temp: 0.7,
        instruction: "Focus on: Analysis & Evaluation. Create complex, multi-step questions that require linking multiple concepts. Ask to analyze a statement or evaluate a conclusion.",
        color: "bg-purple-100 text-purple-700 border-purple-200"
    },
    {
        label: "Admission Standard (ভর্তি যুদ্ধ)",
        temp: 0.6,
        instruction: "Focus on: University Admission Standard. Create tricky, confusing questions often found in Medical/Engineering exams. Use 'Which is NOT true?', and exception-based questions.",
        color: "bg-red-100 text-red-700 border-red-200"
    },
    {
        label: "Deep Dive (গভীর তথ্য)",
        temp: 0.8,
        instruction: "Focus on: Obscure & Deep Details. Find specific lines from standard textbooks that students often skip. Ask about specific values, exceptions, or minor details.",
        color: "bg-gray-100 text-gray-700 border-gray-200"
    }
];

const AdminQuestionGenerator: React.FC = () => {
  // Input State
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [standard, setStandard] = useState<ExamStandard>(ExamStandard.HSC);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  
  // Custom Distribution State: Index of Strategy -> Count
  const [distribution, setDistribution] = useState<number[]>([5, 3, 2, 0, 0, 0]); 
  
  // Logic State
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState('');
  const [saveStatus, setSaveStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived Data
  const subjects = Object.keys(SYLLABUS_DB);
  const chapters = subject ? Object.keys(SYLLABUS_DB[subject] || {}) : [];
  const availableTopics = (subject && chapter) ? SYLLABUS_DB[subject][chapter] || [] : [];
  const totalQuestionsToGenerate = distribution.reduce((a, b) => a + b, 0);

  const getSubjectIcon = (subject: string) => {
    if (subject.includes('Physics')) return <Atom size={18} className="text-purple-600 dark:text-purple-400" />;
    if (subject.includes('Chemistry')) return <Beaker size={18} className="text-orange-600 dark:text-orange-400" />;
    if (subject.includes('Math')) return <Calculator size={18} className="text-blue-600 dark:text-blue-400" />;
    if (subject.includes('Biology')) return <Dna size={18} className="text-green-600 dark:text-green-400" />;
    if (subject.includes('English') || subject.includes('Bangla')) return <Book size={18} className="text-pink-600 dark:text-pink-400" />;
    if (subject.includes('ICT')) return <Activity size={18} className="text-teal-600 dark:text-teal-400" />;
    return <Globe size={18} className="text-gray-600 dark:text-gray-400" />;
  };

  const handleSubjectSelection = (val: string) => {
    setSubject(val);
    setChapter(''); 
    setSelectedTopics([]);
    setIsSubjectDropdownOpen(false);
  };

  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChapter(e.target.value);
    setSelectedTopics([]);
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  };

  const selectAllTopics = () => {
    setSelectedTopics(selectedTopics.length === availableTopics.length ? [] : [...availableTopics]);
  };

  const updateDistribution = (index: number, val: number) => {
      const newDist = [...distribution];
      newDist[index] = Math.max(0, val);
      setDistribution(newDist);
  };

  const handleGenerate = async () => {
    if (!subject || !chapter) return alert("বিষয় এবং অধ্যায় নির্বাচন করুন।");
    if (selectedTopics.length === 0) return alert("অন্তত একটি টপিক নির্বাচন করুন।");
    if (totalQuestionsToGenerate === 0) return alert("অন্তত একটি প্রশ্নের সংখ্যা দিন।");

    setIsGenerating(true);
    setSaveStatus(null);
    
    try {
      // Loop through selected topics
      for (let tIndex = 0; tIndex < selectedTopics.length; tIndex++) {
        const currentTopic = selectedTopics[tIndex];
        
        // Loop through distribution types
        for (let sIndex = 0; sIndex < BATCH_STRATEGIES.length; sIndex++) {
            const count = distribution[sIndex];
            if (count > 0) {
                const strategy = BATCH_STRATEGIES[sIndex];
                
                setProgress(`Topic: ${currentTopic} | Generating ${count} ${strategy.label}`);
                
                const config = [{
                    subject, chapter, topics: [currentTopic]
                }];

                // Generate specific batch
                try {
                    // Split into chunks of 10 max to ensure quality
                    let remaining = count;
                    while (remaining > 0) {
                        const batchSize = Math.min(remaining, 10);
                        const questions = await generateQuiz(
                            config,
                            standard,
                            batchSize,
                            undefined,
                            strategy.instruction,
                            strategy.temp
                        );

                        if (questions && questions.length > 0) {
                            const enhanced = questions.map(q => ({
                                ...q,
                                subject, chapter, topic: currentTopic,
                                difficulty: strategy.label
                            }));
                            setGeneratedQuestions(prev => [...prev, ...enhanced]);
                        }
                        remaining -= batchSize;
                        await new Promise(r => setTimeout(r, 1500)); // Rate limit pause
                    }
                } catch (err) {
                    console.error("Batch failed", err);
                }
            }
        }
      }

      setProgress('Generation Complete!');
      setTimeout(() => setProgress(''), 3000);

    } catch (error) {
      console.error(error);
      alert("সমস্যা হয়েছে।");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDB = async () => {
    if (generatedQuestions.length === 0) return;
    setIsSaving(true);
    try {
      const sanitized = generatedQuestions.map(q => ({
        ...q,
        correctAnswerIndex: Number(q.correctAnswerIndex),
        options: q.options || []
      }));
      await saveQuestionsToBankAPI(sanitized);
      setSaveStatus({ type: 'success', msg: `সফলভাবে ${generatedQuestions.length} টি প্রশ্ন সেভ হয়েছে!` });
      setTimeout(() => { setGeneratedQuestions([]); setSaveStatus(null); }, 3000);
    } catch (error: any) {
      setSaveStatus({ type: 'error', msg: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQ = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const parsed = JSON.parse(ev.target?.result as string);
            if (Array.isArray(parsed)) {
                setGeneratedQuestions(prev => [...prev, ...parsed]);
                alert("Imported successfully");
            }
        } catch (e) { alert("Invalid JSON"); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 animate-in fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
             <Brain size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">স্মার্ট প্রশ্ন জেনারেটর</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">কাস্টম ডিস্ট্রিবিউশন এবং Bloom's Taxonomy অনুযায়ী প্রশ্ন তৈরি করুন</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           
           {/* Left: Topic Selection */}
           <div className="lg:col-span-1 space-y-6">
               <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-5">
                   <div className="relative">
                        <label className="block text-sm font-bold mb-2">বিষয়</label>
                        <button 
                          onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                          className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:border-gray-600 flex items-center justify-between bg-white dark:text-white"
                        >
                           <div className="flex items-center gap-2">
                              {subject ? getSubjectIcon(subject) : <Layers size={18} className="text-gray-400"/>}
                              <span className={subject ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                                {subject ? subject.split('(')[0] : 'নির্বাচন করুন...'}
                              </span>
                           </div>
                           <ChevronDown size={16} className="text-gray-500"/>
                        </button>
                        
                        {isSubjectDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                                {subjects.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleSubjectSelection(s)}
                                        className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                                    >
                                        {getSubjectIcon(s)}
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{s.split('(')[0]}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                   </div>
                   
                   <div>
                        <label className="block text-sm font-bold mb-2">অধ্যায়</label>
                        <select value={chapter} onChange={handleChapterChange} disabled={!subject} className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:border-gray-600">
                            <option value="">নির্বাচন করুন...</option>
                            {chapters.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                   </div>
                   {chapter && (
                       <div>
                           <div className="flex justify-between items-center mb-2">
                               <label className="text-sm font-bold">টপিক</label>
                               <button onClick={selectAllTopics} className="text-xs text-primary font-bold">Toggle All</button>
                           </div>
                           <div className="max-h-60 overflow-y-auto grid gap-2">
                               {availableTopics.map(t => (
                                   <button key={t} onClick={() => toggleTopic(t)} className={`text-left p-2 rounded text-xs border ${selectedTopics.includes(t) ? 'bg-purple-100 border-purple-500 dark:bg-purple-900/30' : 'bg-white dark:bg-gray-800 border-gray-200'}`}>
                                       {t}
                                   </button>
                               ))}
                           </div>
                           <p className="text-xs text-gray-500 mt-2">{selectedTopics.length} selected</p>
                       </div>
                   )}
               </div>
           </div>

           {/* Right: Distribution & Generate */}
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold flex items-center gap-2"><PieChart size={18}/> প্রশ্ন বন্টন (প্রতি টপিক)</h3>
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Total: {totalQuestionsToGenerate}</span>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                      {BATCH_STRATEGIES.map((strategy, idx) => (
                          <div key={idx} className={`p-3 rounded-xl border ${strategy.color} bg-opacity-10 dark:bg-opacity-10 flex items-center justify-between`}>
                              <div>
                                  <p className="font-bold text-sm">{strategy.label.split('(')[0]}</p>
                                  <p className="text-[10px] opacity-80">{strategy.label.split('(')[1]?.replace(')', '')}</p>
                              </div>
                              <input 
                                type="number" 
                                min="0" 
                                max="50"
                                value={distribution[idx]} 
                                onChange={(e) => updateDistribution(idx, parseInt(e.target.value))}
                                className="w-16 p-1 text-center font-bold rounded border-gray-300 focus:ring-2 focus:ring-purple-500 text-gray-800"
                              />
                          </div>
                      ))}
                  </div>

                  <div className="mt-8 flex gap-4">
                      <div className="flex-1">
                          <label className="block text-xs font-bold mb-1">Exam Standard</label>
                          <select value={standard} onChange={(e) => setStandard(e.target.value as ExamStandard)} className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:border-gray-600 text-sm">
                              {Object.values(ExamStandard).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>
                      <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || totalQuestionsToGenerate === 0}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isGenerating ? <Loader2 className="animate-spin"/> : <Sparkles/>} 
                        {isGenerating ? 'Generating...' : 'Start Generation'}
                      </button>
                  </div>
                  {isGenerating && <p className="text-center text-xs mt-2 text-purple-600 animate-pulse">{progress}</p>}
              </div>

              {/* Import/Export */}
              <div className="flex justify-end gap-2">
                  <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-gray-500 hover:text-purple-600 flex items-center gap-1"><Upload size={12}/> Import JSON</button>
              </div>
           </div>
        </div>

        {/* Results Preview */}
        {generatedQuestions.length > 0 && (
          <div className="pt-8 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-5">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl flex items-center gap-2"><CheckCircle className="text-green-500"/> জেনারেটেড প্রশ্ন ({generatedQuestions.length})</h3>
                <div className="flex gap-2">
                    <button onClick={() => setGeneratedQuestions([])} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-bold flex items-center gap-2 hover:bg-red-200"><Trash2 size={16}/> Clear</button>
                    <button onClick={handleSaveToDB} disabled={isSaving} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-green-700">
                        {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save to DB
                    </button>
                </div>
             </div>

             {saveStatus && (
               <div className={`p-4 mb-4 rounded-xl border flex items-center gap-2 ${saveStatus.type === 'success' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                  {saveStatus.type === 'success' ? <CheckCircle size={20}/> : <XCircle size={20}/>}
                  <span className="font-bold">{saveStatus.msg}</span>
               </div>
             )}

             <div className="grid gap-4">
                {generatedQuestions.slice().reverse().map((q, idx) => (
                   <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 relative group">
                      <button onClick={() => handleDeleteQ(generatedQuestions.length - 1 - idx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
                      <div className="flex gap-2 mb-2">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-bold rounded">{q.topic}</span>
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded border border-orange-200">{q.difficulty}</span>
                      </div>
                      <h4 className="font-bold mb-3">{q.question}</h4>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                         {q.options.map((opt, i) => (
                             <div key={i} className={`p-2 rounded text-xs border ${i === Number(q.correctAnswerIndex) ? 'bg-green-50 border-green-300 text-green-700 font-bold' : 'border-gray-200'}`}>
                                 {opt}
                             </div>
                         ))}
                      </div>
                      <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 p-2 rounded">Note: {q.explanation}</p>
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQuestionGenerator;
