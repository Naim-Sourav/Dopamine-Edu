
import React, { useState, useEffect, useRef } from 'react';
import { Swords, Zap, Trophy, UserPlus, Loader2, Play, Copy, Clock, CheckCircle, XCircle, Timer, Award, Hourglass, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createBattleRoom, joinBattleRoom, getBattleState, submitBattleAnswer, startBattle } from '../services/api';
import { SYLLABUS_DB } from '../services/syllabusData';
import confetti from 'canvas-confetti';

interface BattlePlayer {
  uid: string;
  name: string;
  avatar: string;
  college: string;
  score: number;
  totalTime: number;
  team: 'A' | 'B' | 'NONE';
}

interface BattleAnswer {
    userId: string;
    questionIndex: number;
    selectedOption: number;
    isCorrect: boolean;
    timeTaken: number;
}

interface BattleState {
  roomId: string;
  hostId: string;
  status: 'WAITING' | 'ACTIVE' | 'FINISHED';
  config: any;
  questions: any[];
  players: BattlePlayer[];
  currentQuestionIndex: number;
  answers: BattleAnswer[];
  startTime?: number; // Timestamp of when current Q started
}

const QuizBattlePrototype: React.FC = () => {
  const { currentUser, userAvatar, extendedProfile } = useAuth();
  
  const [phase, setPhase] = useState<'SETUP' | 'LOBBY' | 'JOIN' | 'GAME' | 'RESULT'>('SETUP');
  const [roomId, setRoomId] = useState('');
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Game Internal State
  const [timeLeft, setTimeLeft] = useState(0);
  const [localSelectedOption, setLocalSelectedOption] = useState<number | null>(null);
  const [isRoundLocked, setIsRoundLocked] = useState(false); // Locked after answering
  const [isRevealPhase, setIsRevealPhase] = useState(false); // Show Green/Red
  
  const pollInterval = useRef<any>(null);
  const timerInterval = useRef<any>(null);

  // Setup Config
  const [config, setConfig] = useState({
    subject: 'Physics 1st Paper',
    mode: '1v1',
    questionCount: 5,
    timePerQuestion: 15
  });

  // --- API CALLS ---

  const handleCreateRoom = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await createBattleRoom(currentUser.uid, currentUser.displayName || 'Host', userAvatar, extendedProfile?.college || '', config);
      setRoomId(data.roomId);
      setPhase('LOBBY');
      startPolling(data.roomId);
    } catch (err) {
      setError('রুম তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!currentUser || !roomId) return;
    setLoading(true);
    setError('');
    try {
      await joinBattleRoom(roomId, currentUser.uid, currentUser.displayName || 'Player', userAvatar, extendedProfile?.college || '');
      setPhase('LOBBY');
      startPolling(roomId);
    } catch (err) {
      setError('রুম পাওয়া যায়নি বা রুম ফুল।');
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!currentUser || !roomId) return;
    try {
        await startBattle(roomId, currentUser.uid);
    } catch (e) {
        alert("Failed to start");
    }
  };

  const startPolling = (id: string) => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    fetchState(id);
    pollInterval.current = setInterval(() => fetchState(id), 1000);
  };

  const fetchState = async (id: string) => {
    try {
      const state = await getBattleState(id);
      setBattleState(state);

      if (state.status === 'ACTIVE') {
         if (phase !== 'GAME') setPhase('GAME');
         handleGameState(state);
      } else if (state.status === 'FINISHED') {
         if (phase !== 'RESULT') {
             setPhase('RESULT');
             triggerWinConfetti(state);
         }
         if (pollInterval.current) clearInterval(pollInterval.current);
      }
    } catch (err) {
      console.error("Polling error", err);
    }
  };

  // --- GAME LOGIC ---

  const handleGameState = (state: BattleState) => {
      // 1. Sync Timer
      if (state.startTime && !isRevealPhase) {
          const elapsed = (Date.now() - state.startTime) / 1000;
          const remaining = Math.max(0, Math.ceil(state.config.timePerQuestion - elapsed));
          setTimeLeft(remaining);

          // Auto-submit if time runs out and haven't answered
          if (remaining === 0 && !isRoundLocked && !isRevealPhase) {
              handleTimeOutSubmit();
          }
      }

      // 2. Check if new question started (Reset State)
      if (state.currentQuestionIndex !== battleState?.currentQuestionIndex) {
          setIsRoundLocked(false);
          setLocalSelectedOption(null);
          setIsRevealPhase(false);
      }

      // 3. Check for Reveal Condition (All players answered OR Time up)
      const currentQIndex = state.currentQuestionIndex;
      const answersForQ = state.answers.filter(a => a.questionIndex === currentQIndex);
      const allAnswered = answersForQ.length >= state.players.length;
      
      if ((allAnswered || timeLeft === 0) && !isRevealPhase) {
          setIsRevealPhase(true);
          
          // If Host, trigger next question after delay
          if (currentUser?.uid === state.hostId) {
              setTimeout(() => {
                  triggerNextQuestion(state.roomId, currentQIndex + 1);
              }, 3000);
          }
      }
  };

  const handleOptionClick = async (idx: number) => {
      if (isRoundLocked || isRevealPhase || !battleState || !currentUser) return;
      
      setIsRoundLocked(true); // Immediate Lock
      setLocalSelectedOption(idx);
      
      const timeTaken = battleState.config.timePerQuestion - timeLeft;
      
      try {
          await submitBattleAnswer(battleState.roomId, currentUser.uid, battleState.currentQuestionIndex, idx, timeTaken);
      } catch (e) {
          console.error("Submit failed", e);
      }
  };

  const handleTimeOutSubmit = async () => {
      if (isRoundLocked || !battleState || !currentUser) return;
      setIsRoundLocked(true);
      // Submit -1 as selectedOption to indicate timeout/skip
      await submitBattleAnswer(battleState.roomId, currentUser.uid, battleState.currentQuestionIndex, -1, battleState.config.timePerQuestion);
  };

  const triggerNextQuestion = async (roomId: string, nextIndex: number) => {
      try {
          await fetch(`https://mongodb-hb6b.onrender.com/api/battles/${roomId}/next-question`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nextIndex })
          });
      } catch (e) { console.error(e); }
  };

  const triggerWinConfetti = (state: BattleState) => {
      // Find winner
      const sorted = [...state.players].sort((a,b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.totalTime - b.totalTime; // Less time wins
      });
      if (sorted[0].uid === currentUser?.uid) {
          confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 }
          });
      }
  };

  useEffect(() => {
    return () => { 
        if (pollInterval.current) clearInterval(pollInterval.current); 
        if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, []);

  // --- RENDERERS ---

  const renderSetup = () => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 p-6 animate-in fade-in">
       <div className="text-center mt-10 mb-8">
          <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Swords size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">কুইজ ব্যাটল</h1>
          <p className="text-gray-500 mt-2">লাইভ ১ বনাম ১ লড়াই</p>
       </div>

       <div className="space-y-4 max-w-md mx-auto w-full">
           <button onClick={() => setPhase('JOIN')} className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 flex items-center justify-center gap-3 transition-all">
               <UserPlus size={24} className="text-blue-500"/>
               <span className="font-bold text-gray-700 dark:text-gray-300">কোড দিয়ে জয়েন করুন</span>
           </button>
           
           <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-900 px-2 text-gray-500">অথবা রুম তৈরি করুন</span></div>
           </div>

           <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl space-y-4 border border-gray-200 dark:border-gray-700">
               <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">বিষয়</label>
                   <select 
                     value={config.subject} 
                     onChange={e => setConfig({...config, subject: e.target.value})}
                     className="w-full mt-1 p-3 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                   >
                       {Object.keys(SYLLABUS_DB).map(s => <option key={s} value={s}>{s.split('(')[0]}</option>)}
                   </select>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                   <div>
                       <label className="text-xs font-bold text-gray-500 uppercase">প্রশ্ন সংখ্যা</label>
                       <select value={config.questionCount} onChange={e => setConfig({...config, questionCount: Number(e.target.value)})} className="w-full mt-1 p-3 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
                           <option value="5">৫টি</option>
                           <option value="10">১০টি</option>
                       </select>
                   </div>
                   <div>
                       <label className="text-xs font-bold text-gray-500 uppercase">সময় (সেকেন্ড)</label>
                       <select value={config.timePerQuestion} onChange={e => setConfig({...config, timePerQuestion: Number(e.target.value)})} className="w-full mt-1 p-3 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
                           <option value="10">১০ সেকেন্ড</option>
                           <option value="15">১৫ সেকেন্ড</option>
                           <option value="20">২০ সেকেন্ড</option>
                       </select>
                   </div>
               </div>

               <button 
                 onClick={handleCreateRoom}
                 disabled={loading}
                 className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-green-700 shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
               >
                 {loading ? <Loader2 className="animate-spin"/> : 'রুম তৈরি করুন'}
               </button>
           </div>
       </div>
    </div>
  );

  const renderJoin = () => (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 animate-in zoom-in-95">
          <div className="w-full max-w-sm space-y-6">
              <button onClick={() => setPhase('SETUP')} className="text-gray-500 font-bold mb-4 flex items-center gap-1">← ফিরে যান</button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">কোড প্রবেশ করান</h2>
              <input 
                type="text" 
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                className="w-full p-4 text-center text-4xl font-mono tracking-widest rounded-2xl border-2 border-gray-200 focus:border-primary focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700"
                placeholder="123456"
                maxLength={6}
              />
              {error && <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-2 rounded">{error}</p>}
              <button onClick={handleJoinRoom} disabled={loading || roomId.length < 6} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex justify-center shadow-lg active:scale-95 transition-all">
                  {loading ? <Loader2 className="animate-spin"/> : 'জয়েন করুন'}
              </button>
          </div>
      </div>
  );

  const renderLobby = () => {
      if (!battleState) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary"/></div>;
      const isHost = battleState.hostId === currentUser?.uid;
      
      return (
          <div className="h-full flex flex-col bg-white dark:bg-gray-900 p-6 animate-in fade-in">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 text-center mb-8">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">রুম কোড</p>
                  <h1 onClick={() => navigator.clipboard.writeText(roomId)} className="text-5xl font-mono font-bold text-primary dark:text-green-400 tracking-widest cursor-pointer active:scale-95 transition-transform">{roomId}</h1>
                  <p className="text-xs text-gray-400 mt-2">Tap to copy</p>
              </div>

              <h3 className="font-bold text-gray-800 dark:text-white mb-4">খেলোয়াড় ({battleState.players.length}/2)</h3>
              <div className="grid grid-cols-2 gap-4 mb-auto">
                  {battleState.players.map((p, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 flex flex-col items-center shadow-sm relative overflow-hidden">
                          {p.uid === battleState.hostId && <div className="absolute top-2 right-2 text-[10px] bg-yellow-100 text-yellow-700 px-2 rounded font-bold">HOST</div>}
                          <img src={p.avatar} className="w-16 h-16 rounded-full mb-3 bg-gray-100 object-cover border-2 border-white shadow"/>
                          <p className="font-bold text-gray-800 dark:text-white text-sm text-center line-clamp-1">{p.name}</p>
                          <p className="text-[10px] text-gray-500 text-center line-clamp-1">{p.college || 'No College'}</p>
                      </div>
                  ))}
                  {[...Array(2 - battleState.players.length)].map((_, i) => (
                      <div key={i} className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center p-4 opacity-50">
                          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-2 animate-pulse"></div>
                          <span className="text-gray-400 font-bold text-xs">Waiting...</span>
                      </div>
                  ))}
              </div>

              {isHost ? (
                  <button 
                    onClick={handleStartGame}
                    disabled={battleState.players.length < 2}
                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-green-700 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                      <Play fill="currentColor" size={20}/> খেলা শুরু করুন
                  </button>
              ) : (
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl">
                      <p className="text-yellow-700 dark:text-yellow-400 font-bold animate-pulse">হোস্টের শুরুর অপেক্ষায়...</p>
                  </div>
              )}
          </div>
      );
  };

  const renderGame = () => {
      if (!battleState || !currentUser) return null;
      const q = battleState.questions[battleState.currentQuestionIndex];
      const myPlayer = battleState.players.find(p => p.uid === currentUser.uid);
      const opponent = battleState.players.find(p => p.uid !== currentUser.uid);
      
      const opponentHasAnswered = battleState.answers.some(a => a.userId === opponent?.uid && a.questionIndex === battleState.currentQuestionIndex);

      return (
          <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
              
              {/* Top Bar: Players */}
              <div className="flex justify-between items-start p-4 bg-white dark:bg-gray-800 shadow-sm z-10 shrink-0">
                  {/* Me */}
                  <div className="flex items-center gap-3">
                      <div className="relative">
                          <img src={myPlayer?.avatar} className="w-10 h-10 rounded-full border-2 border-green-500 shadow-sm"/>
                          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">You</div>
                      </div>
                      <div>
                          <p className="font-bold text-gray-800 dark:text-white text-sm leading-none">{myPlayer?.score}</p>
                          <p className="text-[10px] text-gray-500">Points</p>
                      </div>
                  </div>

                  {/* Timer */}
                  <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border-4 ${timeLeft <= 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-blue-500 text-blue-500'} bg-white dark:bg-gray-800 font-bold text-lg shadow-md`}>
                      {timeLeft}
                  </div>

                  {/* Opponent */}
                  <div className="flex items-center gap-3 flex-row-reverse text-right">
                      <div className="relative">
                          <img src={opponent?.avatar} className={`w-10 h-10 rounded-full border-2 shadow-sm ${opponentHasAnswered ? 'border-green-500 opacity-100' : 'border-gray-300 opacity-70'}`}/>
                          {opponentHasAnswered && <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5"><CheckCircle size={10}/></div>}
                      </div>
                      <div>
                          <p className="font-bold text-gray-800 dark:text-white text-sm leading-none">{opponent?.score}</p>
                          <p className="text-[10px] text-gray-500">{opponent?.name.split(' ')[0]}</p>
                      </div>
                  </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-gray-200 dark:bg-gray-700 w-full shrink-0">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${((battleState.currentQuestionIndex + 1) / battleState.config.questionCount) * 100}%` }}></div>
              </div>

              {/* Question Area - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
                  <div className="w-full max-w-2xl">
                      <span className="inline-block px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-xs font-bold mb-4">
                          Question {battleState.currentQuestionIndex + 1} of {battleState.config.questionCount}
                      </span>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white leading-relaxed text-center">
                          {q.question}
                      </h2>
                  </div>
              </div>

              {/* Status Message (Waiting) */}
              {isRoundLocked && !isRevealPhase && (
                  <div className="absolute inset-0 z-20 bg-black/10 backdrop-blur-[2px] flex flex-col items-center justify-center">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in">
                          {opponentHasAnswered ? (
                              <>
                                  <Loader2 className="animate-spin text-blue-500 mb-2" size={32}/>
                                  <p className="font-bold text-gray-700 dark:text-gray-200">Checking results...</p>
                              </>
                          ) : (
                              <>
                                  <Hourglass className="animate-pulse text-orange-500 mb-2" size={32}/>
                                  <p className="font-bold text-gray-700 dark:text-gray-200">Waiting for opponent...</p>
                              </>
                          )}
                      </div>
                  </div>
              )}

              {/* Options Area - Fixed Bottom */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0 z-30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {q.options.map((opt: string, idx: number) => {
                          let btnClass = "w-full p-4 rounded-xl border-2 text-left font-bold transition-all transform active:scale-[0.98] shadow-sm ";
                          
                          if (isRevealPhase) {
                              if (idx === q.correctAnswerIndex) btnClass += "bg-green-500 border-green-600 text-white "; // Correct
                              else if (idx === localSelectedOption) btnClass += "bg-red-500 border-red-600 text-white "; // Wrong selected
                              else btnClass += "bg-gray-100 border-gray-200 text-gray-400 opacity-50 "; // Others
                          } else {
                              if (localSelectedOption === idx) btnClass += "bg-blue-500 border-blue-600 text-white "; // Selected
                              else if (isRoundLocked) btnClass += "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed "; // Locked others
                              else btnClass += "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 "; // Normal
                          }

                          return (
                              <button 
                                key={idx}
                                onClick={() => handleOptionClick(idx)}
                                disabled={isRoundLocked || isRevealPhase}
                                className={btnClass}
                              >
                                  <div className="flex items-center justify-between">
                                      <span>{opt}</span>
                                      {isRevealPhase && idx === q.correctAnswerIndex && <CheckCircle size={20} className="text-white"/>}
                                      {isRevealPhase && idx === localSelectedOption && idx !== q.correctAnswerIndex && <XCircle size={20} className="text-white"/>}
                                  </div>
                              </button>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  };

  const renderResult = () => {
      if (!battleState) return null;
      
      // Determine Winner
      const sortedPlayers = [...battleState.players].sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.totalTime - b.totalTime;
      });
      const winner = sortedPlayers[0];
      const isDraw = sortedPlayers[0].score === sortedPlayers[1].score && Math.abs(sortedPlayers[0].totalTime - sortedPlayers[1].totalTime) < 1;
      const isWinner = winner.uid === currentUser?.uid;

      return (
          <div className="h-full bg-white dark:bg-gray-900 overflow-y-auto p-6 animate-in fade-in">
              {/* Winner Header */}
              <div className="text-center mt-8 mb-10">
                  <div className="relative inline-block">
                      <div className={`w-32 h-32 rounded-full border-4 ${isWinner ? 'border-yellow-400' : 'border-gray-300'} p-1 mx-auto mb-4 relative z-10 bg-white`}>
                          <img src={winner.avatar} className="w-full h-full rounded-full object-cover"/>
                      </div>
                      {isWinner && <Crown size={40} className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce z-20" fill="currentColor"/>}
                  </div>
                  
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {isDraw ? "It's a Draw!" : isWinner ? "You Won!" : "You Lost!"}
                  </h2>
                  <div className="flex justify-center gap-4 text-sm font-bold text-gray-500">
                      <span className="flex items-center gap-1"><Trophy size={14} className="text-yellow-500"/> {winner.score} Pts</span>
                      <span className="flex items-center gap-1"><Clock size={14}/> {winner.totalTime.toFixed(1)}s</span>
                  </div>
              </div>

              {/* Detailed Comparison */}
              <div className="max-w-2xl mx-auto space-y-6">
                  <h3 className="font-bold text-gray-700 dark:text-gray-300 text-lg border-b border-gray-200 dark:border-gray-700 pb-2">ম্যাচ হাইলাইটস</h3>
                  
                  {battleState.questions.map((q, idx) => {
                      const myAns = battleState.answers.find(a => a.userId === currentUser?.uid && a.questionIndex === idx);
                      const oppAns = battleState.answers.find(a => a.userId !== currentUser?.uid && a.questionIndex === idx);
                      
                      return (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                              <p className="text-sm font-bold text-gray-800 dark:text-white mb-3"><span className="text-gray-400 mr-2">Q{idx+1}.</span>{q.question}</p>
                              
                              <div className="flex items-center gap-4 text-xs">
                                  {/* Me */}
                                  <div className={`flex-1 p-2 rounded-lg border flex items-center justify-between ${myAns?.isCorrect ? 'bg-green-100 border-green-300 text-green-800' : 'bg-red-100 border-red-300 text-red-800'}`}>
                                      <div className="flex items-center gap-2">
                                          <span className="font-bold">You</span>
                                          {myAns ? (
                                              <span>{q.options[myAns.selectedOption]}</span>
                                          ) : <span>Skipped</span>}
                                      </div>
                                      <span className="font-mono">{myAns?.timeTaken.toFixed(1)}s</span>
                                  </div>

                                  {/* Opponent */}
                                  <div className={`flex-1 p-2 rounded-lg border flex items-center justify-between ${oppAns?.isCorrect ? 'bg-green-100 border-green-300 text-green-800' : 'bg-red-100 border-red-300 text-red-800'}`}>
                                      <div className="flex items-center gap-2">
                                          <span className="font-bold">Opp</span>
                                          {oppAns ? (
                                              <span>{q.options[oppAns.selectedOption]}</span>
                                          ) : <span>Skipped</span>}
                                      </div>
                                      <span className="font-mono">{oppAns?.timeTaken.toFixed(1)}s</span>
                                  </div>
                              </div>
                          </div>
                      )
                  })}
              </div>

              <div className="mt-10 flex justify-center">
                  <button onClick={() => window.location.reload()} className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all">
                      লবিতে ফিরে যান
                  </button>
              </div>
          </div>
      );
  };

  return (
    <div className="h-full bg-white dark:bg-gray-900 transition-colors font-sans">
      {phase === 'SETUP' && renderSetup()}
      {phase === 'JOIN' && renderJoin()}
      {phase === 'LOBBY' && renderLobby()}
      {phase === 'GAME' && renderGame()}
      {phase === 'RESULT' && renderResult()}
    </div>
  );
};

// Simple Confetti Helper
function Crown({ size, className, fill }: any) {
    return <Trophy size={size} className={className} fill={fill}/>
}

export default QuizBattlePrototype;
