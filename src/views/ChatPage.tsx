'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatContainer } from '../components/chat/ChatContainer';
import { Bot, Sparkles } from 'lucide-react';

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  return <ChatContainer initialQuery={initialQuery} />;
}

export const ChatPage: React.FC = () => {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Conversational Decision Support</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Ask WeatherGPT
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Ask about real-time weather, numerical forecasts, flood hazards, cyclone alerts, and agricultural guidelines.
        </p>
      </div>

      <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-400 text-xs">Loading assistant...</div>}>
        <ChatContent />
      </Suspense>
    </div>
  );
};

