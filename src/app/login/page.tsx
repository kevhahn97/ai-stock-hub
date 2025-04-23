'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const supabase = createClient();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({ email, options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
    } });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Check your email for a login link.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-lg border border-neutral-100">
        <h1 className="text-2xl font-bold mb-6 text-neutral-900 text-center">Sign in to <span className="text-blue-600">AI Stock Hub</span></h1>
        <form className="flex flex-col gap-3" onSubmit={handleEmailSignIn}>
          <input
            name="email"
            type="email"
            placeholder="email@yourdomain.com"
            required
            className="border border-neutral-200 p-3 rounded-lg w-full text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-blue-700 transition-colors mt-2 shadow"
          >
            Sign in with Email
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-blue-700">{message}</p>}
      </div>
    </main>
  );
} 