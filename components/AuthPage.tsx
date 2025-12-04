
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Mail, Lock, User, Loader2, LogIn, ArrowRight, Sparkles } from 'lucide-react';

interface AuthPageProps {
  onBack: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name,
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' // Default avatar
        });
      }
      // Auth listener in App.tsx will handle redirection
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট খোলা আছে।');
      } else if (err.code === 'auth/weak-password') {
        setError('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।');
      } else {
        setError('কোথাও কোনো সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900 transition-colors">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-emerald-800 opacity-90"></div>
        
        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-xl">
             <span className="text-3xl font-bold">শি</span>
          </div>
          <h1 className="text-5xl font-bold mb-6">আপনার লার্নিং জার্নি শুরু হোক এখান থেকেই</h1>
          <p className="text-lg text-green-100 leading-relaxed mb-8">
            AI টিউটর, স্মার্ট কুইজ এবং পার্সোনালাইজড সাপোর্টের মাধ্যমে নিজেকে প্রস্তুত করুন সেরা ফলাফলের জন্য।
          </p>
          <div className="flex gap-4">
             <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                <span className="font-bold text-2xl">১০,০০০+</span>
                <p className="text-sm text-green-100">শিক্ষার্থী</p>
             </div>
             <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                <span className="font-bold text-2xl">৫০,০০০+</span>
                <p className="text-sm text-green-100">কুইজ টেস্ট</p>
             </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
           <div className="text-center lg:text-left">
              <button onClick={onBack} className="text-sm text-gray-500 hover:text-primary mb-6 flex items-center justify-center lg:justify-start gap-1">
                 ← ফিরে যান
              </button>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isLogin ? 'স্বাগতম!' : 'একাউন্ট তৈরি করুন'}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {isLogin ? 'আপনার একাউন্টে লগইন করুন' : 'বিনামূল্যে রেজিস্ট্রেশন করুন'}
              </p>
           </div>

           {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-5">
             {!isLogin && (
               <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">আপনার নাম</label>
                  <div className="relative group">
                    <User size={20} className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white transition-all"
                      placeholder="পুরো নাম লিখুন"
                    />
                  </div>
               </div>
             )}

             <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ইমেইল এড্রেস</label>
                <div className="relative group">
                  <Mail size={20} className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white transition-all"
                    placeholder="name@example.com"
                  />
                </div>
             </div>

             <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">পাসওয়ার্ড</label>
                <div className="relative group">
                  <Lock size={20} className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white transition-all"
                    placeholder="••••••••"
                  />
                </div>
             </div>

             <button
               type="submit"
               disabled={loading}
               className="w-full bg-primary hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 active:scale-95"
             >
               {loading ? (
                 <Loader2 size={24} className="animate-spin" />
               ) : (
                 <>
                   {isLogin ? 'লগইন' : 'রেজিস্ট্রেশন'} <ArrowRight size={20} />
                 </>
               )}
             </button>
           </form>

           <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">অথবা</span>
              </div>
           </div>

           <div className="text-center">
             <p className="text-gray-600 dark:text-gray-400">
               {isLogin ? 'একাউন্ট নেই?' : 'আগেই একাউন্ট খুলেছেন?'}
               <button
                 onClick={() => setIsLogin(!isLogin)}
                 className="ml-2 font-bold text-primary hover:underline"
               >
                 {isLogin ? 'নতুন একাউন্ট খুলুন' : 'লগইন করুন'}
               </button>
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
