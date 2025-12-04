import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { explainConcept } from '../services/geminiService';
import { Subject, ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

const ConceptTutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'আসসালামু আলাইকুম! আমি তোমার পার্সোনাল ওস্তাদ। পদার্থবিজ্ঞান, রসায়ন বা গণিতের কোনো টপিক বুঝতে চাও? আমাকে বলো!',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.PHYSICS);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Prepare history for API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await explainConcept(userMsg.text, selectedSubject, history);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "দুঃখিত, আমি উত্তরটি তৈরি করতে পারিনি। আবার চেষ্টা করুন।",
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "সাময়িক যান্ত্রিক ত্রুটি দেখা দিয়েছে। দয়া করে একটু পরে আবার চেষ্টা করুন।",
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">কনসেপ্ট ওস্তাদ</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">জটিল বিষয় সহজ করে বুঝুন</p>
        </div>
        <select 
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value as Subject)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
        >
          {Object.values(Subject).map((sub) => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-gray-900 transition-colors">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'user' ? 'bg-primary text-white ml-2' : 'bg-white dark:bg-gray-700 text-secondary dark:text-red-400 border border-gray-200 dark:border-gray-600 mr-2'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed overflow-hidden ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-none'
            }`}>
               <ReactMarkdown 
                 components={{
                   ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2" {...props} />,
                   ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2" {...props} />,
                   strong: ({node, ...props}) => <span className="font-bold text-inherit" {...props} />,
                   p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                 }}
               >
                 {msg.text}
               </ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm ml-12">
            <Loader2 className="animate-spin" size={16} />
            <span>লিখছেন...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="আপনার প্রশ্ন এখানে লিখুন..."
            className="flex-1 p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 bg-primary text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConceptTutor;