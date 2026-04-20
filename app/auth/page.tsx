'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { Bot, Mail, Lock, LogIn, UserPlus, Zap } from 'lucide-react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'magiclink'>('signin');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Handle Magic Link sign-in callback
    const handleMagicLink = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let emailForSignIn = window.localStorage.getItem('emailForSignIn');
        if (!emailForSignIn) {
          emailForSignIn = window.prompt('Please provide your email for confirmation');
        }
        
        if (emailForSignIn) {
          setLoading(true);
          try {
            await signInWithEmailLink(auth, emailForSignIn, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            window.location.href = '/';
          } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
            setLoading(false);
          }
        }
      }
    };
    
    handleMagicLink();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = '/';
      } else if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        window.location.href = '/';
      } else if (mode === 'magiclink') {
        const actionCodeSettings = {
          url: window.location.origin + '/auth',
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        setMessage({ type: 'success', text: 'Magic link sent! Check your email to finish signing in.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      window.location.href = '/';
    } catch (error: any) {
      alert('Google Auth Error: ' + error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center mb-4">
            <Bot size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight text-center">Tend Brain AI</h1>
          <p className="text-slate-400 mt-2 text-center text-sm">Your AI-powered social media autopilot.</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-xl">
          <div className="flex bg-slate-900 p-1 rounded-lg mb-6 border border-slate-700 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setMode('signin')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                mode === 'signin' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn size={15} /> Sign In
            </button>
            <button 
              onClick={() => setMode('signup')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                mode === 'signup' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus size={15} /> Sign Up
            </button>
            <button 
              onClick={() => setMode('magiclink')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                mode === 'magiclink' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap size={15} /> Magic
            </button>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
              message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                required
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
            
            {mode !== 'magiclink' && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  required
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            )}
            
            <button 
              disabled={loading}
              type="submit"
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white font-bold rounded-xl transition-colors shadow-lg active:scale-[0.98]"
            >
              {loading ? 'Processing...' : mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Send Link'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-500 font-medium tracking-wider">Or continue with</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
