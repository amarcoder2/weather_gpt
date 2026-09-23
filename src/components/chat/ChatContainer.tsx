import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../types/chat';
import { LocationInfo } from '../../types/location';
import { aiService } from '../../services/aiService';
import { useWeather } from '../../context/WeatherContext';
import { useVoice } from '../../context/VoiceContext';
import { useLanguage } from '../../context/LanguageContext';
import { ChatMessageItem } from './ChatMessageItem';
import { PromptSuggestions } from './PromptSuggestions';
import { Send, Mic, MicOff, Sparkles, RefreshCw, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';

interface ChatContainerProps {
  initialQuery?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ initialQuery }) => {
  const { activeLocation, activeLocationId, currentLocation } = useWeather();
  const {
    isListening,
    startListening,
    stopListening,
    error: voiceError,
    clearError: clearVoiceError,
    isSupported: isVoiceSupported,
    interimTranscript,
  } = useVoice();
  const { language, t } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState(initialQuery || '');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationLocation, setConversationLocation] = useState<LocationInfo | null>(null);
  const conversationLocationRef = useRef<LocationInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastInitialQueryRef = useRef<string | null>(initialQuery || null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const initChat = async () => {
      setIsTyping(true);
      const greeting = await aiService.getInitialGreeting(activeLocation, language);
      setMessages([greeting]);
      setIsTyping(false);

      if (initialQuery) {
        handleSendMessage(initialQuery);
      }
    };
    initChat();
  }, [activeLocationId, language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const assistantMsg = await aiService.askWeatherGPT(queryText, {
        activeLocation,
        activeLocationId,
        conversationLocation: conversationLocationRef.current,
        currentLocation,
        language,
      });

      setMessages((prev) => [...prev, assistantMsg]);

      // Phase 12: Update conversation context memory when explicit query establishes a location
      if (assistantMsg.resolvedLocation && assistantMsg.locationSource === 'explicit_query') {
        conversationLocationRef.current = assistantMsg.resolvedLocation;
        setConversationLocation(assistantMsg.resolvedLocation);
      }
    } catch (err) {
      console.error('Chat generation error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: t('chat.errorMessage'),
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputQuery);
  };

  const handleResetChat = async () => {
    setIsTyping(true);
    conversationLocationRef.current = null;
    setConversationLocation(null);
    const greeting = await aiService.getInitialGreeting(activeLocation, language);
    setMessages([greeting]);
    setIsTyping(false);
  };

  // Sync initial query if navigated from external or voice assistant
  useEffect(() => {
    if (initialQuery && initialQuery.trim() && lastInitialQueryRef.current !== initialQuery) {
      lastInitialQueryRef.current = initialQuery;
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      clearVoiceError();
      startListening({
        onFinalTranscript: (text) => {
          if (!text || !text.trim()) return;
          setInputQuery((prev) => {
            const trimmedPrev = prev.trim();
            const trimmedText = text.trim();
            return trimmedPrev ? `${trimmedPrev} ${trimmedText}` : trimmedText;
          });
        },
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] max-h-[800px] bg-navy-950/70 backdrop-blur-md rounded-2xl border border-slate-800 shadow-glass overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3.5 bg-navy-900/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">
            {t('chat.meteorologicalCore')}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            Open-Meteo NWP · Active Telemetry
          </span>
          {conversationLocation && (
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <MapPin className="w-2.5 h-2.5" />
              Focus: {conversationLocation.name}
            </span>
          )}
        </div>

        <button
          onClick={handleResetChat}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          title={t('chat.resetConversation')}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('chat.resetButton')}</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-2">
        {messages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            onFollowupSelect={(q) => handleSendMessage(q)}
          />
        ))}

        {/* Typing Animation State */}
        {isTyping && (
          <div className="flex items-center gap-3 my-3 text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-navy-900 border border-slate-800 flex items-center gap-1.5">
              <span className="text-slate-400">{t('chat.synthesizing')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips Bar */}
      <div className="px-4 md:px-6 py-2.5 bg-navy-900/60 border-t border-slate-800/80">
        <PromptSuggestions onSelect={(q) => handleSendMessage(q)} />
      </div>

      {/* Voice Listening Active Banner */}
      {isListening && (
        <div className="px-4 py-2 bg-navy-950/90 border-t border-sky-500/30 flex items-center justify-between gap-2 text-xs text-sky-400">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
            <span className="font-semibold text-slate-200">
              {t('voice.listening', 'Listening...')}
            </span>
            <span className="text-slate-400 truncate italic">
              {interimTranscript ? `“${interimTranscript}”` : t('voice.prompt', 'Speak your query...')}
            </span>
          </div>
          <button
            type="button"
            onClick={stopListening}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono shrink-0 transition-colors"
          >
            {t('voice.stop', 'Done')}
          </button>
        </div>
      )}

      {/* Voice Error Banner */}
      {voiceError && !isListening && (
        <div className="px-4 py-2 bg-red-950/40 border-t border-red-800/50 flex items-center justify-between gap-2 text-xs text-red-300">
          <span className="truncate">{voiceError}</span>
          <button
            type="button"
            onClick={clearVoiceError}
            className="text-red-400 hover:text-red-200 text-xs shrink-0 font-bold px-1"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 md:p-4 bg-navy-900 border-t border-slate-800 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={handleToggleVoice}
          className={`p-2.5 rounded-xl border transition-all shrink-0 flex items-center justify-center ${
            isListening
              ? 'bg-red-500/20 border-red-500/80 text-red-400 ring-2 ring-red-500/40 animate-pulse'
              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-sky-400 hover:bg-slate-800'
          }`}
          title={isListening ? t('voice.stop', 'Stop voice input') : t('chat.voiceInput', 'Speak your question')}
          aria-label={isListening ? t('voice.stop', 'Stop voice input') : t('chat.voiceInput', 'Speak your question')}
          aria-pressed={isListening}
        >
          {isListening ? (
            <MicOff className="w-4.5 h-4.5" />
          ) : (
            <Mic className="w-4.5 h-4.5" />
          )}
        </button>

        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={t('chat.inputPlaceholder')}
          className="flex-1 h-11 px-4 bg-navy-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50"
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!inputQuery.trim() || isTyping}
          icon={<Send className="w-4 h-4" />}
          aria-label={t('chat.askButton')}
        >
          <span className="hidden sm:inline">{t('chat.askButton')}</span>
        </Button>
      </form>
    </div>
  );
};
