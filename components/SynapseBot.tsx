import React, { useState, useRef, useEffect } from 'react';
import { Minimize2, X, Image as ImageIcon, Send, Sparkles, Bot } from 'lucide-react';

declare global {
  interface Window {
    MathJax: any;
  }
}

interface SynapseBotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
  sources?: { title: string; uri: string }[];
}

const SynapseBot: React.FC<SynapseBotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chatHistory, setChatHistory] = useState<{ role: string, parts: any[] }[]>([]);

  // --- STYLES ---
  const styles = `
    .synapse-bot-container * {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent;
    }
    .synapse-bot-container ::-webkit-scrollbar {
        width: 6px;
    }
    .synapse-bot-container ::-webkit-scrollbar-track {
        background: transparent;
    }
    .synapse-bot-container ::-webkit-scrollbar-thumb {
        background-color: #cbd5e1;
        border-radius: 20px;
    }
    .bot-loading-dot {
        animation: bot-blink 1.4s infinite both;
        color: #10b981;
    }
    .bot-loading-dot:nth-child(2) { animation-delay: 0.2s; }
    .bot-loading-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bot-blink {
        0%, 80%, 100% { opacity: 0; }
        40% { opacity: 1; }
    }
    .mcq-option:hover:not(.disabled) {
        transform: translateX(3px);
    }
    .mcq-explanation.show {
        display: block;
        animation: fadeIn 0.5s;
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
  `;

  // --- CONFIG ---
  const BOT_MODELS = [
    "gemini-2.5-flash-preview-09-2025",
    "gemini-2.5-flash-lite"
  ];
  // Securely get API key from Vite environment variable
  const getApiKey = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      return import.meta.env.VITE_API_KEY;
    }
    return '';
  };

  const BOT_KEYS = [getApiKey()]; 
  const BOT_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

  const SYSTEM_PROMPT = `তুমি হলে HSC পরীক্ষার প্রস্তুতিতে সাহায্য করার জন্য একজন অত্যন্ত জ্ঞানী, বন্ধুত্বপূর্ণ এবং স্মার্ট বড় ভাই (টিউটর)। তোমার সব উত্তর অবশ্যই নির্ভুল, সহজবোধ্য বাংলায় (বাংলা) দিতে হবে। তুমি সবসময় 'তুমি' করে সম্বোধন করবে এবং অনানুষ্ঠানিক, আন্তরিক ভাষায় কথা বলবে, যেন ছোট ভাই বা বন্ধুর সাথে কথা বলছো। তোমার লক্ষ্য হলো কঠিন বিষয়গুলো সরল ও সংক্ষিপ্তভাবে বোঝানো।

উত্তরগুলো অবশ্যই সংক্ষিপ্ত, সহজবোধ্য এবং শুধুমাত্র মূল ধারণার উপর মনোযোগ দিতে হবে। আউটপুট হবে শুধুমাত্র প্লেইন টেক্সট।

For ALL mathematical, physical, and chemical symbols/equations, ALWAYS use LaTeX syntax enclosed within single dollar signs ($). For example, use $\\vec{A} \\times \\vec{B}$ for vector product, $\\theta$ for theta, $\\frac{1}{2}$ for a half, and use subscripts/superscripts correctly (e.g., $H_2O$ for water). Ensure all LaTeX expressions are correctly formatted for MathJax rendering and appear INLINE within the text flow where needed.

You are ABSOLUTELY PROHIBITED from using ANY form of text formatting or structural Markdown symbols, including but not limited to: asterisks (*, **), hash symbols (#, ##, ###), pipe characters (|), lists (using * or -), or table markdown. ONLY use line breaks for paragraphs. Ensure the information is relevant to HSC subjects and use Google Search for accuracy and freshness.

**MCQ FEATURE:**
When you think a student needs practice or clarification on a topic, you can create an MCQ question. To do this, format your response with a special MCQ marker:

[MCQ_START]
Question: [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Correct: [A/B/C/D]
Explanation: [Detailed explanation why the correct answer is right and why others are wrong]
[MCQ_END]

Use MCQs strategically when:
- Student seems confused about a concept
- After explaining a difficult topic to reinforce understanding
- Student asks for practice questions
- To check if student understood your explanation`;

  // --- EFFECTS ---
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
       // Initial greeting is static in this version as per the HTML provided
    }
  }, [messages, isOpen]);

  useEffect(() => {
    scrollToBottom();
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise().catch((err: any) => console.error(err));
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- HANDLERS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        setSelectedImage({ data: base64, mimeType: file.type });
        setPreviewUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendBotMessage = async (modelIndex = 0, keyIndex = 0) => {
    const userQuery = input.trim();

    if (modelIndex === 0 && keyIndex === 0 && !userQuery && !selectedImage) return;

    // Initial State Update (Only on first attempt)
    if (modelIndex === 0 && keyIndex === 0) {
        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: userQuery,
            imageUrl: previewUrl || undefined
        };
        setMessages(prev => [...prev, newUserMsg]);
        setLoading(true);
        setInput('');
        
        // Prepare History
        const userParts: any[] = [{ text: userQuery }];
        if (selectedImage) {
            userParts.push({
                inlineData: {
                    mimeType: selectedImage.mimeType,
                    data: selectedImage.data
                }
            });
        }
        setChatHistory(prev => [...prev, { role: "user", parts: userParts }]);
        removeImage();
    }

    const currentModel = BOT_MODELS[modelIndex];
    const currentApiKey = BOT_KEYS[keyIndex];
    const apiUrl = `${BOT_API_URL}${currentModel}:generateContent?key=${currentApiKey}`;

    // Payload logic
    let payloadHistory = [...chatHistory];
    if (modelIndex === 0 && keyIndex === 0) {
         const userParts: any[] = [{ text: userQuery }];
         if (selectedImage) {
             userParts.push({
                 inlineData: {
                     mimeType: selectedImage.mimeType,
                     data: selectedImage.data
                 }
             });
         }
         payloadHistory.push({ role: "user", parts: userParts });
    }

    const payload = {
        contents: payloadHistory,
        tools: [{ "google_search": {} }],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { temperature: 0.2 }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const result = await response.json();
        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            const botText = candidate.content.parts[0].text;
            
            // Extract sources
            let sources: { title: string, uri: string }[] = [];
            const groundingMetadata = candidate.groundingMetadata;
            if (groundingMetadata && groundingMetadata.groundingAttributions) {
                sources = groundingMetadata.groundingAttributions
                    .map((attr: any) => ({ uri: attr.web?.uri, title: attr.web?.title }))
                    .filter((s: any) => s.uri && s.title);
            }

            // Update State
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: botText,
                sources: sources
            }]);
            setChatHistory(prev => [...prev, { role: "model", parts: [{ text: botText }] }]);
            setLoading(false);
            return;
        } else {
            throw new Error("Empty response");
        }

    } catch (error) {
        console.error(`Attempt failed with ${currentModel}:`, error);

        // Failover Logic
        if (keyIndex < BOT_KEYS.length - 1) {
             sendBotMessage(modelIndex, keyIndex + 1); // Try next key
        } else if (modelIndex < BOT_MODELS.length - 1) {
             sendBotMessage(modelIndex + 1, 0); // Try next model
        } else {
             // All failed
             setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: "দুঃখিত! API সংযোগে সমস্যা হচ্ছে। দয়া করে একটু পরে আবার চেষ্টা করুন।"
             }]);
             setLoading(false);
        }
    }
  };

  // --- RENDER HELPERS ---

  const parseMCQ = (text: string) => {
      const mcqRegex = /\[MCQ_START\]([\s\S]*?)\[MCQ_END\]/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = mcqRegex.exec(text)) !== null) {
          if (match.index > lastIndex) {
              parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
          }

          const lines = match[1].trim().split('\n').map(l => l.trim()).filter(l => l);
          const mcqData = { question: '', options: [] as any[], correct: '', explanation: '' };

          lines.forEach(line => {
              if (line.startsWith('Question:')) mcqData.question = line.replace('Question:', '').trim();
              else if (line.match(/^[A-D]\)/)) mcqData.options.push({ label: line.charAt(0), text: line.substring(2).trim() });
              else if (line.startsWith('Correct:')) mcqData.correct = line.replace('Correct:', '').trim();
              else if (line.startsWith('Explanation:')) mcqData.explanation = line.replace('Explanation:', '').trim();
          });

          parts.push({ type: 'mcq', data: mcqData });
          lastIndex = mcqRegex.lastIndex;
      }
      if (lastIndex < text.length) parts.push({ type: 'text', content: text.substring(lastIndex) });
      return parts.length > 0 ? parts : [{ type: 'text', content: text }];
  };

  const MCQBlock: React.FC<{ data: any }> = ({ data }) => {
      const [selected, setSelected] = useState<string | null>(null);

      return (
          <div className="mcq-container bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 my-3 shadow-sm">
              <div className="mcq-question font-bold text-gray-800 dark:text-white mb-3 border-b border-dashed border-blue-200 dark:border-blue-800 pb-2">
                  {data.question}
              </div>
              <div className="space-y-2">
                  {data.options.map((opt: any) => {
                      let btnClass = "mcq-option w-full text-left p-3 rounded-lg border flex items-start gap-3 transition-all ";
                      if (selected) {
                          if (opt.label === data.correct) btnClass += "bg-emerald-500 border-emerald-600 text-white font-medium shadow-md";
                          else if (opt.label === selected) btnClass += "bg-red-50 border-red-300 text-red-800";
                          else btnClass += "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed";
                      } else {
                          btnClass += "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300";
                      }
                      
                      return (
                          <button key={opt.label} onClick={() => !selected && setSelected(opt.label)} disabled={!!selected} className={btnClass}>
                              <span className="font-bold min-w-[20px]">{opt.label})</span>
                              <span>{opt.text}</span>
                          </button>
                      );
                  })}
              </div>
              {selected && (
                  <div className={`mcq-explanation show mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 rounded text-sm text-emerald-900 dark:text-emerald-100`}>
                      <strong>ব্যাখ্যা:</strong> {data.explanation}
                  </div>
              )}
          </div>
      );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[450px] md:h-[650px] bg-white dark:bg-gray-800 md:rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 font-sans animate-in slide-in-from-bottom-5 synapse-bot-container">
      <style>{styles}</style>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-emerald-700 p-4 flex items-center justify-between text-white shadow-lg shrink-0">
         <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Bot size={20} className="text-white" />
            </div>
            <div>
                <h3 className="font-bold text-lg leading-none">Synapse</h3>
                <p className="text-[10px] text-green-100 opacity-90 font-medium tracking-wide mt-1 italic">তোমার HSC টিউটর বট</p>
            </div>
         </div>
         <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <Minimize2 size={20} />
         </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#eef2f6] dark:bg-gray-900 scroll-smooth">
         {messages.length === 0 && (
             <div className="text-center mt-10 p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-md mb-4 text-emerald-600">
                    <Sparkles size={32} />
                </div>
                <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">Synapse: HSC ডাউট সল্ভার</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">আমি তোমার গণিত, পদার্থবিদ্যা, রসায়ন এবং জীববিজ্ঞানের যেকোনো ডাউট সমাধান করতে পারি। প্রশ্ন করো বা ছবি পাঠাও।</p>
             </div>
         )}

         {messages.map((msg) => (
             <div key={msg.id} className={`mb-4 flex flex-col max-w-[90%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                 {msg.imageUrl && (
                     <img src={msg.imageUrl} className="max-w-[200px] rounded-lg border border-gray-200 dark:border-gray-700 mb-2 shadow-sm" alt="Upload" />
                 )}
                 
                 <div className={`p-3 md:p-4 rounded-2xl text-[0.95rem] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-transparent text-gray-800 dark:text-gray-100 p-0 shadow-none'}`}>
                     {msg.role === 'user' ? (
                         msg.text
                     ) : (
                         <div>
                             {parseMCQ(msg.text).map((part, idx) => (
                                 part.type === 'mcq' ? <MCQBlock key={idx} data={part.data} /> : <p key={idx} className="mb-2 whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: (part.content || '').replace(/\n/g, '<br/>')}}></p>
                             ))}
                             {msg.sources && msg.sources.length > 0 && (
                                 <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                                     <p className="font-bold mb-1">তথ্যসূত্র:</p>
                                     <ul className="list-disc pl-4 space-y-1">
                                         {msg.sources.map((s, i) => (
                                             <li key={i}><a href={s.uri} target="_blank" rel="noreferrer" className="text-emerald-600 underline hover:text-emerald-700">{s.title || 'Source'}</a></li>
                                         ))}
                                     </ul>
                                 </div>
                             )}
                         </div>
                     )}
                 </div>
             </div>
         ))}
         
         <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] shrink-0">
         {loading && (
             <div className="flex items-center gap-1 text-sm text-emerald-500 font-medium mb-2 pl-2">
                 Synapse চিন্তা করছে<span className="bot-loading-dot">.</span><span className="bot-loading-dot">.</span><span className="bot-loading-dot">.</span>
             </div>
         )}

         {previewUrl && (
             <div className="mb-2 relative inline-block">
                 <img src={previewUrl} className="h-20 rounded-lg border-2 border-emerald-500" alt="Preview"/>
                 <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:bg-red-600"><X size={14}/></button>
             </div>
         )}

         <div className="flex items-center gap-2">
            <label className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <ImageIcon size={20} />
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendBotMessage()}
                placeholder="তোমার প্রশ্নটি লিখো..."
                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
            />
            
            <button 
                onClick={() => sendBotMessage()}
                disabled={loading || (!input.trim() && !selectedImage)}
                className="p-3 bg-primary text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
            >
                <Send size={18} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default SynapseBot;
