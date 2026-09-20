import React from 'react';
import { WeatherData } from '../../types/weather';
import { useWeather } from '../../context/WeatherContext';
import {
  CloudRain,
  Sun,
  Cloud,
  CloudLightning,
  Wind,
  Droplets,
  Clock,
  Radio,
  Eye,
  Thermometer,
  Disc,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface CurrentWeatherHeroProps {
  weather: WeatherData;
}

export const CurrentWeatherHero: React.FC<CurrentWeatherHeroProps> = ({ weather }) => {
  const { formatTemp } = useWeather();

  const getConditionIcon = (code: string) => {
    switch (code) {
      case 'clear':
        return <Sun className="w-12 h-12 text-amber-400 animate-spin-slow" />;
      case 'rain':
      case 'heavy-rain':
        return <CloudRain className="w-12 h-12 text-sky-400 animate-pulse-subtle" />;
      case 'thunderstorm':
        return <CloudLightning className="w-12 h-12 text-purple-400 animate-bounce" />;
      case 'cyclonic-squall':
        return <Disc className="w-12 h-12 text-purple-400 animate-spin" />;
      case 'heatwave':
        return <Thermometer className="w-12 h-12 text-orange-400 animate-pulse" />;
      default:
        return <Cloud className="w-12 h-12 text-slate-300" />;
    }
  };

  // Weather-native atmospheric background effects
  const getAtmosphericBackdrop = (code: string) => {
    switch (code) {
      case 'rain':
      case 'heavy-rain':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 via-slate-900/50 to-navy-950" />
            {/* Ambient subtle rain streaks */}
            <div className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2 bg-[repeating-linear-gradient(105deg,rgba(56,189,248,0.15)_0,rgba(56,189,248,0.15)_1px,transparent_1px,transparent_24px)] animate-[pulse_1.5s_linear_infinite]" />
          </div>
        );
      case 'thunderstorm':
      case 'cyclonic-squall':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-purple-950/30 to-navy-950" />
            <div className="absolute top-0 right-10 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
          </div>
        );
      case 'heatwave':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/40 via-orange-950/20 to-navy-950" />
            <div className="absolute top-0 right-10 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />
          </div>
        );
      default:
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl" />
          </div>
        );
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900/95 via-navy-850 to-navy-900/95 border border-slate-700/80 p-6 md:p-8 shadow-2xl">
      {/* Weather-native Dynamic Backdrop */}
      {getAtmosphericBackdrop(weather.conditionCode)}

      {/* Header Bar: Location, Observatory & Freshness */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white font-sans tracking-tight">
              {weather.locationName}
            </h2>
            <Badge variant="primary">{weather.district}</Badge>
            <span className="text-xs text-slate-400 font-medium">({weather.state})</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Observatory: <strong className="text-slate-200">{weather.stationName}</strong></span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-[11px] text-slate-500">{weather.lat.toFixed(2)}°N, {weather.lon.toFixed(2)}°E</span>
          </p>
        </div>

        {/* Data Freshness Tag */}
        <div className="flex items-center gap-2 bg-navy-950/80 px-3 py-1.5 rounded-full border border-slate-800 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>Telemetry Freshness: <span className="text-slate-200 font-medium">{weather.updatedTime}</span></span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Main Hero Metrics Area */}
      <div className="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Huge Temperature & Weather State */}
        <div className="md:col-span-7 flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800 shrink-0 shadow-lg">
            {getConditionIcon(weather.conditionCode)}
          </div>

          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl md:text-7xl font-extrabold text-white tracking-tight tabular-numbers font-sans drop-shadow-md">
                {formatTemp(weather.temperature)}
              </span>
              <div className="space-y-0.5">
                <span className="text-xs font-mono text-slate-400 block">
                  Feels like: <strong className="text-slate-200">{formatTemp(weather.feelsLike)}</strong>
                </span>
                <span className="text-xs font-mono text-slate-400 block">
                  H: <strong className="text-amber-300">{formatTemp(weather.tempMax)}</strong> · L: <strong className="text-sky-300">{formatTemp(weather.tempMin)}</strong>
                </span>
              </div>
            </div>

            <p className="text-base md:text-lg font-bold text-sky-300 mt-2 flex items-center gap-2">
              <span>{weather.condition}</span>
            </p>
            <p className="text-xs text-slate-300 mt-1 max-w-md leading-relaxed">
              Active observation indicates monsoonal convergence across Gangetic basin with Doppler radar reflectivity showing precipitation cells.
            </p>
          </div>
        </div>

        {/* Right: Quick Synoptic Snapshot Card */}
        <div className="md:col-span-5 grid grid-cols-2 gap-3 p-4 rounded-2xl bg-navy-950/70 border border-slate-800/80 backdrop-blur-md">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              Precip Probability
            </span>
            <p className="text-xl font-extrabold text-sky-300 tabular-numbers">
              {weather.precipitationProbability}%
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-indigo-400" />
              Surface Wind
            </span>
            <p className="text-lg font-bold text-slate-200 tabular-numbers">
              {weather.windSpeed} <span className="text-xs font-normal text-slate-400">km/h ({weather.windDirection})</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              Optical Visibility
            </span>
            <p className="text-lg font-bold text-slate-200 tabular-numbers">
              {weather.visibility} <span className="text-xs font-normal text-slate-400">km</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              UV Index
            </span>
            <p className="text-lg font-bold text-amber-300 tabular-numbers">
              {weather.uvIndex} <span className="text-xs font-normal text-slate-400">/ 11 (High)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
