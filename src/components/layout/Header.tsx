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
  Navigation,
  User,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { useWeather } from '../../context/WeatherContext';
import { useLanguage } from '../../context/LanguageContext';
import { useVoice } from '../../context/VoiceContext';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_LOCATIONS } from '../../config/constants';
import { Button } from '../ui/Button';

interface HeaderProps {
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications }) => {
  const {
    activeLocationId,
    setActiveLocationId,
    activeLocation,
    isUsingCurrentLocation,
    detectAndSetCurrentLocation,
    locationLoading,
  } = useWeather();
  const { language, setLanguage, languages, t } = useLanguage();
  const { openVoiceModal } = useVoice();
  const { user, isAuthenticated, logout, role } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const q = searchQuery.toLowerCase().trim();

    // Special GPS triggers
    if (q === 'my location' || q === 'current location' || q === 'here' || q === 'gps' || q === 'near me') {
      await detectAndSetCurrentLocation();
      router.push('/dashboard');
      setSearchQuery('');
      return;
    }

    // Check if matches location
    const matchedLoc = DEFAULT_LOCATIONS.find(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.district.toLowerCase().includes(q) ||
        l.state.toLowerCase().includes(q)
    );

    if (matchedLoc) {
      setActiveLocationId(matchedLoc.id);
      router.push('/dashboard');
    } else {
      router.push(`/chat?q=${encodeURIComponent(searchQuery)}`);
    }
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-navy-950/85 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between gap-3">
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
          placeholder={t('header.search', 'Ask AI or type "my location", city, alerts...')}
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
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Location Dropdown & GPS Selector */}
        <div className="relative">
          <button
            onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
              isUsingCurrentLocation
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-navy-900 border-slate-700/80 text-slate-200 hover:border-sky-500/50'
            }`}
            aria-haspopup="listbox"
            aria-expanded={isLocationDropdownOpen}
          >
            <MapPin className={`w-3.5 h-3.5 shrink-0 ${isUsingCurrentLocation ? 'text-emerald-400 animate-pulse' : 'text-sky-400'}`} />
            <span className="max-w-[75px] sm:max-w-[110px] truncate font-medium">
              {activeLocation.name}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isLocationDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-navy-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95">
              {/* Option 1: Current GPS Location Action */}
              <button
                onClick={async () => {
                  await detectAndSetCurrentLocation();
                  setIsLocationDropdownOpen(false);
                  router.push('/dashboard');
                }}
                disabled={locationLoading}
                className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-2.5 border-b border-slate-800 transition-colors ${
                  isUsingCurrentLocation
                    ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                    : 'text-slate-100 hover:bg-slate-800'
                }`}
              >
                <Navigation className={`w-4 h-4 text-emerald-400 shrink-0 ${locationLoading ? 'animate-spin' : ''}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">📍 Use Current Location</span>
                    {isUsingCurrentLocation && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {locationLoading ? 'Acquiring GPS fix...' : 'Live browser coordinates & telemetry'}
                  </p>
                </div>
              </button>

              <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                IMD Observatories
              </div>

              <div className="max-h-56 overflow-y-auto">
                {DEFAULT_LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setActiveLocationId(loc.id);
                      setIsLocationDropdownOpen(false);
                      router.push('/dashboard');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      !isUsingCurrentLocation && loc.id === activeLocationId
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

        {/* Notifications Trigger */}
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

        {/* User Profile / Auth State */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-navy-900 border border-slate-700/80 hover:border-slate-600 transition-colors"
              aria-label="User profile menu"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-semibold text-slate-200 block max-w-[85px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <span className={`text-[9px] font-mono font-bold uppercase ${role === 'admin' ? 'text-amber-400' : 'text-sky-400'}`}>
                  {role}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-navy-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-2.5 border-b border-slate-800 space-y-0.5">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  <span className={`inline-block mt-1 text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                    role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  }`}>
                    Role: {role}
                  </span>
                </div>

                {role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 text-amber-300 hover:bg-slate-800 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin Operations Console</span>
                  </Link>
                )}

                <Link
                  href="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account Settings</span>
                </Link>

                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await logout();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/register" className="hidden sm:inline-block">
              <Button variant="primary" size="sm">
                Register
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
