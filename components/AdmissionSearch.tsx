import React, { useState } from 'react';
import { searchAdmissionInfo } from '../services/geminiService';
import { Search, Loader2, ExternalLink, GraduationCap } from 'lucide-react';
import { AdmissionResult } from '../types';
import ReactMarkdown from 'react-markdown';

const AdmissionSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AdmissionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await searchAdmissionInfo(query);
      setResult(data);
    } catch (err) {
      setResult({ 
        text: "দুঃখিত, তথ্য খুঁজে পেতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।", 
        sources: [] 
      });
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "ঢাকা বিশ্ববিদ্যালয় ভর্তি বিজ্ঞপ্তি ২০২৪",
    "বুয়েট ভর্তি পরীক্ষার তারিখ",
    "মেডিকেল ভর্তি যোগ্যতা",
    "GST গুচ্ছ ভর্তি পদ্ধতি"
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
       <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 text-white rounded-t-2xl">
         <div className="flex items-center gap-3 mb-4">
           <div className="p-2 bg-white/10 rounded-lg">
            <GraduationCap size={24} className="text-green-400" />
           </div>
           <h2 className="text-2xl font-bold">ভর্তি তথ্য সহায়ক</h2>
         </div>
         <p className="text-gray-300 mb-6">বিশ্ববিদ্যালয় ভর্তি পরীক্ষার সর্বশেষ তথ্য, তারিখ এবং যোগ্যতা জানুন।</p>
         
         <form onSubmit={handleSearch} className="relative max-w-2xl">
           <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="কি জানতে চান? (যেমন: বুয়েট পরীক্ষার তারিখ)"
            className="w-full pl-5 pr-14 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none shadow-lg dark:bg-gray-800 dark:text-white"
           />
           <button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-primary text-white p-2.5 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-70"
           >
             {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
           </button>
         </form>

         {!result && !loading && (
           <div className="mt-6 flex flex-wrap gap-2">
             {suggestions.map((s) => (
               <button 
                key={s}
                onClick={() => setQuery(s)}
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors border border-white/10"
               >
                 {s}
               </button>
             ))}
           </div>
         )}
       </div>

       <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
         {result && (
           <div className="max-w-4xl mx-auto space-y-6">
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
               <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">ফলাফল</h3>
               <div className="prose prose-green dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                 <ReactMarkdown>{result.text}</ReactMarkdown>
               </div>
             </div>

             {result.sources.length > 0 && (
               <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                 <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">তথ্যসূত্র (Sources)</h3>
                 <div className="grid gap-3 sm:grid-cols-2">
                   {result.sources.map((source, idx) => (
                     <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
                     >
                       <div className="mt-1 min-w-[16px]">
                         <ExternalLink size={16} className="text-gray-400 group-hover:text-primary dark:text-gray-500 dark:group-hover:text-green-400" />
                       </div>
                       <div>
                         <p className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline line-clamp-2">{source.title}</p>
                         <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{source.uri}</p>
                       </div>
                     </a>
                   ))}
                 </div>
               </div>
             )}
           </div>
         )}
         
         {!result && !loading && (
           <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-600">
             <Search size={48} className="mb-4 opacity-20" />
             <p>ফলাফল দেখতে সার্চ করুন</p>
           </div>
         )}
       </div>
    </div>
  );
};

export default AdmissionSearch;