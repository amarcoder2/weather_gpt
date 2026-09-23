import React from 'react';
import { ChatMessage } from '../../types/chat';
import { Bot, User, Database, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { RichWeatherCard } from './RichWeatherCard';
import { RichAlertCard } from './RichAlertCard';
import { RichAdvisoryCard } from './RichAdvisoryCard';

interface ChatMessageItemProps {
  message: ChatMessage;
  onFollowupSelect?: (query: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onFollowupSelect,
}) => {
  const { t } = useLanguage();
  const isAssistant = message.sender === 'assistant';

  // Basic markdown text rendering for bolding and bullets
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Parse bold tags **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-300">
            {formattedParts.slice(1)}
          </li>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-slate-300">
            {formattedParts}
          </li>
        );
      }
      return (
        <p key={idx} className={line.trim() === '' ? 'h-2' : 'mb-1 text-slate-200 leading-relaxed'}>
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div className={`flex gap-3.5 my-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-sky-500/20">
          <Bot className="w-4.5 h-4.5" />
        </div>
      )}

      <div
        className={`max-w-2xl rounded-2xl p-4.5 text-xs sm:text-sm ${
          isAssistant
            ? 'bg-navy-900/90 border border-slate-700/70 text-slate-100 shadow-xl'
            : 'bg-sky-600 text-white shadow-md'
        }`}
      >
        {/* Message Header */}
        <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/10 text-[11px] opacity-75">
          <span className="font-semibold">{isAssistant ? t('chat.assistantName') : t('chat.userName')}</span>
          <span className="font-mono">{message.timestamp}</span>
        </div>

        {/* Text Content */}
        <div className="space-y-1">{renderFormattedText(message.text)}</div>

        {/* Embedded Rich Card Payloads */}
        {message.cardType === 'weather' && message.cardData?.weather && (
          <RichWeatherCard weather={message.cardData.weather} />
        )}
        {message.cardType === 'alert' && message.cardData?.alert && (
          <RichAlertCard alert={message.cardData.alert} />
        )}
        {message.cardType === 'advisory' && message.cardData?.advisory && (
          <RichAdvisoryCard advisory={message.cardData.advisory} />
        )}

        {/* Source Attribution */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
            <Database className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="font-medium text-slate-400">{t('chat.dataFeeds')}</span>
            {message.sources.map((src, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]"
              >
                {src}
              </span>
            ))}
          </div>
        )}

        {/* Suggested Followups */}
        {message.suggestedFollowups && message.suggestedFollowups.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-400 mb-1.5 font-medium">{t('chat.relatedQuestions')}</p>
            <div className="flex flex-wrap gap-1.5">
              {message.suggestedFollowups.map((fu, idx) => (
                <button
                  key={idx}
                  onClick={() => onFollowupSelect && onFollowupSelect(fu)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700/60 transition-colors flex items-center gap-1"
                >
                  <span>{fu}</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
