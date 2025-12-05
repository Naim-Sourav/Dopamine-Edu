import React, { useState, useEffect, useRef } from 'react';
import { Swords, Zap, Trophy, UserPlus, ShieldAlert, Loader2, Play, Copy, Clock, Users, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createBattleRoom, joinBattleRoom, getBattleState, submitBattleAnswer, startBattle } from '../services/api';
import { SYLLABUS_DB } from '../services/syllabusData';

interface BattlePlayer {
  uid: string;
  name: string;
  avatar: string;
  score: number;
  team: 'A' | 'B' | 'NONE';
}

interface BattleConfig {
  subject: string;
  mode: '1v1' | '2v2' | 'FFA';
  questionCount: number;
  timePerQuestion: number;
}

interface BattleState {
  roomId: string;
  hostId: string;
  status: 'WAITING' | 'ACTIVE' | 'FINISHED';
  config: BattleConfig;
  questions: any[];
  players: BattlePlayer[];
  startTime?: number;
}

const QuizBattlePrototype: React.FC = () => {
  const { currentUser, userAvatar } = useAuth();
  
  const [phase, setPhase] = useState<'SETUP' | 'LOBBY' | 'JOIN' | 'GAME' | 'RESULT'>('SETUP');
  const [roomId, setRoomId] = useState('');
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Setup Config State
  const [config, setConfig] = useState<BattleConfig>({
    subject: 'Physics 1st Paper',
    mode: '1v1',
    questionCount: 5,
    timePerQuestion: 15
  });

  // Game State
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const pollInterval = useRef<any>(null);

  // --- ACTIONS ---

  const handleCreateRoom = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await createBattleRoom(currentUser.uid, currentUser.displayName || 'Host', userAvatar, config);
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
      await joinBattleRoom(roomId, currentUser.uid, currentUser.displayName || 'Player', userAvatar);
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
         setPhase('GAME');
         syncGameTimer(state);
      } else if (state.status === 'FINISHED') {
         setPhase('RESULT');
         if (pollInterval.current) clearInterval(pollInterval.current);
      }
    } catch (err) {
      console.error("Polling error", err);
    }
  };

  const syncGameTimer = (state: BattleState) => {
    if (!state.startTime) return;
    const elapsed = (Date.now() - state.startTime) / 1000;
    const qDuration = state.config.timePerQuestion;
    const qIndex = Math.floor(elapsed / qDuration);
    const timeInCurrentQ = elapsed % qDuration;
    
    if (qIndex >= state.questions.length) {
       setPhase('RESULT');
    } else {
       if (qIndex !== currentQIndex) {
         setCurrentQIndex(qIndex);
         setHasAnswered(false);
       }
       setTimeLeft(Math.max(0, Math.floor(qDuration - timeInCurrentQ)));
    }
  };

  const handleAnswer = async (index: number) => {
    if (hasAnswered || !battleState || !currentUser) return;
    setHasAnswered(true);
    const currentQ = battleState.questions[currentQIndex];
    const isCorrect = index === Number(currentQ.correctAnswerIndex);
    await submitBattleAnswer(roomId, currentUser.uid, isCorrect);
  };

  useEffect(() => {
    return () => { if (pollInterval.current) clearInterval(pollInterval.current); };
  }, []);

  // --- RENDERERS ---

  const renderSetup = () => (
    <div className="max-w-2xl mx-auto p-6 animate-in fade-in">
       <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Swords size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ব্যাটল জোন</h1>
          <p className="text-gray-500 mt-2">বন্ধুদের সাথে লাইভ প্রতিযোগিতা</p>
       </div>

       <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
           <div className="grid md:grid-cols-2 gap-4">
               <button onClick={() => setPhase('JOIN')} className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex flex-col items-center gap-2 transition-all">
                   <UserPlus size={32} className="text-blue-500"/>
                   <span className="font-bold text-gray-700 dark:text-gray-300">Join Existing Room</span>
               </button>
               <div className="text-center text-gray-400 font-bold flex items-center justify-center">- OR -</div>
           </div>

           <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
               <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><Zap size={18}/> Create Custom Room</h3>
               
               <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label>
                   <select 
                     value={config.subject} 
                     onChange={e => setConfig({...config, subject: e.target.value})}
                     className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600"
                   >
                       {Object.keys(SYLLABUS_DB).map(s => <option key={s} value={s}>{s.split('(')[0]}</option>)}
                   </select>
               </div>

               <div className="grid grid-cols-3 gap-3">
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mode</label>
                       <select value={config.mode} onChange={e => setConfig({...config, mode: e.target.value as any})} className="w-full p-3 rounded-xl border dark:bg-gray-700">
                           <option value="1v1">1 vs 1</option>
                           <option value="2v2">2 vs 2</option>
                           <option value="FFA">Free for All</option>
                       </select>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Questions</label>
                       <select value={config.questionCount} onChange={e => setConfig({...config, questionCount: Number(e.target.value)})} className="w-full p-3 rounded-xl border dark:bg-gray-700">
                           <option value="5">5</option>
                           <option value="10">10</option>
                           <option value="15">15</option>
                       </select>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Time (Sec)</label>
                       <select value={config.timePerQuestion} onChange={e => setConfig({...config, timePerQuestion: Number(e.target.value)})} className="w-full p-3 rounded-xl border dark:bg-gray-700">
                           <option value="10">10s</option>
                           <option value="15">15s</option>
                           <option value="20">20s</option>
                           <option value="30">30s</option>
                       </select>
                   </div>
               </div>

               <button 
                 onClick={handleCreateRoom}
                 disabled={loading}
                 className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-green-700 shadow-lg flex items-center justify-center gap-2"
               >
                 {loading ? <Loader2 className="animate-spin"/> : 'Create Room'}
               </button>
           </div>
       </div>
    </div>
  );

  const renderJoin = () => (
      <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in-95">
          <div className="w-full max-w-sm space-y-4">
              <button onClick={() => setPhase('SETUP')} className="text-gray-500 font-bold mb-4">← Back</button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Enter Code</h2>
              <input 
                type="text" 
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                className="w-full p-4 text-center text-3xl font-mono tracking-widest rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none dark:bg-gray-800 dark:text-white"
                placeholder="123456"
                maxLength={6}
              />
              {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
              <button onClick={handleJoinRoom} disabled={loading || roomId.length < 6} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex justify-center">
                  {loading ? <Loader2 className="animate-spin"/> : 'Join Room'}
              </button>
          </div>
      </div>
  );

  const renderLobby = () => {
      if (!battleState) return <div className="text-center p-10"><Loader2 className="animate-spin mx-auto"/></div>;
      const isHost = battleState.hostId === currentUser?.uid;
      const playerCount = battleState.players.length;
      const maxPlayers = battleState.config.mode === '1v1' ? 2 : battleState.config.mode === '2v2' ? 4 : 5;

      return (
          <div className="max-w-3xl mx-auto p-6 space-y-8 animate-in fade-in">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Room Code</p>
                      <h1 className="text-4xl font-mono font-bold text-primary dark:text-green-400">{roomId}</h1>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(roomId)} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200"><Copy/></button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {battleState.players.map((p, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center shadow-sm">
                          <img src={p.avatar} className="w-16 h-16 rounded-full mb-3 bg-gray-100"/>
                          <p className="font-bold text-gray-800 dark:text-white">{p.name}</p>
                          {p.team !== 'NONE' && <span className={`text-xs px-2 py-0.5 rounded font-bold mt-1 ${p.team === 'A' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>Team {p.team}</span>}
                      </div>
                  ))}
                  {[...Array(maxPlayers - playerCount)].map((_, i) => (
                      <div key={i} className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center justify-center p-4">
                          <span className="text-gray-400 font-bold text-sm">Waiting...</span>
                      </div>
                  ))}
              </div>

              <div className="text-center">
                  {isHost ? (
                      <button 
                        onClick={handleStartGame}
                        disabled={playerCount < 2}
                        className="px-10 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-green-700 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center gap-2 mx-auto"
                      >
                          <Play fill="currentColor"/> Start Game
                      </button>
                  ) : (
                      <p className="text-gray-500 animate-pulse font-medium">Waiting for host to start...</p>
                  )}
              </div>
          </div>
      );
  };

  const renderGame = () => {
      if (!battleState || !battleState.questions) return null;
      const q = battleState.questions[currentQIndex];
      
      // Sort players by score
      const sortedPlayers = [...battleState.players].sort((a, b) => b.score - a.score);

      return (
          <div className="h-full flex flex-col p-4 md:p-8 max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                      <Clock size={20} className="text-orange-500"/>
                      <span className="text-2xl font-bold font-mono text-gray-800 dark:text-white">{timeLeft}s</span>
                  </div>
                  <div className="text-sm font-bold text-gray-500">Q {currentQIndex + 1} / {battleState.config.questionCount}</div>
              </div>

              <div className="grid md:grid-cols-4 gap-6 flex-1">
                  {/* Question Area */}
                  <div className="md:col-span-3 space-y-6">
                      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                          <div className="absolute top-0 left-0 h-1.5 bg-orange-500 transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / battleState.config.timePerQuestion) * 100}%` }}></div>
                          <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white leading-relaxed">{q.question}</h2>
                      </div>

                      <div className="grid gap-3">
                          {q.options.map((opt: string, idx: number) => (
                              <button 
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                disabled={hasAnswered}
                                className={`w-full p-4 rounded-xl border text-left font-medium transition-all ${hasAnswered ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'bg-white hover:bg-blue-50 hover:border-blue-500 dark:bg-gray-800 dark:hover:bg-gray-700'}`}
                              >
                                  <div className="flex items-center gap-3">
                                      <span className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-sm bg-gray-100 dark:bg-gray-700">{['A','B','C','D'][idx]}</span>
                                      <span className="text-gray-700 dark:text-gray-200">{opt}</span>
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Sidebar Leaderboard */}
                  <div className="md:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 h-fit">
                      <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2"><Trophy size={14}/> Live Rank</h3>
                      <div className="space-y-3">
                          {sortedPlayers.map((p, idx) => (
                              <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg ${p.uid === currentUser?.uid ? 'bg-yellow-50 border border-yellow-200' : ''}`}>
                                  <span className="font-bold text-gray-400 text-xs w-4">{idx + 1}</span>
                                  <img src={p.avatar} className="w-8 h-8 rounded-full bg-gray-200"/>
                                  <div className="flex-1 overflow-hidden">
                                      <p className="text-xs font-bold truncate dark:text-white">{p.name}</p>
                                      <p className="text-[10px] font-mono text-primary font-bold">{p.score} pts</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderResult = () => {
      if (!battleState) return null;
      const sorted = [...battleState.players].sort((a, b) => b.score - a.score);
      const winner = sorted[0];
      const isWinner = winner.uid === currentUser?.uid;

      return (
          <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in-95 text-center">
              <div className="relative mb-8">
                  <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 rounded-full"></div>
                  <img src={winner.avatar} className="w-32 h-32 rounded-full border-4 border-yellow-400 shadow-2xl relative z-10"/>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full font-bold text-sm shadow-lg z-20 flex items-center gap-1">
                      <Trophy size={14} fill="currentColor"/> WINNER
                  </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{winner.name}</h2>
              <p className="text-gray-500 mb-8 font-mono font-bold text-xl">{winner.score} Points</p>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 w-full max-w-md">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 text-left">Leaderboard</h3>
                  {sorted.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3 border-b last:border-0 border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-400 w-4">{idx + 1}</span>
                              <span className={`font-medium ${p.uid === currentUser?.uid ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>{p.name}</span>
                          </div>
                          <span className="font-mono font-bold text-gray-800 dark:text-white">{p.score}</span>
                      </div>
                  ))}
              </div>

              <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all">Back to Menu</button>
          </div>
      );
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto transition-colors">
      {phase === 'SETUP' && renderSetup()}
      {phase === 'JOIN' && renderJoin()}
      {phase === 'LOBBY' && renderLobby()}
      {phase === 'GAME' && renderGame()}
      {phase === 'RESULT' && renderResult()}
    </div>
  );
};

export default QuizBattlePrototype;
