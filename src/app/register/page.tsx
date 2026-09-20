import React, { Suspense } from 'react';
import { RegisterPage } from '../../views/RegisterPage';

export const metadata = {
  title: 'Register — WeatherGPT | MoES & IMD',
  description: 'Create an account to access real-time weather alerts and AI-driven forecasting.',
};

export default function RegisterRoute() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-slate-400">Loading...</div>}>
      <RegisterPage />
    </Suspense>
  );
}
