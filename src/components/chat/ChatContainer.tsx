import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../types/chat';
import { aiService } from '../../services/aiService';
import { useWeather } from '../../context/WeatherContext';
import { useVoice } from '../../context/VoiceContext';
import { ChatMessageItem } from './ChatMessageItem';
import { PromptSuggestions } from './PromptSuggestions';
import { Send, Mic, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ChatContainerProps {
  initialQuery?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ initialQuery }) => {
  const { activeLocationId } = useWeather();
  const { openVoiceModal } = useVoice();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState(initialQuery || '');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const initChat = async () => {
      setIsTyping(true);
      const greeting = await aiService.getInitialGreeting(activeLocationId);
      setMessages([greeting]);
      setIsTyping(false);

      if (initialQuery) {
        handleSendMessage(initialQuery);
      }
    };
    initChat();
  }, [activeLocationId]);

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
      const assistantMsg = await aiService.askWeatherGPT(queryText, activeLocationId);
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat generation error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'I apologize, but I encountered an error while synthesizing meteorological datasets. Please try asking again.',
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
    const greeting = await aiService.getInitialGreeting(activeLocationId);
    setMessages([greeting]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto rounded-2xl bg-navy-950/60 border border-slate-800/90 shadow-2xl overflow-hidden">
      {/* Chat Sub-Header */}
      <div className="px-5 py-3.5 bg-navy-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              WeatherGPT Met-Engine
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                AI reasoning v1.0
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Conversational synthesis of radar, satellite, and hazard models
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Clear & Reset Conversation"
          aria-label="Reset chat"
        >
          <RefreshCw className="w-4 h-4" />
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
              <span className="text-slate-400">WeatherGPT is synthesizing synoptic models</span>
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

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 md:p-4 bg-navy-900 border-t border-slate-800 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={openVoiceModal}
          className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-sky-400 hover:bg-slate-800 transition-colors shrink-0"
          title="Speak your question"
          aria-label="Voice input"
        >
          <Mic className="w-4.5 h-4.5" />
        </button>

        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask about rain, flood warnings, cyclone trajectory, farming advisory..."
          className="flex-1 h-11 px-4 bg-navy-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50"
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!inputQuery.trim() || isTyping}
          icon={<Send className="w-4 h-4" />}
          aria-label="Send message"
        >
          <span className="hidden sm:inline">Ask</span>
        </Button>
      </form>
    </div>
  );
};
