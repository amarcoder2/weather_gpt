import React from 'react';
import { WeatherVisualState, QualityLevel } from '../../types/visualWeather';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Eye,
  Thermometer,
  Wind,
  Disc,
  Moon,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

interface WeatherVisualControlsProps {
  activeState: WeatherVisualState;
  onStateChange: (state: WeatherVisualState) => void;
  isAutoMode: boolean;
  onToggleAuto: () => void;
  quality: QualityLevel;
  onQualityChange: (q: QualityLevel) => void;
}

export const WeatherVisualControls: React.FC<WeatherVisualControlsProps> = ({
  activeState,
  onStateChange,
  isAutoMode,
  onToggleAuto,
  quality,
  onQualityChange,
}) => {
  const states: { id: WeatherVisualState; label: string; icon: React.ReactNode }[] = [
    { id: 'clear', label: 'Clear Sky', icon: <Sun className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'cloudy', label: 'Cloudy', icon: <Cloud className="w-3.5 h-3.5 text-slate-300" /> },
    { id: 'rain', label: 'Rain', icon: <CloudRain className="w-3.5 h-3.5 text-sky-400" /> },
    { id: 'heavy-rain', label: 'Heavy Rain', icon: <CloudRain className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'thunderstorm', label: 'Thunderstorm', icon: <CloudLightning className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'fog', label: 'Fog / Mist', icon: <Eye className="w-3.5 h-3.5 text-slate-400" /> },
    { id: 'heat', label: 'Heatwave', icon: <Thermometer className="w-3.5 h-3.5 text-orange-400" /> },
    { id: 'wind', label: 'Gale Wind', icon: <Wind className="w-3.5 h-3.5 text-indigo-400" /> },
    { id: 'cyclone', label: 'Cyclone Eye', icon: <Disc className="w-3.5 h-3.5 text-purple-300" /> },
    { id: 'night', label: 'Night Sky', icon: <Moon className="w-3.5 h-3.5 text-sky-300" /> },
  ];

  return (
    <div className="p-2.5 rounded-2xl bg-navy-950/85 backdrop-blur-md border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-2 max-w-2xl mx-auto text-xs">
      {/* Auto vs Manual Mode */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleAuto}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
            isAutoMode
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Sync 3D Atmosphere with active observatory weather"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto Telemetry: {isAutoMode ? 'ON' : 'OFF'}</span>
        </button>

        <span className="text-slate-600 hidden sm:inline">|</span>

        {/* Quality Selector */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400">
          <span>Q:</span>
          {(['high', 'medium', 'low'] as QualityLevel[]).map((q) => (
            <button
              key={q}
              onClick={() => onQualityChange(q)}
              className={`px-1.5 py-0.5 rounded uppercase ${
                quality === q ? 'bg-sky-500 text-navy-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {q[0]}
            </button>
          ))}
        </div>
      </div>

      {/* State Switcher Buttons (scrollable on small screens) */}
      <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
        {states.map((st) => {
          const isActive = !isAutoMode && activeState === st.id;
          return (
            <button
              key={st.id}
              onClick={() => onStateChange(st.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-sky-500 text-navy-950 font-bold shadow-sm'
                  : 'bg-navy-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <span>{st.icon}</span>
              <span className="hidden md:inline">{st.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
