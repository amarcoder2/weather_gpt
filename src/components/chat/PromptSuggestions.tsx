import React from 'react';
import { CHAT_SUGGESTIONS } from '../../services/aiService';
import { useLanguage } from '../../context/LanguageContext';
import { Sparkles } from 'lucide-react';

interface PromptSuggestionsProps {
  onSelect: (query: string) => void;
}

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ onSelect }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        <span>{t('chat.suggestedQueries')}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {CHAT_SUGGESTIONS.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(t(`chat.suggestion.${item.id}`, item.query))}
            className="text-xs px-3 py-1.5 rounded-full bg-navy-900 border border-slate-700/80 hover:border-sky-500/60 hover:bg-sky-500/10 text-slate-300 hover:text-sky-300 transition-all text-left"
          >
            {t(`chat.suggestion.${item.id}`, item.label)}
          </button>
        ))}
      </div>
    </div>
  );
};
