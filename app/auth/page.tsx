'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else window.location.href = '/';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="p-8 bg-slate-800 rounded-2xl w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-6">Login to Tend Brain AI</h1>
        <input className="w-full p-3 mb-4 rounded bg-slate-700 text-white" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full p-3 mb-6 rounded bg-slate-700 text-white" type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
        <button onClick={signIn} className="w-full p-3 bg-indigo-500 rounded text-white font-bold">Sign In</button>
      </div>
    </div>
  );
}
