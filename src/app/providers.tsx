'use client';

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { WeatherProvider } from '../context/WeatherContext';
import { VoiceProvider } from '../context/VoiceContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <WeatherProvider>
          <VoiceProvider>{children}</VoiceProvider>
        </WeatherProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
