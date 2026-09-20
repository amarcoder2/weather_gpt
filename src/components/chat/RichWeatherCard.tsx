import React from 'react';
import { WeatherData } from '../../types/weather';
import { Card } from '../ui/Card';
import { Droplets, Wind, Compass } from 'lucide-react';
import { useWeather } from '../../context/WeatherContext';

export const RichWeatherCard: React.FC<{ weather: WeatherData }> = ({ weather }) => {
  const { formatTemp } = useWeather();

  return (
    <Card variant="glass" className="p-4 my-2 border-sky-500/30 bg-navy-900/90 max-w-md">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
            Live Station Reading
          </span>
          <h4 className="text-base font-bold text-white">{weather.locationName}</h4>
        </div>
        <span className="text-3xl font-extrabold text-white tabular-numbers font-sans">
          {formatTemp(weather.temperature)}
        </span>
      </div>

      <p className="text-xs text-sky-300 font-medium mt-1">{weather.condition}</p>

      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Droplets className="w-3.5 h-3.5 text-sky-400" />
          <span>{weather.humidity}% Hum</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Wind className="w-3.5 h-3.5 text-indigo-400" />
          <span>{weather.windSpeed} km/h</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>{weather.pressure} hPa</span>
        </div>
      </div>
    </Card>
  );
};
