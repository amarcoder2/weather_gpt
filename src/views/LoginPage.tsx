'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push(redirect);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoEmail = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('');
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 p-[2px] shadow-glow-cyan">
            <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
              <img src="/weathergpt-logo.svg" alt="WeatherGPT" className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign In to <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">WeatherGPT</span>
          </h1>
          <p className="text-xs text-slate-400">
            Ministry of Earth Sciences · India Meteorological Department (SIH 2026 #26068)
          </p>
        </div>

        {/* Login Card */}
        <Card variant="glass" className="p-6 sm:p-8 space-y-5 border-slate-700/80 bg-navy-900/90 shadow-2xl">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs text-red-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Official or Personal Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-11 pl-10 pr-4 bg-navy-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-11 bg-navy-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
              icon={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          {/* Evaluator Quick-Fill Email Helper */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 block font-semibold">
                Quick-Fill Account Email:
              </span>
              <span className="text-[10px] text-slate-500 font-mono">SIH Judging</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemoEmail('user@weathergpt.gov.in')}
                className="px-2.5 py-1.5 rounded-lg bg-navy-950 border border-slate-800 text-[11px] text-slate-300 hover:border-sky-500/50 hover:text-sky-300 transition-colors flex items-center justify-between"
                title="Fill citizen demo email"
              >
                <span>Citizen User</span>
                <span className="text-[9px] font-mono text-slate-500">user@</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemoEmail('admin@weathergpt.gov.in')}
                className="px-2.5 py-1.5 rounded-lg bg-navy-950 border border-slate-800 text-[11px] text-slate-300 hover:border-amber-500/50 hover:text-amber-300 transition-colors flex items-center justify-between"
                title="Fill IMD admin email"
              >
                <span>IMD Admin</span>
                <span className="text-[9px] font-mono text-amber-500">admin@</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Enter your environment-configured password (or run <code className="text-slate-400">npm run db:seed</code>).
            </p>
          </div>

          {/* Registration Redirect */}
          <div className="text-center pt-1 text-xs text-slate-400">
            Don’t have an account yet?{' '}
            <Link href="/register" className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-4">
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
