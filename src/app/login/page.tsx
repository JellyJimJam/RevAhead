'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'magic' | 'password'>('magic');
  const [passwordMode, setPasswordMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace('/');
      }
    });
  }, [router]);

  const handleMagicLink = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setMessage('Check your email for a magic sign-in link.');
    }

    setLoading(false);
  };

  const handlePasswordAuth = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (passwordMode === 'sign-in') {
      const signInResult = await supabase.auth.signInWithPassword({ email, password });
      if (signInResult.error) {
        setError(`Sign in failed: ${signInResult.error.message}`);
      } else {
        router.replace('/');
      }
      setLoading(false);
      return;
    }

    const signUpResult = await supabase.auth.signUp({ email, password });
    if (signUpResult.error) {
      const normalizedError = signUpResult.error.message.toLowerCase();
      if (
        normalizedError.includes('already registered') ||
        normalizedError.includes('already exists') ||
        normalizedError.includes('user already')
      ) {
        setError('Account already exists. Please sign in.');
      } else {
        setError(signUpResult.error.message);
      }
    } else {
      router.replace('/');
    }

    setLoading(false);
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">LarLik</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to securely store trips in your private account.</p>

        <div className="mt-4 flex rounded-lg border border-slate-300 p-1 text-sm">
          <button className={`flex-1 rounded-md px-3 py-2 ${mode === 'magic' ? 'bg-slate-900 text-white' : 'text-slate-700'}`} onClick={() => { setMode('magic'); setError(''); setMessage(''); }} type="button">Magic Link</button>
          <button className={`flex-1 rounded-md px-3 py-2 ${mode === 'password' ? 'bg-slate-900 text-white' : 'text-slate-700'}`} onClick={() => { setMode('password'); setPasswordMode('sign-in'); setError(''); setMessage(''); }} type="button">Email + Password</button>
        </div>

        <form onSubmit={mode === 'magic' ? handleMagicLink : handlePasswordAuth} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>

          {mode === 'password' && (
            <>
              <div className="flex rounded-lg border border-slate-300 p-1 text-sm">
                <button type="button" onClick={() => setPasswordMode('sign-in')} className={`flex-1 rounded-md px-3 py-2 ${passwordMode === 'sign-in' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}>
                  Sign in
                </button>
                <button type="button" onClick={() => setPasswordMode('sign-up')} className={`flex-1 rounded-md px-3 py-2 ${passwordMode === 'sign-up' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}>
                  Sign up
                </button>
              </div>

              <label className="block text-sm font-medium text-slate-700">Password
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              </label>
            </>
          )}

          <button disabled={loading} type="submit" className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-brand-500">
            {loading ? 'Please wait...' : mode === 'magic' ? 'Send magic link' : passwordMode === 'sign-in' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </section>
    </main>
  );
}
