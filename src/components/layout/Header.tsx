'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Mic,
  Globe2,
  MapPin,
  ChevronDown,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useWeather } from '../../context/WeatherContext';
import { useLanguage } from '../../context/LanguageContext';
import { useVoice } from '../../context/VoiceContext';
import { DEFAULT_LOCATIONS, SIH_METADATA } from '../../config/constants';
import { Badge } from '../ui/Badge';

interface HeaderProps {
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications }) => {
  const { activeLocationId, setActiveLocationId, weather } = useWeather();
  const { language, setLanguage, languages, t } = useLanguage();
  const { openVoiceModal } = useVoice();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if matches location
    const matchedLoc = DEFAULT_LOCATIONS.find((l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (matchedLoc) {
      setActiveLocationId(matchedLoc.id);
      router.push('/dashboard');
    } else {
      // Navigate to chat with query
      router.push(`/chat?q=${encodeURIComponent(searchQuery)}`);
    }
    setSearchQuery('');
  };

  const activeLocObj =
    DEFAULT_LOCATIONS.find((l) => l.id === activeLocationId) || DEFAULT_LOCATIONS[0];

  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-navy-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Brand / Logo (Mobile & Desktop) */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-glow-cyan">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center overflow-hidden">
              <img src="/weathergpt-logo.svg" alt="WeatherGPT" className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-lg text-white font-sans">
                Weather<span className="text-sky-400">GPT</span>
              </span>
              <span className="hidden lg:inline-flex px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                MoES · IMD
              </span>
            </div>
            <p className="hidden md:block text-[10px] text-slate-400 font-medium">
              Govt. of India · Problem #26068
            </p>
          </div>
        </Link>
      </div>

      {/* Center Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex flex-1 max-w-md items-center relative"
      >
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('header.search', 'Ask WeatherGPT or search city, district, alerts...')}
          className="w-full h-9.5 pl-10 pr-24 bg-navy-900/90 border border-slate-700/70 rounded-full text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/50 transition-all"
        />
        <div className="absolute right-2 flex items-center gap-1">
          <button
            type="button"
            onClick={openVoiceModal}
            className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-full transition-colors"
            title="Voice query"
            aria-label="Voice search"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ↵ Enter
          </span>
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Demo Indicator */}
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Demo Data
        </span>

        {/* Location Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy-900 border border-slate-700/80 text-xs text-slate-200 hover:border-sky-500/50 transition-colors"
            aria-haspopup="listbox"
            aria-expanded={isLocationDropdownOpen}
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="max-w-[85px] sm:max-w-[120px] truncate font-medium">
              {activeLocObj.name}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isLocationDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-navy-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Observatory
              </div>
              {DEFAULT_LOCATIONS.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    setActiveLocationId(loc.id);
                    setIsLocationDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    loc.id === activeLocationId
                      ? 'text-sky-400 font-semibold bg-sky-500/10'
                      : 'text-slate-300'
                  }`}
                >
                  <div>
                    <p>{loc.name}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{loc.state}</p>
                  </div>
                  {loc.stationCode && (
                    <span className="text-[10px] font-mono text-slate-500">{loc.stationCode}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="p-2 rounded-lg bg-navy-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            title="Change Language"
            aria-label="Language selection"
          >
            <Globe2 className="w-4 h-4" />
          </button>

          {isLangDropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-navy-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Languages (भाषा)
              </div>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    lang.code === language ? 'text-sky-400 font-semibold bg-sky-500/10' : 'text-slate-300'
                  }`}
                >
                  <span>{lang.name}</span>
                  <span className="text-[11px] text-slate-400">{lang.nativeName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Voice Trigger Button */}
        <button
          onClick={openVoiceModal}
          className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 hover:border-sky-400 transition-colors"
          title="Voice Command & Speech Assistant"
          aria-label="Voice input"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Notifications / Alert Center Trigger */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg bg-navy-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          title="Active Alerts & Bulletins"
          aria-label="Disaster Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
};
