'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useVoice } from '../../context/VoiceContext';
import { useLanguage } from '../../context/LanguageContext';

export const VoiceModal: React.FC = () => {
  const {
    isModalOpen,
    closeVoiceModal,
    isListening,
    isProcessing,
    transcript,
    interimTranscript,
    error: voiceError,
    activeLanguage,
    startListening,
    stopListening,
    clearError,
  } = useVoice();
  const { t } = useLanguage();
  const router = useRouter();

  const handleSendToChat = () => {
    closeVoiceModal();
    const cleanQuery = (transcript || interimTranscript).replace(/[“”"]/g, '').trim();
    if (cleanQuery) {
      router.push(`/chat?q=${encodeURIComponent(cleanQuery)}`);
    }
  };

  const handleStartAgain = () => {
    clearError();
    startListening();
  };

  const displayTranscript = transcript || interimTranscript;

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeVoiceModal}
      title={t('voice.title', 'WeatherGPT Voice Assistant')}
      maxWidth="md"
    >
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
        <div className="space-y-2 max-w-sm w-full">
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs font-mono font-medium text-sky-400 uppercase tracking-wider">
              {isListening
                ? `● ${t('voice.listening', 'Listening...')}`
                : isProcessing
                ? `◌ ${t('voice.connecting', 'Converting speech to meteorological query...')}`
                : displayTranscript
                ? t('voice.captured', 'Speech Captured')
                : t('voice.prompt', 'Press Speak to begin asking your question.')}
            </p>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {activeLanguage}
            </span>
          </div>

          <div className="min-h-[50px] p-3 rounded-xl bg-navy-950/80 border border-slate-800 flex items-center justify-center">
            <p className="text-sm font-medium text-slate-200 italic">
              {displayTranscript || t('voice.prompt', 'Press Speak to begin asking your question.')}
            </p>
          </div>

          {voiceError && (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-xs text-red-300 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{voiceError}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 pt-2">
          {isListening ? (
            <Button variant="danger" size="sm" onClick={stopListening} icon={<MicOff className="w-4 h-4" />}>
              {t('voice.stop', 'Stop Listening')}
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={handleStartAgain} icon={<Mic className="w-4 h-4" />}>
              {displayTranscript ? t('voice.speakAgain', 'Speak Again') : t('voice.prompt', 'Start Speaking')}
            </Button>
          )}

          {displayTranscript && !isListening && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendToChat}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {t('voice.ask', 'Ask WeatherGPT')}
            </Button>
          )}
        </div>

        <p className="text-[11px] text-slate-400">
          Native Web Speech Recognition · Privacy preserved client-side
        </p>
      </div>
    </Modal>
  );
};
