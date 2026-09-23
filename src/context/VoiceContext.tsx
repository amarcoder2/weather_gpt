'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { useLanguage } from './LanguageContext';

export interface StartListeningOptions {
  lang?: string;
  onFinalTranscript?: (text: string) => void;
}

export interface VoiceContextType {
  isModalOpen: boolean;
  openVoiceModal: () => void;
  closeVoiceModal: () => void;
  isListening: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  activeLanguage: string;
  startListening: (options?: StartListeningOptions) => void;
  stopListening: () => void;
  resetVoice: () => void;
  clearError: () => void;
}

// BCP 47 mapping for the 11 supported regional languages
export const VOICE_LANGUAGE_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  or: 'or-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
};

// Ambient Web Speech API interface definitions for strict TypeScript compliance
interface ISpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionResultList {
  length: number;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface ISpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: ISpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognitionInstance, ev: ISpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognitionInstance, ev: ISpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: ISpeechRecognitionInstance, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognitionInstance;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { language, t } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
  const onFinalCallbackRef = useRef<((text: string) => void) | null>(null);

  // Helper to fetch constructor safely on client
  const getRecognitionConstructor = useCallback((): ISpeechRecognitionConstructor | null => {
    if (typeof window === 'undefined') return null;
    const win = window as unknown as {
      SpeechRecognition?: ISpeechRecognitionConstructor;
      webkitSpeechRecognition?: ISpeechRecognitionConstructor;
    };
    return win.SpeechRecognition || win.webkitSpeechRecognition || null;
  }, []);

  // Client hydration check for browser support
  useEffect(() => {
    const Ctor = getRecognitionConstructor();
    setIsSupported(!!Ctor);
  }, [getRecognitionConstructor]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Safe ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsProcessing(false);
  }, []);

  const resetVoice = useCallback(() => {
    stopListening();
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, [stopListening]);

  const startListening = useCallback(
    (options?: StartListeningOptions) => {
      const Ctor = getRecognitionConstructor();
      if (!Ctor) {
        setIsSupported(false);
        setError(t('voice.unsupported', 'Voice input is not supported in this browser.'));
        return;
      }

      // If already active, stop before re-initializing
      if (recognitionRef.current) {
        stopListening();
      }

      clearError();
      setInterimTranscript('');
      onFinalCallbackRef.current = options?.onFinalTranscript || null;

      try {
        const recognition = new Ctor();
        recognitionRef.current = recognition;

        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        const targetLang = options?.lang || VOICE_LANGUAGE_MAP[language] || 'en-IN';
        recognition.lang = targetLang;

        recognition.onstart = () => {
          setIsListening(true);
          setIsProcessing(false);
          setError(null);
        };

        recognition.onresult = (event: ISpeechRecognitionEvent) => {
          let liveInterim = '';
          let liveFinal = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const text = result[0]?.transcript || '';
            if (result.isFinal) {
              liveFinal += text;
            } else {
              liveInterim += text;
            }
          }

          if (liveFinal) {
            const cleanFinal = liveFinal.trim();
            setTranscript((prev) => (prev ? `${prev} ${cleanFinal}` : cleanFinal));
            setInterimTranscript('');
            setIsProcessing(true);

            if (onFinalCallbackRef.current) {
              onFinalCallbackRef.current(cleanFinal);
            }
          } else if (liveInterim) {
            setInterimTranscript(liveInterim);
          }
        };

        recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
          const errCode = event.error;
          let userMessage = t('voice.genericError', 'Voice input could not be started. Please try again.');

          switch (errCode) {
            case 'not-allowed':
            case 'service-not-allowed':
              userMessage = t(
                'voice.micDenied',
                'Microphone permission was denied. Please allow microphone access in your browser settings.'
              );
              break;
            case 'no-speech':
              userMessage = t('voice.noSpeech', 'No speech was detected. Please try again.');
              break;
            case 'audio-capture':
              userMessage = t('voice.audioCapture', 'No microphone was detected on your device.');
              break;
            case 'network':
              userMessage = t(
                'voice.networkError',
                'Speech recognition could not connect. Please verify your internet connection.'
              );
              break;
            case 'language-not-supported':
              userMessage = t(
                'voice.langUnsupported',
                'Voice recognition is not supported for this language in your browser.'
              );
              break;
            default:
              userMessage = t('voice.genericError', 'Voice input could not be started. Please try again.');
          }

          setError(userMessage);
          setIsListening(false);
          setIsProcessing(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setIsProcessing(false);
          recognitionRef.current = null;
        };

        recognition.start();
      } catch (err: unknown) {
        const errorObj = err as { name?: string };
        if (errorObj?.name !== 'InvalidStateError') {
          setError(t('voice.genericError', 'Voice input could not be started. Please try again.'));
        }
        setIsListening(false);
      }
    },
    [getRecognitionConstructor, language, stopListening, clearError, t]
  );

  const openVoiceModal = useCallback(() => {
    setIsModalOpen(true);
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    startListening();
  }, [startListening]);

  const closeVoiceModal = useCallback(() => {
    setIsModalOpen(false);
    stopListening();
  }, [stopListening]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Safe ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        isModalOpen,
        openVoiceModal,
        closeVoiceModal,
        isListening,
        isProcessing,
        isSupported,
        transcript,
        interimTranscript,
        error,
        activeLanguage: VOICE_LANGUAGE_MAP[language] || 'en-IN',
        startListening,
        stopListening,
        resetVoice,
        clearError,
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
