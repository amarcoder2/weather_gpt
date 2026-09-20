'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VoiceContextType {
  isModalOpen: boolean;
  openVoiceModal: () => void;
  closeVoiceModal: () => void;
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetVoice: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');

  const openVoiceModal = () => {
    setIsModalOpen(true);
    startListening();
  };

  const closeVoiceModal = () => {
    setIsModalOpen(false);
    stopListening();
  };

  const startListening = () => {
    setIsListening(true);
    setIsProcessing(false);
    setTranscript('Listening for your meteorological query...');

    // Simulate speech-to-text recognition
    setTimeout(() => {
      setTranscript('“Will it rain heavily in Kolkata this evening?”');
      setIsListening(false);
      setIsProcessing(true);
    }, 3000);
  };

  const stopListening = () => {
    setIsListening(false);
    setIsProcessing(false);
  };

  const resetVoice = () => {
    setIsListening(false);
    setIsProcessing(false);
    setTranscript('');
  };

  return (
    <VoiceContext.Provider
      value={{
        isModalOpen,
        openVoiceModal,
        closeVoiceModal,
        isListening,
        isProcessing,
        transcript,
        startListening,
        stopListening,
        resetVoice,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = (): VoiceContextType => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};
