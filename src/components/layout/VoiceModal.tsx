'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Sparkles, Volume2, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useVoice } from '../../context/VoiceContext';

export const VoiceModal: React.FC = () => {
  const {
    isModalOpen,
    closeVoiceModal,
    isListening,
    isProcessing,
    transcript,
    startListening,
    stopListening,
  } = useVoice();
  const router = useRouter();

  const handleSendToChat = () => {
    closeVoiceModal();
    const cleanQuery = transcript.replace(/[“”"]/g, '');
    router.push(`/chat?q=${encodeURIComponent(cleanQuery || 'Will it rain heavily in Kolkata this evening?')}`);
  };

  return (
    <Modal isOpen={isModalOpen} onClose={closeVoiceModal} title="WeatherGPT Voice Assistant" maxWidth="md">
      <div className="flex flex-col items-center text-center py-4 space-y-6">
        {/* Animated Microphone Orb */}
        <div className="relative">
          {isListening && (
            <>
              <div className="absolute inset-[-12px] rounded-full bg-sky-500/20 animate-ping" />
              <div className="absolute inset-[-24px] rounded-full bg-indigo-500/10 animate-pulse" />
            </>
          )}

          <div
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? 'bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 text-white shadow-glow-cyan'
                : isProcessing
                ? 'bg-indigo-600 text-white animate-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {isListening ? (
              <Mic className="w-10 h-10 animate-bounce" />
            ) : isProcessing ? (
              <Sparkles className="w-10 h-10 animate-spin" />
            ) : (
              <MicOff className="w-10 h-10" />
            )}
          </div>
        </div>

        {/* Audio Waveform simulation bars */}
        {isListening && (
          <div className="flex items-center gap-1.5 h-8">
            <span className="w-1 h-3 bg-sky-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite]" />
            <span className="w-1 h-6 bg-sky-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
            <span className="w-1 h-8 bg-sky-300 rounded-full animate-[pulse_0.3s_ease-in-out_infinite]" />
            <span className="w-1 h-5 bg-sky-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite]" />
            <span className="w-1 h-7 bg-indigo-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite]" />
            <span className="w-1 h-4 bg-sky-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite]" />
          </div>
        )}

        {/* Status text */}
        <div className="space-y-2 max-w-sm">
          <p className="text-xs font-mono font-medium text-sky-400 uppercase tracking-wider">
            {isListening
              ? '● Listening...'
              : isProcessing
              ? '◌ Converting speech to meteorological query...'
              : 'Speech Captured'}
          </p>
          <div className="min-h-[50px] p-3 rounded-xl bg-navy-950/80 border border-slate-800 flex items-center justify-center">
            <p className="text-sm font-medium text-slate-200 italic">
              {transcript || 'Press Speak to begin asking your question.'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 pt-2">
          {isListening ? (
            <Button variant="danger" size="sm" onClick={stopListening} icon={<MicOff className="w-4 h-4" />}>
              Stop Listening
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={startListening} icon={<Mic className="w-4 h-4" />}>
              Speak Again
            </Button>
          )}

          {isProcessing && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendToChat}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Ask WeatherGPT
            </Button>
          )}
        </div>

        <p className="text-[11px] text-slate-400">
          Phase 1 Prototype: Multilingual voice recognition simulation (Supports Hindi, Bengali, Odia & English).
        </p>
      </div>
    </Modal>
  );
};
