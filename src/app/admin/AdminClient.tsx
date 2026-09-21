'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const AdminControlCenter = dynamic(
  () => import('@/views/admin/AdminControlCenter').then((mod) => mod.AdminControlCenter),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 p-[2px] animate-pulse">
          <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
            <img src="/weathergpt-logo.svg" alt="WeatherGPT" className="w-7 h-7 animate-spin-slow" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-white font-sans">Initializing WeatherGPT Operations Grid...</p>
          <p className="text-xs text-slate-400">Loading IMD Doppler Telemetry & Control Center</p>
        </div>
      </div>
    ),
  }
);

export function AdminClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center text-slate-400 text-sm">
          Loading Admin Operations Grid...
        </div>
      }
    >
      <AdminControlCenter />
    </Suspense>
  );
}
