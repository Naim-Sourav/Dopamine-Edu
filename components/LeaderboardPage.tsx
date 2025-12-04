import React, { useState, useEffect } from 'react';
import { fetchLeaderboardAPI } from '../services/api';
import { LeaderboardUser } from '../types';
import { Trophy, Medal, Crown, Shield, Star, Award, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LEAGUES = [
  { id: 'BRONZE', name: 'Bronze League', min: 0, max: 499, color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300', icon: Shield },
  { id: 'SILVER', name: 'Silver League', min: 500, max: 999, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-300', icon: Shield },
  { id: 'GOLD', name: 'Gold League', min: 1000, max: 2499, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-400', icon: Star },
  { id: 'DIAMOND', name: 'Diamond League', min: 2500, max: 4999, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-300', icon: Award },
  { id: 'LEGEND', name: 'Legend League', min: 5000, max: Infinity, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-300', icon: Crown },
];

const LeaderboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLeagueId, setActiveLeagueId] = useState('BRONZE');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchLeaderboardAPI();
        setUsers(data);
        
        // Auto-select league based on user's points
        if (currentUser) {
           const myData = data.find(u => u.uid === currentUser.uid);
           if (myData) {
              const myLeague = LEAGUES.find(l => myData.points >= l.min && myData.points <= l.max);
              if (myLeague) setActiveLeagueId(myLeague.id);
           }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  const activeLeague = LEAGUES.find(l => l.id === activeLeagueId)!;
  
  const filteredUsers = users.filter(u => u.points >= activeLeague.min && u.points <= activeLeague.max);
  const top3 = filteredUsers.slice(0, 3);
  const others = filteredUsers.slice(3);

  const getRankBadge = (idx: number) => {
    if (idx === 0) return <Trophy className="text-yellow-500" size={24} fill="currentColor" />;
    if (idx === 1) return <Medal className="text-slate-400" size={24} fill="currentColor" />;
    if (idx === 2) return <Medal className="text-amber-700" size={24} fill="currentColor" />;
    return <span className="font-bold text-gray-500 w-6 text-center">{idx + 1}</span>;
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors p-4 md:p-8">
      <div className="max-w-4xl mx-auto pb-20">
        
        {/* Header */}
        <div className="text-center mb-8">
           <div className="inline-flex p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4 shadow-sm">
              <Trophy size={40} className="text-yellow-600 dark:text-yellow-400" />
           </div>
           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">লিডারবোর্ড</h1>
           <p className="text-gray-500 dark:text-gray-400">সেরাদের তালিকায় আপনার অবস্থান দেখুন</p>
        </div>

        {/* League Tabs */}
        <div className="flex overflow-x-auto pb-4 gap-3 mb-6 no-scrollbar justify-start md:justify-center">
           {LEAGUES.map(league => {
             const Icon = league.icon;
             const isActive = activeLeagueId === league.id;
             return (
               <button
                 key={league.id}
                 onClick={() => setActiveLeagueId(league.id)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all border-2 ${isActive ? `${league.bg} ${league.color} ${league.border} shadow-sm` : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}`}
               >
                 <Icon size={16} fill={isActive ? "currentColor" : "none"} />
                 {league.name}
               </button>
             )
           })}
        </div>

        {/* League Banner */}
        <div className={`p-6 rounded-2xl mb-8 flex flex-col items-center text-center ${activeLeague.bg} border ${activeLeague.border}`}>
            <activeLeague.icon size={48} className={`${activeLeague.color} mb-2`} />
            <h2 className={`text-2xl font-bold ${activeLeague.color}`}>{activeLeague.name}</h2>
            <p className="text-sm font-medium opacity-70 mt-1 text-gray-700 dark:text-gray-700">Points Range: {activeLeague.min} - {activeLeague.max === Infinity ? '∞' : activeLeague.max}</p>
        </div>

        {loading ? (
           <div className="text-center py-20 text-gray-500">লোডিং...</div>
        ) : filteredUsers.length === 0 ? (
           <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
              <p>এই লীগে এখনো কেউ নেই। আপনিই হতে পারেন প্রথম!</p>
           </div>
        ) : (
           <>
             {/* Podium (Top 3) */}
             {top3.length > 0 && (
                <div className="flex justify-center items-end gap-4 mb-10 h-64">
                   {/* 2nd Place */}
                   {top3[1] && (
                      <div className="flex flex-col items-center animate-in slide-in-from-bottom-10 delay-100">
                         <div className="w-16 h-16 rounded-full border-4 border-slate-300 overflow-hidden mb-2 relative">
                            <img src={top3[1].photoURL} className="w-full h-full object-cover" alt={top3[1].displayName} />
                            <div className="absolute bottom-0 w-full bg-slate-500 text-white text-[10px] text-center font-bold">2nd</div>
                         </div>
                         <div className="text-center mb-2">
                            <p className="font-bold text-sm text-gray-800 dark:text-white truncate w-20">{top3[1].displayName.split(' ')[0]}</p>
                            <p className="text-xs text-slate-500 font-bold">{top3[1].points} pts</p>
                         </div>
                         <div className="w-20 h-32 bg-slate-200 dark:bg-slate-700 rounded-t-xl shadow-md border-t-4 border-slate-400"></div>
                      </div>
                   )}

                   {/* 1st Place */}
                   {top3[0] && (
                      <div className="flex flex-col items-center z-10 animate-in slide-in-from-bottom-10">
                         <div className="mb-2">
                            <Crown size={32} className="text-yellow-500 animate-bounce" fill="currentColor" />
                         </div>
                         <div className="w-20 h-20 rounded-full border-4 border-yellow-400 overflow-hidden mb-2 relative shadow-lg shadow-yellow-200 dark:shadow-none">
                            <img src={top3[0].photoURL} className="w-full h-full object-cover" alt={top3[0].displayName} />
                            <div className="absolute bottom-0 w-full bg-yellow-500 text-white text-[10px] text-center font-bold">1st</div>
                         </div>
                         <div className="text-center mb-2">
                            <p className="font-bold text-gray-800 dark:text-white truncate w-24">{top3[0].displayName.split(' ')[0]}</p>
                            <p className="text-xs text-yellow-600 font-bold">{top3[0].points} pts</p>
                         </div>
                         <div className="w-24 h-40 bg-yellow-100 dark:bg-yellow-900/40 rounded-t-xl shadow-lg border-t-4 border-yellow-400 flex items-center justify-center">
                            <Trophy size={32} className="text-yellow-500 opacity-50" />
                         </div>
                      </div>
                   )}

                   {/* 3rd Place */}
                   {top3[2] && (
                      <div className="flex flex-col items-center animate-in slide-in-from-bottom-10 delay-200">
                         <div className="w-16 h-16 rounded-full border-4 border-amber-600 overflow-hidden mb-2 relative">
                            <img src={top3[2].photoURL} className="w-full h-full object-cover" alt={top3[2].displayName} />
                            <div className="absolute bottom-0 w-full bg-amber-700 text-white text-[10px] text-center font-bold">3rd</div>
                         </div>
                         <div className="text-center mb-2">
                            <p className="font-bold text-sm text-gray-800 dark:text-white truncate w-20">{top3[2].displayName.split(' ')[0]}</p>
                            <p className="text-xs text-amber-700 font-bold">{top3[2].points} pts</p>
                         </div>
                         <div className="w-20 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-t-xl shadow-md border-t-4 border-amber-600"></div>
                      </div>
                   )}
                </div>
             )}

             {/* Ranking List */}
             <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {others.length > 0 ? (
                   others.map((u, idx) => (
                      <div key={u.uid} className={`flex items-center p-4 border-b border-gray-100 dark:border-gray-700 last:border-none ${currentUser?.uid === u.uid ? 'bg-primary/5' : ''}`}>
                         <div className="w-8 font-bold text-gray-400 text-center mr-4">
                            {idx + 4}
                         </div>
                         <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-4 border border-gray-200 dark:border-gray-600">
                            <img src={u.photoURL} alt="User" className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1">
                            <p className={`font-bold text-sm ${currentUser?.uid === u.uid ? 'text-primary dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>
                               {u.displayName}
                               {currentUser?.uid === u.uid && <span className="ml-2 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded">YOU</span>}
                            </p>
                         </div>
                         <div className="font-mono font-bold text-gray-600 dark:text-gray-400">
                            {u.points} pts
                         </div>
                      </div>
                   ))
                ) : top3.length > 0 ? (
                   <p className="text-center py-8 text-gray-400">আর কেউ নেই</p>
                ) : null}
             </div>
           </>
        )}

      </div>
    </div>
  );
};

export default LeaderboardPage;