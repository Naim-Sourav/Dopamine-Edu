
import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { Check, X, Search, Trash2, Calendar, User, Phone, CreditCard, ShieldCheck, Filter, Users, DollarSign, Bell, Send, BarChart3, TrendingUp, AlertCircle, Database, ChevronLeft, ChevronRight, Layers, BookOpen, Activity, FileText } from 'lucide-react';
import AdminQuestionGenerator from './AdminQuestionGenerator';
import { fetchQuestionsFromBankAPI, deleteQuestionFromBankAPI } from '../services/api';
import { SYLLABUS_DB } from '../services/syllabusData';
import { useToast } from './Toast';

const AdminPage: React.FC = () => {
  const { paymentRequests, stats, approvePayment, rejectPayment, deletePaymentRequest, sendNotification, refreshRequests } = useAdmin();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PAYMENTS' | 'NOTIFICATIONS' | 'Q_BANK' | 'DATABASE'>('DASHBOARD');
  const { showToast } = useToast();
  
  // Payment Filters
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Notification Form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifType, setNotifType] = useState<'INFO' | 'SUCCESS' | 'WARNING'>('INFO');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Question Viewer State
  const [questions, setQuestions] = useState<any[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [qPage, setQPage] = useState(1);
  const [qSubject, setQSubject] = useState('');
  const [qChapter, setQChapter] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
      // Auto refresh on mount
      refreshRequests();
  }, []);

  // Load Questions for Viewer
  useEffect(() => {
    if (activeTab === 'DATABASE') {
        loadQuestions();
    }
  }, [activeTab, qPage, qSubject, qChapter]);

  const loadQuestions = async () => {
      setLoadingQuestions(true);
      try {
          const data = await fetchQuestionsFromBankAPI(qPage, 10, qSubject, qChapter);
          setQuestions(data.questions);
          setTotalQuestions(data.total);
      } catch (error) {
          console.error(error);
      } finally {
          setLoadingQuestions(false);
      }
  };

  const handleDeleteQuestion = async (id: string) => {
      if(!confirm("Are you sure you want to delete this question?")) return;
      try {
          await deleteQuestionFromBankAPI(id);
          setQuestions(prev => prev.filter(q => q._id !== id));
          showToast("Question deleted", "success");
      } catch (e) {
          showToast("Failed to delete", "error");
      }
  };

  const filteredRequests = paymentRequests.filter(req => {
    const matchesFilter = filter === 'ALL' || req.status === filter;
    
    const userName = req.userName || '';
    const trxId = req.trxId || '';
    const senderNumber = req.senderNumber || '';
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = 
      userName.toLowerCase().includes(searchLower) ||
      trxId.toLowerCase().includes(searchLower) ||
      senderNumber.toLowerCase().includes(searchLower);
      
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMsg) return;

    setSendingNotif(true);
    try {
      await sendNotification(notifTitle, notifMsg, notifType);
      setNotifTitle('');
      setNotifMsg('');
      showToast("নোটিফিকেশন সফলভাবে পাঠানো হয়েছে!", "success");
    } catch (e) {
      showToast("নোটিফিকেশন পাঠাতে সমস্যা হয়েছে", "error");
    } finally {
      setSendingNotif(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিত এই এন্ট্রিটি ডিলেট করতে চান? এটি আর ফিরিয়ে আনা যাবে না।")) {
      await deletePaymentRequest(id);
      showToast("Deleted successfully", "info");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        
        {/* Header & Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
           <div className="p-6 pb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <ShieldCheck size={28} className="text-primary dark:text-green-400" /> অ্যাডমিন প্যানেল
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">সিস্টেম ওভারভিউ ও ম্যানেজমেন্ট</p>
               </div>
               
               <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl overflow-x-auto max-w-full">
                   <button onClick={() => setActiveTab('DASHBOARD')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'DASHBOARD' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      <BarChart3 size={16} /> ড্যাশবোর্ড
                   </button>
                   <button onClick={() => setActiveTab('PAYMENTS')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'PAYMENTS' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      <DollarSign size={16} /> পেমেন্টস
                   </button>
                   <button onClick={() => setActiveTab('Q_BANK')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'Q_BANK' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      <Database size={16} /> Generator
                   </button>
                   <button onClick={() => setActiveTab('DATABASE')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'DATABASE' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      <Layers size={16} /> Viewer
                   </button>
                   <button onClick={() => setActiveTab('NOTIFICATIONS')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'NOTIFICATIONS' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      <Bell size={16} /> নোটিফিকেশন
                   </button>
               </div>
           </div>
           
           {/* Tab Content Divider */}
           <div className="h-6"></div>
        </div>

        {/* --- TAB: DASHBOARD --- */}
        {activeTab === 'DASHBOARD' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Users size={64}/></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">মোট ইউজার</p>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.activeUsers}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-500 font-bold"><TrendingUp size={12}/> Registered</div>
                 </div>

                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign size={64}/></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">মোট আয়</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">৳{stats.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-2">Verified Revenue</p>
                 </div>

                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><FileText size={64}/></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">মোট এক্সাম</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalExams}</p>
                    <p className="text-xs text-gray-400 mt-2">Quizzes Taken</p>
                 </div>

                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><AlertCircle size={64}/></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">পেন্ডিং রিকোয়েস্ট</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingRequests}</p>
                    <p className="text-xs text-yellow-600/70 mt-2 font-medium">Action Required</p>
                 </div>
              </div>

              {/* System Stats & Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Activity size={20} className="text-primary"/> সিস্টেম স্ট্যাটাস
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Question Bank</p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.totalQuestions}</p>
                            <p className="text-xs text-purple-600/70 mt-1">Total Questions</p>
                        </div>
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Enrollments</p>
                            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.totalEnrollments}</p>
                            <p className="text-xs text-orange-600/70 mt-1">Active Students</p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-gray-600 dark:text-gray-300">Server Status</span>
                            <span className="font-bold text-green-500">Operational</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full w-full animate-pulse"></div>
                        </div>
                    </div>
                 </div>
                 
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">রিসেন্ট পেমেন্টস</h3>
                    <div className="space-y-3">
                       {paymentRequests.length === 0 ? <p className="text-gray-400 text-sm">কোনো পেমেন্ট নেই</p> : paymentRequests.slice(0, 4).map(req => (
                          <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                             <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${req.status === 'APPROVED' ? 'bg-green-100 text-green-600' : req.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                   {req.status[0]}
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-gray-800 dark:text-white line-clamp-1">{req.userName || 'Unknown'}</p>
                                   <p className="text-[10px] text-gray-500">{req.courseTitle}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">৳{req.amount}</p>
                                <span className="text-[10px] font-mono text-gray-400">{new Date(req.timestamp).toLocaleDateString()}</span>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* --- TAB: PAYMENTS --- */}
        {activeTab === 'PAYMENTS' && (
           <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               {/* Controls */}
               <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50 dark:bg-gray-900/50">
                   <div className="relative">
                       <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                       <input 
                         type="text" 
                         placeholder="অনুসন্ধান করুন..." 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:text-white text-sm"
                       />
                   </div>
                   <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
                       {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
                         <button
                           key={f}
                           onClick={() => setFilter(f)}
                           className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter === f ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                         >
                           {f === 'ALL' ? 'সব' : f}
                         </button>
                       ))}
                   </div>
               </div>

               {/* Table */}
               <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                       <tr>
                         <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ব্যবহারকারী</th>
                         <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">কোর্স</th>
                         <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">পেমেন্ট তথ্য</th>
                         <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">স্ট্যাটাস</th>
                         <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">অ্যাকশন</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                       {filteredRequests.length === 0 ? (
                           <tr>
                               <td colSpan={5} className="p-12 text-center text-gray-500">কোনো তথ্য পাওয়া যায়নি</td>
                           </tr>
                       ) : filteredRequests.map((req) => (
                         <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                           <td className="p-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                                    <User size={20} />
                                 </div>
                                 <div>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{req.userName || 'Unknown'}</p>
                                    <p className="text-xs text-gray-500">{req.userEmail || 'No Email'}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="p-4">
                              <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{req.courseTitle}</p>
                              <p className="text-xs text-primary dark:text-green-400 font-bold">৳{req.amount}</p>
                           </td>
                           <td className="p-4">
                              <div className="space-y-1">
                                 <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                    <CreditCard size={14} className="text-gray-400"/> 
                                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{req.trxId}</span>
                                 </div>
                                 <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                    <Phone size={14} className="text-gray-400"/> 
                                    <span className="font-mono">{req.senderNumber}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(req.status)}`}>
                                 {req.status}
                              </span>
                           </td>
                           <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                {req.status === 'PENDING' && (
                                   <>
                                    <button onClick={() => approvePayment(req.id)} className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 rounded-lg transition-colors" title="Approve">
                                       <Check size={18} />
                                    </button>
                                    <button onClick={() => rejectPayment(req.id)} className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 hover:bg-yellow-200 rounded-lg transition-colors" title="Reject">
                                       <X size={18} />
                                    </button>
                                   </>
                                )}
                                <button onClick={() => handleDelete(req.id)} className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors" title="Delete">
                                   <Trash2 size={18} />
                                </button>
                              </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
               </div>
           </div>
        )}

        {/* --- TAB: QUESTION BANK GENERATOR --- */}
        {activeTab === 'Q_BANK' && (
           <AdminQuestionGenerator />
        )}

        {/* --- TAB: DATABASE VIEWER --- */}
        {activeTab === 'DATABASE' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-in fade-in">
                {/* Filters */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2 w-full md:w-auto">
                        <select 
                            value={qSubject} 
                            onChange={e => { setQSubject(e.target.value); setQChapter(''); setQPage(1); }}
                            className="p-2 rounded-lg border text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
                        >
                            <option value="">সকল বিষয়</option>
                            {Object.keys(SYLLABUS_DB).map(s => <option key={s} value={s}>{s.split('(')[0]}</option>)}
                        </select>
                        <select 
                            value={qChapter} 
                            onChange={e => { setQChapter(e.target.value); setQPage(1); }}
                            disabled={!qSubject}
                            className="p-2 rounded-lg border text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
                        >
                            <option value="">সকল অধ্যায়</option>
                            {qSubject && Object.keys(SYLLABUS_DB[qSubject] || {}).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="text-sm text-gray-500">
                        Total Questions: {totalQuestions}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loadingQuestions ? (
                        <div className="p-12 text-center text-gray-500">Loading questions...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700">
                                <tr>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Question</th>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Subject/Topic</th>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Details</th>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {questions.map(q => (
                                    <tr key={q._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-3 w-1/2">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{q.question}</p>
                                            <div className="flex gap-2 mt-1">
                                                {q.options.map((o: string, idx: number) => (
                                                    <span key={idx} className={`text-[10px] px-1.5 py-0.5 rounded ${idx === q.correctAnswerIndex ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {o}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm">
                                            <div className="font-bold text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded inline-block mb-1">{q.subject?.split('(')[0]}</div>
                                            <div className="text-gray-500 text-xs">{q.chapter}</div>
                                            <div className="text-gray-400 text-xs italic">{q.topic}</div>
                                        </td>
                                        <td className="p-3 text-xs">
                                            <span className="block mb-1 font-bold text-orange-500">{q.difficulty || 'MEDIUM'}</span>
                                            <span className="text-gray-400">{new Date(q.createdAt).toLocaleDateString()}</span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => handleDeleteQuestion(q._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                    <button 
                        disabled={qPage === 1} 
                        onClick={() => setQPage(p => p - 1)}
                        className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="px-3 py-2 text-sm font-bold">{qPage}</span>
                    <button 
                        disabled={questions.length < 10} 
                        onClick={() => setQPage(p => p + 1)}
                        className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        )}

        {/* --- TAB: NOTIFICATIONS --- */}
        {activeTab === 'NOTIFICATIONS' && (
           <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-10 animate-in fade-in slide-in-from-bottom-2">
               <div className="max-w-2xl mx-auto">
                   <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                         <Send size={32} />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">গ্লোবাল নোটিফিকেশন</h2>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">সকল ইউজারদের কাছে গুরুত্বপূর্ণ বার্তা বা ঘোষণা পাঠান।</p>
                   </div>

                   <form onSubmit={handleSendNotification} className="space-y-6">
                      <div>
                         <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">শিরোনাম (Title)</label>
                         <input 
                           required
                           type="text" 
                           value={notifTitle}
                           onChange={e => setNotifTitle(e.target.value)}
                           className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                           placeholder="যেমন: নতুন কুইজ আপলোড হয়েছে!"
                         />
                      </div>
                      
                      <div>
                         <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">বার্তা (Message)</label>
                         <textarea 
                           required
                           rows={4}
                           value={notifMsg}
                           onChange={e => setNotifMsg(e.target.value)}
                           className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                           placeholder="বিস্তারিত লিখুন..."
                         />
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">নোটিফিকেশন টাইপ</label>
                         <div className="flex gap-4">
                            {(['INFO', 'SUCCESS', 'WARNING'] as const).map(type => (
                               <button 
                                 key={type}
                                 type="button"
                                 onClick={() => setNotifType(type)}
                                 className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${notifType === type ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                               >
                                  {type}
                               </button>
                            ))}
                         </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={sendingNotif}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                      >
                         {sendingNotif ? 'পাঠানো হচ্ছে...' : 'সেন্ড করুন'} <Send size={20} />
                      </button>
                   </form>
               </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default AdminPage;
