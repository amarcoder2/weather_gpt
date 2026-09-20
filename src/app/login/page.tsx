import React, { Suspense } from 'react';
import { LoginPage } from '../../views/LoginPage';

export const metadata = {
  title: 'Sign In — WeatherGPT | MoES & IMD',
  description: 'Sign in to access real-time meteorological intelligence and disaster advisories.',
};

export default function LoginRoute() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-slate-400">Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
