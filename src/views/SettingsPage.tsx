'use client';

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useWeather } from '../context/WeatherContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Settings, Globe2, Bell, Sliders, Eye, Mic, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { language, setLanguage, languages, t } = useLanguage();
  const { tempUnit, setTempUnit } = useWeather();

  const [notifications, setNotifications] = useState({
    severeWeather: true,
    rainfall: true,
    cyclone: true,
    flood: true,
    heatwave: false,
    dailyDigest: true,
  });

  const [accessibility, setAccessibility] = useState({
    reducedMotion: false,
    highContrast: false,
    screenReaderOptimized: false,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {t('settings.title', 'Platform Preferences & Governance')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t('settings.subtitle', 'Configure telemetry units, multilingual translation defaults, and emergency broadcast dispatch channels')}
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleSave}>
          {savedSuccess ? t('settings.savedSuccess', 'Settings Saved ✓') : t('settings.savePreferences', 'Save Preferences')}
        </Button>
      </div>

      {/* Language Selection */}
      <Card variant="glass" className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
          <Globe2 className="w-4 h-4" />
          <span>{t('settings.languageTitle', 'Multilingual Natural Language Interface (11 Regional Indian Languages)')}</span>
        </div>
        <p className="text-xs text-slate-400">
          {t('settings.languageDesc', 'Select primary regional language for conversational AI synthesis and emergency broadcast notifications.')}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2">
          {languages.map((l) => {
            const isSelected = l.code === language;
            return (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/15 text-white shadow-sm'
                    : 'border-slate-800 bg-navy-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{l.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">{l.nativeName}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Meteorological Units */}
      <Card variant="glass" className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <Sliders className="w-4 h-4" />
          <span>{t('settings.unitsTitle', 'Measurement Units & Engineering Baselines')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">
              {t('settings.tempUnit', 'Temperature Unit')}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTempUnit('C')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border ${
                  tempUnit === 'C'
                    ? 'bg-sky-500 text-navy-950 border-sky-400 font-bold'
                    : 'bg-navy-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t('settings.celsius', 'Celsius (°C) — IMD Standard')}
              </button>
              <button
                onClick={() => setTempUnit('F')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border ${
                  tempUnit === 'F'
                    ? 'bg-sky-500 text-navy-950 border-sky-400 font-bold'
                    : 'bg-navy-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t('settings.fahrenheit', 'Fahrenheit (°F)')}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">
              {t('settings.windPrecipTitle', 'Wind Velocity & Precipitation')}
            </label>
            <p className="text-xs text-slate-400 mt-2">
              {t('settings.windPrecipDesc', 'Wind: Kilometers per hour (km/h) | Rain: Millimeters (mm)')}
            </p>
          </div>
        </div>
      </Card>

      {/* Emergency Notification Alerts */}
      <Card variant="glass" className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
          <Bell className="w-4 h-4" />
          <span>{t('settings.notificationsTitle', 'Emergency Broadcast Channels')}</span>
        </div>
        <p className="text-xs text-slate-400">
          {t('settings.notificationsDesc', 'Subscribe to immediate high-priority emergency sirens and advisory bulletins.')}
        </p>

        <div className="space-y-2.5 pt-2">
          {[
            { key: 'severeWeather', title: 'Severe Cyclonic Storms & Gale Winds', desc: 'Alerts when coastal squalls exceed 65 kmph' },
            { key: 'rainfall', title: 'Heavy to Extremely Heavy Rainfall Alerts', desc: 'Rainfall exceeding 64.5 mm within 24 hours' },
            { key: 'flood', title: 'Riverine Flood & Waterlogging Notices', desc: 'River stages crossing warning / danger marks' },
            { key: 'heatwave', title: 'Heatwave & Severe Heatwave Warnings', desc: 'Max temperatures exceeding 42°C in plains' },
          ].map((item) => {
            const isChecked = (notifications as any)[item.key];
            return (
              <label
                key={item.key}
                className="flex items-start gap-3 p-3 rounded-xl bg-navy-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) =>
                    setNotifications({ ...notifications, [item.key]: e.target.checked })
                  }
                  className="mt-0.5 rounded border-slate-700 bg-navy-900 text-sky-500 focus:ring-sky-500/40"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">{item.title}</span>
                  <span className="text-slate-400">{item.desc}</span>
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Accessibility Controls */}
      <Card variant="glass" className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
          <Eye className="w-4 h-4" />
          <span>{t('settings.accessibilityTitle', 'Accessibility & Universal Design')}</span>
        </div>

        <div className="space-y-2.5">
          <label className="flex items-start gap-3 p-3 rounded-xl bg-navy-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={accessibility.reducedMotion}
              onChange={(e) =>
                setAccessibility({ ...accessibility, reducedMotion: e.target.checked })
              }
              className="mt-0.5 rounded border-slate-700 bg-navy-900 text-sky-500"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-200 block">{t('settings.reducedMotionTitle', 'Prefers Reduced Motion')}</span>
              <span className="text-slate-400">
                {t('settings.reducedMotionDesc', 'Disables continuous 3D Earth rotations and transitions for vestibular safety.')}
              </span>
            </div>
          </label>
        </div>
      </Card>
    </div>
  );
};
