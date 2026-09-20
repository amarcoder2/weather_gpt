import React from 'react';
import { DailyForecast } from '../../types/forecast';
import { Card } from '../ui/Card';
import { useWeather } from '../../context/WeatherContext';
import { CloudRain, Sun, Cloud, CloudLightning, Wind, Droplets } from 'lucide-react';

interface SevenDayForecastListProps {
  dailyData: DailyForecast[];
}

export const SevenDayForecastList: React.FC<SevenDayForecastListProps> = ({ dailyData }) => {
  const { formatTemp } = useWeather();

  const getConditionMicroVisual = (code: string) => {
    switch (code) {
      case 'clear':
        return (
          <div className="relative p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 overflow-hidden group">
            <Sun className="w-6 h-6 text-amber-400 shrink-0 group-hover:rotate-45 transition-transform" />
            <div className="absolute inset-0 bg-amber-400/10 rounded-xl blur-sm animate-pulse-subtle" />
          </div>
        );
      case 'rain':
      case 'heavy-rain':
        return (
          <div className="relative p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 overflow-hidden">
            <CloudRain className="w-6 h-6 text-sky-400 shrink-0 animate-bounce" />
            <div className="absolute bottom-1 left-2 right-2 h-0.5 bg-sky-400/40 rounded-full animate-pulse" />
          </div>
        );
      case 'thunderstorm':
      case 'cyclonic-squall':
        return (
          <div className="relative p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 overflow-hidden">
            <CloudLightning className="w-6 h-6 text-purple-400 shrink-0 animate-[pulse_1.5s_infinite]" />
            <div className="absolute inset-0 bg-purple-400/10 rounded-xl blur-xs" />
          </div>
        );
      default:
        return (
          <div className="relative p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <Cloud className="w-6 h-6 text-slate-300 shrink-0" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      {dailyData.map((day) => (
        <Card
          key={day.date}
          variant="glass"
          hover
          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          {/* Day & Micro Weather Visual */}
          <div className="flex items-center gap-4 min-w-[200px]">
            {getConditionMicroVisual(day.conditionCode)}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{day.day}</span>
                <span className="text-xs text-slate-400 font-mono">({day.date})</span>
              </div>
              <p className="text-xs text-sky-300 font-medium">{day.condition}</p>
            </div>
          </div>

          {/* Narrative Summary */}
          <div className="hidden lg:block flex-1 max-w-md text-xs text-slate-300 leading-normal">
            {day.summary}
          </div>

          {/* Probability & Wind */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-sky-400 font-mono">
              <Droplets className="w-3.5 h-3.5" />
              <span className="font-semibold">{day.rainProb}%</span>
              <span className="text-[10px] text-slate-400">({day.rainfallMm} mm)</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300 font-mono">
              <Wind className="w-3.5 h-3.5 text-indigo-400" />
              <span>{day.windMax} km/h</span>
            </div>
          </div>

          {/* High / Low Temperature Range Bar */}
          <div className="flex items-center gap-3 min-w-[140px] justify-end">
            <span className="text-xs font-mono font-medium text-sky-300">
              {formatTemp(day.tempMin)}
            </span>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className="absolute inset-y-0 bg-gradient-to-r from-sky-400 via-amber-400 to-red-400 rounded-full"
                style={{
                  left: '15%',
                  right: '15%',
                }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-amber-300">
              {formatTemp(day.tempMax)}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
};
