'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/Button';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 p-[2px] animate-pulse">
            <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
              <img src="/weathergpt-logo.svg" alt="WeatherGPT" className="w-7 h-7 animate-spin-slow" />
            </div>
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-white font-sans">Verifying Meteorological Authorization...</p>
          <p className="text-xs text-slate-400">MoES & IMD Secure Session Gate</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Admin role check
  const isAdmin = Boolean(role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'super_admin'));
  if (requiredRole === 'admin' && !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-navy-900 border border-red-500/30 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Administrative Authorization Required</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your authenticated account (<strong className="text-slate-100">{user?.email}</strong>) has the standard <span className="text-sky-400 font-mono font-bold uppercase">user</span> role. Access to the Meteorological Operations Center is restricted to MoES/IMD system administrators.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="w-full" icon={<ArrowLeft className="w-4 h-4" />}>
                Return to Citizen Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
