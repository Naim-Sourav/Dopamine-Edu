
import React, { useState } from 'react';
import { AppView } from '../types';
import { PAST_PAPERS_DB, PastPaper } from '../services/staticQuestionBank';
import { Archive, FileText, Database, BookOpen, Clock, Play, ArrowRight, Check } from 'lucide-react';
import { SYLLABUS_DB } from '../services/syllabusData';

interface QuestionBankProps {
  onNavigate: (view: AppView) => void;
}

type BankMode = 'SUBJECT' | 'SET';

const QuestionBank: React.FC<QuestionBankProps> = ({ onNavigate }) => {
  const [mode, setMode] = useState<BankMode>('SET');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');

  // --- LOGIC ---

  // Flatten all questions for subject-wise filtering
  const getAllQuestions = () => {
    return PAST_PAPERS_DB.flatMap(paper => 
      paper.questions.map(q => ({
        ...q,
        paperTitle: paper.title,
        source: paper.source,
        year: paper.year
      }))
    );
  };

  const filteredQuestions = getAllQuestions().filter(q => {
    const matchSubject = selectedSubject ? (q.subject && q.subject.includes(selectedSubject)) : true;
    const matchSource = selectedSource === 'ALL' ? true : q.source === selectedSource;
    return matchSubject && matchSource;
  });

  const handleStartSetExam = (paper: PastPaper) => {
    // Launch QuizArena with this paper's questions
    const config = {
      questions: paper.questions,
      time: paper.totalTime,
      mode: 'ALL_AT_ONCE',
      title: paper.title,
      type: 'PAST_PAPER'
    };
    localStorage.setItem('quiz_launch_config', JSON.stringify(config));
    onNavigate(AppView.QUIZ);
  };

  const handleStartSubjectExam = () => {
    if (filteredQuestions.length === 0) return;
    
    // Launch QuizArena with filtered questions
    const config = {
      questions: filteredQuestions.map(({ paperTitle, source, year, ...rest }) => rest), // Clean object
      time: Math.ceil(filteredQuestions.length * 1.5), // 1.5 min per question approx
      mode: 'SINGLE_PAGE',
      title: `${selectedSubject || 'Mixed'} - ${selectedSource} Question Bank`,
      type: 'PRACTICE'
    };
    localStorage.setItem('quiz_launch_config', JSON.stringify(config));
    onNavigate(AppView.QUIZ);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors pb-40">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <Archive size={32} className="text-primary dark:text-green-400" /> 
              প্রশ্ন ব্যাংক
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-xl">
              বিগত বছরের সকল ভর্তি পরীক্ষার প্রশ্ন সমাধান করো। বিষয়ভিত্তিক অথবা পূর্ণাঙ্গ সেট অনুযায়ী প্র্যাকটিস করো।
            </p>
          </div>
        </header>

        {/* Mode Toggle Tabs */}
        <div className="bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 w-full md:w-fit flex shadow-sm">
           <button 
             onClick={() => setMode('SET')}
             className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'SET' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-400'}`}
           >
             <FileText size={16} /> পূর্ণাঙ্গ সেট (Sets)
           </button>
           <button 
             onClick={() => setMode('SUBJECT')}
             className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'SUBJECT' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-400'}`}
           >
             <Database size={16} /> বিষয়ভিত্তিক (Subject-wise)
           </button>
        </div>

        {/* --- SET WISE VIEW --- */}
        {mode === 'SET' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
             {PAST_PAPERS_DB.map(paper => (
                <div key={paper.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
                    <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-2 inline-block ${paper.source === 'Medical' ? 'bg-green-100 text-green-700' : paper.source === 'Engineering' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                    {paper.source}
                                </span>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors leading-tight">{paper.title}</h3>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">Session: {paper.year}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300">
                                <FileText size={20} />
                            </div>
                        </div>
                        
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-6 line-clamp-3">
                            {paper.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                            <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded"><Clock size={12}/> {paper.totalTime} Min</span>
                            <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded"><Database size={12}/> {paper.questions.length} Questions</span>
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <button 
                            onClick={() => handleStartSetExam(paper)}
                            className="w-full py-2.5 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl font-bold hover:border-primary hover:text-primary dark:hover:border-green-400 dark:hover:text-green-400 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                        >
                            <Play size={16} fill="currentColor" /> পরীক্ষা শুরু করুন
                        </button>
                    </div>
                </div>
             ))}
          </div>
        )}

        {/* --- SUBJECT WISE VIEW --- */}
        {mode === 'SUBJECT' && (
          <div className="grid md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2">
             
             {/* Controls */}
             <div className="md:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                   <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <BookOpen size={18} className="text-primary"/> ফিল্টার
                   </h3>
                   
                   <div className="space-y-4">
                      <div>
                         <label className="block text-xs font-bold text-gray-500 mb-2">বিষয় নির্বাচন করুন</label>
                         <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            <button 
                                onClick={() => setSelectedSubject('')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${!selectedSubject ? 'bg-primary/5 border-primary text-primary dark:text-green-400' : 'bg-gray-50 dark:bg-gray-700/50 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                সব বিষয় (All Subjects)
                            </button>
                            {Object.keys(SYLLABUS_DB).map(subject => (
                                <button 
                                    key={subject}
                                    onClick={() => setSelectedSubject(subject.split('(')[0].trim())} // Match mostly by English name
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${selectedSubject && subject.includes(selectedSubject) ? 'bg-primary/5 border-primary text-primary dark:text-green-400' : 'bg-gray-50 dark:bg-gray-700/50 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {subject.split('(')[0]}
                                </button>
                            ))}
                         </div>
                      </div>

                      <div>
                         <label className="block text-xs font-bold text-gray-500 mb-2">উৎস (Source)</label>
                         <div className="flex flex-wrap gap-2">
                            {['ALL', 'Medical', 'Engineering', 'Varsity'].map(src => (
                                <button
                                    key={src}
                                    onClick={() => setSelectedSource(src)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${selectedSource === src ? 'bg-gray-800 text-white border-gray-800 dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}
                                >
                                    {src === 'ALL' ? 'All' : src}
                                </button>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Results */}
             <div className="md:col-span-2">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center h-full flex flex-col justify-center items-center relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Database size={40} className="text-blue-500" />
                        </div>
                        
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {filteredQuestions.length} টি প্রশ্ন পাওয়া গেছে
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                            {selectedSubject || 'সকল বিষয়'} থেকে {selectedSource === 'ALL' ? 'সকল ভার্সিটি/মেডিকেলের' : selectedSource + ' এর'} বিগত বছরের প্রশ্ন।
                        </p>

                        <button 
                            onClick={handleStartSubjectExam}
                            disabled={filteredQuestions.length === 0}
                            className="bg-primary hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-green-900/20 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                        >
                            অনুশীলন শুরু করুন <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
             </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default QuestionBank;